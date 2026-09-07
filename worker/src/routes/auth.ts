import type { DeveloperOrganizationRow, Env, UserRole, UserRow } from "../types";
import { signJwt, verifySsoSignature, signSsoPayload } from "../utils/crypto";
import { errorResponse, jsonResponse } from "../utils/response";
import { getAuthenticatedUser } from "../middleware/auth";

interface SsoRequestPayload {
  sso_token: string;
}

interface SsoIssueRequestPayload {
  audience: string;
  nonce: string;
}

interface MockLoginPayload {
  role?: UserRole;
  principal_id?: string;
  email?: string;
  is_email_verified?: boolean;
}

interface UpdateProfilePayload {
  email?: string;
  tos_accepted_version?: string;
  kyc_status?: string;
}

export async function handleAuthRoutes(
  request: Request,
  env: Env,
): Promise<Response | null> {
  const url = new URL(request.url);
  const { pathname } = url;
  const method = request.method;

  if (method === "POST" && pathname === "/api/auth/sso/issue") {
    return handleSsoIssue(request, env);
  }

  if (method === "POST" && (pathname === "/api/auth/sso" || pathname === "/verifyRandseedSSO")) {
    return handleSsoExchange(request, env);
  }

  if (method === "GET" && pathname === "/api/auth/me") {
    return handleGetMe(request, env);
  }

  if (method === "POST" && pathname === "/api/auth/become-creator") {
    return handleBecomeCreator(request, env);
  }

  if (method === "POST" && pathname === "/api/auth/mock-login") {
    return handleMockLogin(request, env);
  }

  if (method === "PUT" && pathname === "/api/auth/profile") {
    return handleUpdateProfile(request, env);
  }

  return null;
}

async function handleBecomeCreator(request: Request, env: Env): Promise<Response> {
  const authUser = await getAuthenticatedUser(request, env);
  if (!authUser) {
    return errorResponse("Unauthorized", 401, "UNAUTHORIZED", request, env);
  }

  if (authUser.role === "admin" || authUser.role === "creator") {
    return jsonResponse({ success: true, role: authUser.role }, 200, request, env);
  }

  await env.DB.prepare(
    "UPDATE users SET role = 'creator', updated_at = ? WHERE principal_id = ?",
  )
    .bind(Date.now(), authUser.principal_id)
    .run();

  return jsonResponse({ success: true, role: "creator" }, 200, request, env);
}

async function handleSsoIssue(
  request: Request,
  env: Env,
): Promise<Response> {
  try {
    const authUser = await getAuthenticatedUser(request, env);
    if (!authUser) {
      return errorResponse("An authenticated issuer session is required", 401, "UNAUTHORIZED_ISSUER", request, env);
    }

    const body = (await request.json().catch(() => null)) as SsoIssueRequestPayload | null;
    if (
      !body
      || body.audience !== "gamecreator"
      || typeof body.nonce !== "string"
      || !/^[0-9a-f]{32}$/i.test(body.nonce)
    ) {
      return errorResponse("Invalid SSO audience or nonce", 400, "INVALID_SSO_REQUEST", request, env);
    }

    const now = Date.now();
    const payload = {
      principal_id: authUser.principal_id,
      email: authUser.email || null,
      is_email_verified: Boolean(authUser.is_email_verified),
      timestamp: now,
      nonce: body.nonce,
      audience: "gamecreator",
      issuer: env.MAIN_SITE_URL || "randseed",
    };

    const payloadString = JSON.stringify(payload);
    let signature: string;

    if (env.RANDSEED_PRIVATE_KEY) {
      signature = await signSsoPayload(payloadString, env.RANDSEED_PRIVATE_KEY);
    } else if (env.ENVIRONMENT !== "production") {
      // Safe development signature for local and testing environments
      signature = "dev_signed";
    } else {
      return errorResponse("SSO private key not configured", 500, "SSO_ISSUER_NOT_CONFIGURED", request, env);
    }

    const token = btoa(JSON.stringify({ payload, signature }));
    return jsonResponse({ success: true, token }, 200, request, env);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Internal error during SSO issuance";
    return errorResponse(msg, 500, "SSO_ISSUE_ERROR", request, env);
  }
}

async function handleSsoExchange(
  request: Request,
  env: Env,
): Promise<Response> {
  try {
    const body = (await request.json().catch(() => null)) as SsoRequestPayload | null;
    if (!body || !body.sso_token) {
      return errorResponse("Missing sso_token parameter", 400, "MISSING_SSO_TOKEN", request, env);
    }

    const { sso_token } = body;
    const now = Date.now();

    // 1. Resolve SSO Identity from token
    let principalId: string;
    let email: string | null = null;
    let isEmailVerified = false;
    let initialRole: UserRole = "player";

    const isProduction = env.ENVIRONMENT === "production" || env.MAIN_SITE_URL === "https://creator.randseed.org";
    if ((sso_token.startsWith("mock_") || sso_token.startsWith("jwt_mock_")) && !isProduction) {
      // Mock / Dev Token Parsing
      if (sso_token.includes("admin")) {
        initialRole = "admin";
        principalId = `randseed:usr_admin_${sso_token.substring(0, 6)}`;
        email = "admin@randseed.org";
        isEmailVerified = true;
      } else if (sso_token.includes("creator")) {
        initialRole = "creator";
        const parts = sso_token.split("_");
        principalId = parts[2] && parts[2].length >= 5 ? parts[2] : `randseed:usr_creator_${sso_token.substring(0, 6)}`;
        email = "creator@example.com";
        isEmailVerified = sso_token.includes("verified");
      } else {
        initialRole = "player";
        principalId = `randseed:usr_player_${sso_token.substring(0, 6)}`;
        email = "player@example.com";
        isEmailVerified = sso_token.includes("verified");
      }
    } else if (sso_token.startsWith("mock_") || sso_token.startsWith("jwt_mock_")) {
      return errorResponse("Mock SSO tokens are disabled in production", 401, "MOCK_SSO_DISABLED", request, env);
    } else {
      // Real SSO Token Exchange (Base64 / Token / Worker Exchange)
      try {
        const rawToken = sso_token.trim();
        // Support JSON base64 encoded structure: { payload: { principal_id, email, is_email_verified, timestamp, nonce }, signature }
        let parsed: any;
        try {
          parsed = JSON.parse(atob(rawToken));
        } catch {
          parsed = JSON.parse(rawToken);
        }

        if (parsed && parsed.payload && parsed.signature) {
          const payload = parsed.payload;
          const signature = parsed.signature;
          const payloadTimestamp = Number(payload.timestamp || 0);

          if (payload.audience !== "gamecreator") {
            return errorResponse("Invalid SSO audience", 401, "INVALID_AUDIENCE", request, env);
          }

          if (payload.issuer !== (env.MAIN_SITE_URL || "randseed")) {
            return errorResponse("Invalid SSO issuer", 401, "INVALID_ISSUER", request, env);
          }

          // 60-second expiration check
          if (Math.abs(now - payloadTimestamp) > 60 * 1000) {
            return errorResponse("SSO Token has expired", 401, "TOKEN_EXPIRED", request, env);
          }

          // Anti-replay check with used_sso_nonces
          if (payload.nonce) {
            const existingNonce = await env.DB.prepare(
              "SELECT nonce FROM used_sso_nonces WHERE nonce = ?"
            )
              .bind(payload.nonce)
              .first();

            if (existingNonce) {
              return errorResponse("SSO Token has already been used", 409, "TOKEN_REPLAYED", request, env);
            }
          }

          // Verify signature if public key is configured
          if (env.RANDSEED_PUBLIC_KEY) {
            const payloadString = typeof parsed.payload === "string" ? parsed.payload : JSON.stringify(parsed.payload);
            const isValid = await verifySsoSignature(payloadString, signature, env.RANDSEED_PUBLIC_KEY);
            if (!isValid) {
              return errorResponse("Invalid SSO signature", 401, "INVALID_SIGNATURE", request, env);
            }
          } else if (signature === "dev_signed" && env.ENVIRONMENT !== "production" && !env.MAIN_SITE_URL?.includes("creator.randseed.org")) {
            // Safe development signature for local/dev
          } else {
            return errorResponse("SSO signature verification key is not configured", 500, "SSO_CONFIG_ERROR", request, env);
          }

          // Consume the nonce atomically so concurrent exchanges cannot both succeed.
          if (payload.nonce) {
            const nonceInsert = await env.DB.prepare(
              "INSERT OR IGNORE INTO used_sso_nonces (nonce, principal_id, expires_at, created_at) VALUES (?, ?, ?, ?)"
            )
              .bind(payload.nonce, payload.principal_id, now + 120_000, now)
              .run();

            if (!nonceInsert.meta?.changes) {
              return errorResponse("SSO Token has already been used", 409, "TOKEN_REPLAYED", request, env);
            }
          }

          principalId = payload.principal_id;
          email = payload.email || null;
          isEmailVerified = Boolean(payload.is_email_verified);
          initialRole = "player";
        } else {
          return errorResponse("Invalid SSO token structure", 401, "INVALID_SSO_TOKEN", request, env);
        }
      } catch (e) {
        return errorResponse("Invalid SSO token format", 401, "INVALID_SSO_TOKEN", request, env);
      }
    }

    // 2. Query existing Shadow User from D1
    const existingUser = await env.DB.prepare(
      "SELECT * FROM users WHERE principal_id = ?",
    )
      .bind(principalId)
      .first<UserRow>();

    const configuredAdminEmails = (env.ADMIN_EMAILS || "")
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);
    let userRole: UserRole = email && configuredAdminEmails.includes(email.trim().toLowerCase())
      ? "admin"
      : initialRole;

    if (existingUser) {
      // User already exists in D1, preserve established role and update login timestamp
      userRole = configuredAdminEmails.includes((email || existingUser.email || "").trim().toLowerCase())
        ? "admin"
        : existingUser.role || initialRole;
      await env.DB.prepare(
        `UPDATE users 
         SET last_login_at = ?, 
             email = COALESCE(?, email), 
             email_verified = COALESCE(?, email_verified),
             updated_at = ?
         WHERE principal_id = ?`,
      )
        .bind(now, email, isEmailVerified ? 1 : 0, now, principalId)
        .run();
    } else {
      // Insert new Shadow User into D1
      await env.DB.prepare(
        `INSERT INTO users (
           principal_id, role, email, email_verified, 
           last_login_at, created_at, updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
        .bind(
          principalId,
          userRole,
          email,
          isEmailVerified ? 1 : 0,
          now,
          now,
          now,
        )
        .run();
    }

    // 3. Query existing Organization if any
    const organization = await env.DB.prepare(
      "SELECT * FROM developer_organizations WHERE owner_principal = ?",
    )
      .bind(principalId)
      .first<DeveloperOrganizationRow>();

    // 4. Issue Portal JWT session token
    const token = await signJwt(
      {
        principal_id: principalId,
        role: userRole,
        email: email ?? undefined,
        is_email_verified: isEmailVerified,
      },
      env.JWT_SECRET,
    );

    const userProfile = {
      principal_id: principalId,
      role: userRole,
      email: email,
      isEmailVerified: isEmailVerified,
      lastPortalLoginAt: now,
    };

    return jsonResponse(
      {
        success: true,
        token,
        customToken: token,
        uid: principalId,
        user: userProfile,
        organization: organization ?? null,
      },
      200,
      request,
      env,
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Internal server error during SSO";
    return errorResponse(msg, 500, "SSO_ERROR", request, env);
  }
}

async function handleGetMe(
  request: Request,
  env: Env,
): Promise<Response> {
  const authUser = await getAuthenticatedUser(request, env);
  if (!authUser) {
    return errorResponse("Unauthorized", 401, "UNAUTHORIZED", request, env);
  }

  const user = await env.DB.prepare(
    "SELECT * FROM users WHERE principal_id = ?",
  )
    .bind(authUser.principal_id)
    .first<UserRow>();

  if (!user) {
    return errorResponse("User not found", 404, "USER_NOT_FOUND", request, env);
  }

  const organization = await env.DB.prepare(
    "SELECT * FROM developer_organizations WHERE owner_principal = ?",
  )
    .bind(authUser.principal_id)
    .first<DeveloperOrganizationRow>();

  const token = await signJwt(
    {
      principal_id: user.principal_id,
      role: user.role,
      email: user.email ?? undefined,
      is_email_verified: user.email_verified === 1,
    },
    env.JWT_SECRET,
  );

  return jsonResponse(
    {
      success: true,
      token,
      user: {
        principal_id: user.principal_id,
        role: user.role,
        email: user.email,
        isEmailVerified: user.email_verified === 1,
        tosAcceptedVersion: user.tos_accepted_version,
        kycStatus: user.kyc_status,
        lastLoginAt: user.last_login_at,
        createdAt: user.created_at,
      },
      organization: organization ?? null,
    },
    200,
    request,
    env,
  );
}

async function handleMockLogin(
  request: Request,
  env: Env,
): Promise<Response> {
  try {
    const body = (await request.json().catch(() => ({}))) as MockLoginPayload;
    const role: UserRole = body.role ?? "creator";
    const principalId = body.principal_id ?? `randseed:usr_${role}_${Math.random().toString(36).substring(2, 8)}`;
    const email = body.email ?? `${role}@example.com`;
    const isEmailVerified = body.is_email_verified ?? true;
    const now = Date.now();

    await env.DB.prepare(
      `INSERT INTO users (
         principal_id, role, email, email_verified, 
         last_login_at, created_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(principal_id) DO UPDATE SET 
         role = excluded.role,
         last_login_at = excluded.last_login_at,
         updated_at = excluded.updated_at`,
    )
      .bind(
        principalId,
        role,
        email,
        isEmailVerified ? 1 : 0,
        now,
        now,
        now,
      )
      .run();

    const organization = await env.DB.prepare(
      "SELECT * FROM developer_organizations WHERE owner_principal = ?",
    )
      .bind(principalId)
      .first<DeveloperOrganizationRow>();

    const token = await signJwt(
      {
        principal_id: principalId,
        role,
        email,
        is_email_verified: isEmailVerified,
      },
      env.JWT_SECRET,
    );

    return jsonResponse(
      {
        success: true,
        token,
        customToken: token,
        uid: principalId,
        user: {
          principal_id: principalId,
          role,
          email,
          isEmailVerified,
          lastPortalLoginAt: now,
        },
        organization: organization ?? null,
      },
      200,
      request,
      env,
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Mock login failed";
    return errorResponse(msg, 500, "MOCK_LOGIN_FAILED", request, env);
  }
}

async function handleUpdateProfile(
  request: Request,
  env: Env,
): Promise<Response> {
  const authUser = await getAuthenticatedUser(request, env);
  if (!authUser) {
    return errorResponse("Unauthorized", 401, "UNAUTHORIZED", request, env);
  }

  const body = (await request.json().catch(() => null)) as UpdateProfilePayload | null;
  if (!body) {
    return errorResponse("Invalid body", 400, "INVALID_BODY", request, env);
  }

  const now = Date.now();
  await env.DB.prepare(
    `UPDATE users 
     SET email = COALESCE(?, email),
         tos_accepted_version = COALESCE(?, tos_accepted_version),
         kyc_status = COALESCE(?, kyc_status),
         updated_at = ?
     WHERE principal_id = ?`,
  )
    .bind(
      body.email ?? null,
      body.tos_accepted_version ?? null,
      body.kyc_status ?? null,
      now,
      authUser.principal_id,
    )
    .run();

  return jsonResponse({ success: true, message: "Profile updated successfully" }, 200, request, env);
}
