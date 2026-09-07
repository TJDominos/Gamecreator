import type { DeveloperOrganizationRow, Env, UserRole, UserRow } from "../types";
import { signJwt } from "../utils/crypto";
import { errorResponse, jsonResponse } from "../utils/response";
import { getAuthenticatedUser } from "../middleware/auth";
import { getSsoAuthorizationCode } from "../ic/sso";

interface SsoRequestPayload {
  sso_code: string;
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

async function handleSsoExchange(
  request: Request,
  env: Env,
): Promise<Response> {
  try {
    const body = (await request.json().catch(() => null)) as SsoRequestPayload | null;
    if (!body || !body.sso_code || typeof body.sso_code !== "string") {
      return errorResponse("Missing sso_code parameter", 400, "MISSING_SSO_CODE", request, env);
    }

    const { sso_code } = body;
    const now = Date.now();
    const authorizationCode = await getSsoAuthorizationCode(sso_code.trim(), env).catch(() => null);
    if (!authorizationCode) {
      return errorResponse("Invalid or expired SSO authorization code", 401, "INVALID_SSO_CODE", request, env);
    }
    if (authorizationCode.audience !== "gamecreator") {
      return errorResponse("Invalid SSO audience", 401, "INVALID_AUDIENCE", request, env);
    }
    if (!env.MAIN_SITE_URL || new URL(authorizationCode.redirect_uri).origin !== new URL(env.MAIN_SITE_URL).origin) {
      return errorResponse("Invalid SSO redirect URI", 401, "INVALID_REDIRECT_URI", request, env);
    }
    if (Number(authorizationCode.expires_at_ms) <= now) {
      return errorResponse("SSO authorization code has expired", 401, "CODE_EXPIRED", request, env);
    }

    const codeInsert = await env.DB.prepare(
      "INSERT OR IGNORE INTO used_sso_codes (code, principal_id, expires_at, created_at) VALUES (?, ?, ?, ?)",
    )
      .bind(authorizationCode.code, authorizationCode.principal_id, Number(authorizationCode.expires_at_ms), now)
      .run();
    if (!codeInsert.meta?.changes) {
      return errorResponse("SSO authorization code has already been used", 409, "CODE_REPLAYED", request, env);
    }

    const principalId = authorizationCode.principal_id;
    const email = authorizationCode.email?.[0] || null;
    const isEmailVerified = authorizationCode.is_email_verified;
    const initialRole: UserRole = "player";

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
