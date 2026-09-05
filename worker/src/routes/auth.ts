import type { DeveloperOrganizationRow, Env, UserRole, UserRow } from "../types";
import { signJwt, verifySsoSignature } from "../utils/crypto";
import { errorResponse, jsonResponse } from "../utils/response";
import { getAuthenticatedUser } from "../middleware/auth";

interface SsoRequestPayload {
  sso_token: string;
}

interface MockLoginPayload {
  role?: UserRole;
  principal_id?: string;
  email?: string;
  is_email_verified?: boolean;
}

interface UpdateProfilePayload {
  dev_notification_email?: string;
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

  if (method === "POST" && (pathname === "/api/auth/sso" || pathname === "/verifyRandseedSSO")) {
    return handleSsoExchange(request, env);
  }

  if (method === "GET" && pathname === "/api/auth/me") {
    return handleGetMe(request, env);
  }

  if (method === "POST" && pathname === "/api/auth/mock-login") {
    return handleMockLogin(request, env);
  }

  if (method === "PUT" && pathname === "/api/auth/profile") {
    return handleUpdateProfile(request, env);
  }

  return null;
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

    if (sso_token.startsWith("mock_") || sso_token.startsWith("jwt_mock_")) {
      // Mock / Dev Token Parsing
      if (sso_token.includes("admin")) {
        initialRole = "admin";
        principalId = `randseed:usr_admin_${sso_token.substring(0, 6)}`;
        email = "admin@randseed.org";
        isEmailVerified = true;
      } else if (sso_token.includes("creator")) {
        initialRole = "creator";
        principalId = `randseed:usr_creator_${sso_token.substring(0, 6)}`;
        email = "creator@example.com";
        isEmailVerified = sso_token.includes("verified");
      } else {
        initialRole = "player";
        principalId = `randseed:usr_player_${sso_token.substring(0, 6)}`;
        email = "player@example.com";
        isEmailVerified = sso_token.includes("verified");
      }
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
          }

          // Record consumed nonce into D1
          if (payload.nonce) {
            await env.DB.prepare(
              "INSERT INTO used_sso_nonces (nonce, principal_id, expires_at, created_at) VALUES (?, ?, ?, ?)"
            )
              .bind(payload.nonce, payload.principal_id, now + 120_000, now)
              .run();
          }

          principalId = payload.principal_id;
          email = payload.email || null;
          isEmailVerified = Boolean(payload.is_email_verified);
          initialRole = "creator";
        } else {
          // Fallback simple token
          principalId = `randseed:usr_${rawToken.substring(0, 12)}`;
          email = `user_${rawToken.substring(0, 6)}@randseed.org`;
          isEmailVerified = true;
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

    let userRole: UserRole = initialRole;

    if (existingUser) {
      // User already exists in D1, preserve established role and update login timestamp
      userRole = existingUser.role || initialRole;
      await env.DB.prepare(
        `UPDATE users 
         SET last_portal_login_at = ?, 
             email = COALESCE(?, email), 
             is_email_verified = COALESCE(?, is_email_verified),
             updated_at = ?
         WHERE principal_id = ?`,
      )
        .bind(now, email, isEmailVerified ? 1 : 0, now, principalId)
        .run();
    } else {
      // Insert new Shadow User into D1
      await env.DB.prepare(
        `INSERT INTO users (
           principal_id, role, email, is_email_verified, 
           last_portal_login_at, created_at, updated_at
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

    // If user owns an organization, ensure their role is at least creator
    if (organization && userRole === "player") {
      userRole = "creator";
      await env.DB.prepare("UPDATE users SET role = 'creator' WHERE principal_id = ?")
        .bind(principalId)
        .run();
    }

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

  return jsonResponse(
    {
      success: true,
      user: {
        principal_id: user.principal_id,
        role: user.role,
        email: user.email,
        isEmailVerified: user.is_email_verified === 1,
        devNotificationEmail: user.dev_notification_email,
        tosAcceptedVersion: user.tos_accepted_version,
        kycStatus: user.kyc_status,
        lastPortalLoginAt: user.last_portal_login_at,
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
         principal_id, role, email, is_email_verified, 
         last_portal_login_at, created_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(principal_id) DO UPDATE SET 
         role = excluded.role,
         last_portal_login_at = excluded.last_portal_login_at,
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
     SET dev_notification_email = COALESCE(?, dev_notification_email),
         tos_accepted_version = COALESCE(?, tos_accepted_version),
         kyc_status = COALESCE(?, kyc_status),
         updated_at = ?
     WHERE principal_id = ?`,
  )
    .bind(
      body.dev_notification_email ?? null,
      body.tos_accepted_version ?? null,
      body.kyc_status ?? null,
      now,
      authUser.principal_id,
    )
    .run();

  return jsonResponse({ success: true, message: "Profile updated successfully" }, 200, request, env);
}
