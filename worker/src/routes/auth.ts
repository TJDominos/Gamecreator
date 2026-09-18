import type { DeveloperOrganizationRow, Env, UserRole, UserRow } from "../types";
import { signJwt } from "../utils/crypto";
import { errorResponse, jsonResponse } from "../utils/response";
import { getAuthenticatedUser, normalizeRoles } from "../middleware/auth";
import { querySsoUserProfile, redeemSsoAuthorizationCode } from "../ic/sso";

interface SsoRequestPayload {
  sso_code: string;
  redirect_uri: string;
  code_verifier: string;
}

interface UpdateProfilePayload {
  email?: string;
  tos_accepted_version?: string;
  kyc_status?: string;
  creator_org_name?: string | null;
  withdrawal_token?: string | null;
  withdrawal_network?: string | null;
  withdrawal_address?: string | null;
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

  const user = await env.DB.prepare("SELECT * FROM users WHERE principal_id = ?")
    .bind(authUser.principal_id)
    .first<UserRow>();
  if (!user) return errorResponse("User not found", 404, "USER_NOT_FOUND", request, env);

  const roles = normalizeRoles(user.role, user.roles);
  if (!roles.includes("creator")) roles.push("creator");
  const primaryRole: UserRole = roles.includes("admin") ? "admin" : "creator";
  await env.DB.prepare(
    "UPDATE users SET role = ?, roles = ?, updated_at = ? WHERE principal_id = ?",
  )
    .bind(primaryRole, JSON.stringify(roles), Date.now(), authUser.principal_id)
    .run();

  const token = await signJwt(
    {
      principal_id: authUser.principal_id,
      role: primaryRole,
      roles,
      email: user.email ?? undefined,
      is_email_verified: user.email_verified === 1,
    },
    env.JWT_SECRET,
  );
  return jsonResponse({ success: true, role: primaryRole, roles, token }, 200, request, env);
}

async function handleSsoExchange(
  request: Request,
  env: Env,
): Promise<Response> {
  try {
    const body = (await request.json().catch(() => null)) as SsoRequestPayload | null;
    if (!body || !body.sso_code || typeof body.sso_code !== "string" || typeof body.redirect_uri !== "string" || typeof body.code_verifier !== "string") {
      return errorResponse("Missing sso_code parameter", 400, "MISSING_SSO_CODE", request, env);
    }

    const { sso_code } = body;
    const now = Date.now();
    let redirectUri: URL;
    try {
      redirectUri = new URL(body.redirect_uri);
      if (!env.MAIN_SITE_URL || redirectUri.origin !== new URL(env.MAIN_SITE_URL).origin) {
        return errorResponse("Invalid SSO redirect URI", 401, "INVALID_REDIRECT_URI", request, env);
      }
    } catch {
      return errorResponse("Invalid SSO redirect URI", 400, "INVALID_REDIRECT_URI", request, env);
    }
    let authorizationCode;
    try {
      authorizationCode = await redeemSsoAuthorizationCode(
        sso_code.trim(),
        "gamecreator",
        body.redirect_uri,
        body.code_verifier,
        env,
      );
    } catch (error) {
      console.error("SSO authorization code redemption failed", {
        canisterId: env.WL_USER_CANISTER_ID || "missing",
        redirectOrigin: redirectUri.origin,
        redirectPath: redirectUri.pathname,
        codeLength: sso_code.trim().length,
        verifierLength: body.code_verifier.length,
        error: error instanceof Error ? error.message : "unknown error",
      });
      return errorResponse("SSO authorization service unavailable", 502, "SSO_REDEMPTION_FAILED", request, env);
    }
    if (!authorizationCode) {
      console.warn("SSO authorization code rejected", {
        canisterId: env.WL_USER_CANISTER_ID || "missing",
        redirectOrigin: redirectUri.origin,
        redirectPath: redirectUri.pathname,
        codeLength: sso_code.trim().length,
        verifierLength: body.code_verifier.length,
      });
      return errorResponse("Invalid or expired SSO authorization code", 401, "INVALID_SSO_CODE", request, env);
    }
    const principalId = authorizationCode.principal_id;
    const email = authorizationCode.email?.[0] || null;
    const isEmailVerified = authorizationCode.is_email_verified;
    const ssoUserProfile = await querySsoUserProfile(principalId, env);
    const avatarUrl = ssoUserProfile?.logo?.trim() || null;
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
    const isConfiguredAdmin = Boolean(email && configuredAdminEmails.includes(email.trim().toLowerCase()));
    let userRoles: UserRole[] = isConfiguredAdmin ? ["admin"] : [initialRole];

    if (existingUser) {
      // User already exists in D1, preserve established role and update login timestamp
      userRoles = normalizeRoles(existingUser.role || initialRole, existingUser.roles);
      if (configuredAdminEmails.includes((email || existingUser.email || "").trim().toLowerCase()) && !userRoles.includes("admin")) {
        userRoles.push("admin");
      }
      const userRole: UserRole = userRoles.includes("admin")
        ? "admin"
        : userRoles.includes("creator")
          ? "creator"
          : "player";
      await env.DB.prepare(
        `UPDATE users 
         SET last_login_at = ?, 
             email = COALESCE(?, email), 
           avatar_url = COALESCE(?, avatar_url),
             email_verified = COALESCE(?, email_verified),
             role = ?,
             roles = ?,
             updated_at = ?
         WHERE principal_id = ?`,
      )
        .bind(now, email, avatarUrl, isEmailVerified ? 1 : 0, userRole, JSON.stringify(userRoles), now, principalId)
        .run();
    } else {
      const userRole: UserRole = userRoles.includes("admin") ? "admin" : "player";
      // Insert new Shadow User into D1
      await env.DB.prepare(
        `INSERT INTO users (
           principal_id, role, roles, email, avatar_url, email_verified,
           last_login_at, created_at, updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
        .bind(
          principalId,
          userRole,
          JSON.stringify(userRoles),
          email,
          avatarUrl,
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
    const finalUser = existingUser
      ? await env.DB.prepare("SELECT * FROM users WHERE principal_id = ?").bind(principalId).first<UserRow>()
      : {
          role: userRoles.includes("admin") ? "admin" as UserRole : "player" as UserRole,
          roles: JSON.stringify(userRoles),
          avatar_url: avatarUrl,
        };
    const userRole = finalUser?.role ?? "player";
    const roles = normalizeRoles(userRole, finalUser?.roles);
    const token = await signJwt(
      {
        principal_id: principalId,
        role: userRole,
        roles,
        email: email ?? undefined,
        is_email_verified: isEmailVerified,
      },
      env.JWT_SECRET,
    );

    const userProfile = {
      principal_id: principalId,
      role: userRole,
      roles,
      email: email,
      avatarUrl: finalUser?.avatar_url ?? avatarUrl,
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

  let avatarUrl = user.avatar_url;
  if (!avatarUrl) {
    const ssoUserProfile = await querySsoUserProfile(user.principal_id, env);
    avatarUrl = ssoUserProfile?.logo?.trim() || null;
    if (avatarUrl) {
      await env.DB.prepare("UPDATE users SET avatar_url = ?, updated_at = ? WHERE principal_id = ?")
        .bind(avatarUrl, Date.now(), user.principal_id)
        .run();
    }
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
      roles: normalizeRoles(user.role, user.roles),
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
        roles: normalizeRoles(user.role, user.roles),
        email: user.email,
        avatarUrl,
        isEmailVerified: user.email_verified === 1,
        tosAcceptedVersion: user.tos_accepted_version,
        kycStatus: user.kyc_status,
        creatorOrgName: user.creator_org_name,
        withdrawalToken: user.withdrawal_token,
        withdrawalNetwork: user.withdrawal_network,
        withdrawalAddress: user.withdrawal_address,
        withdrawalUpdatedAt: user.withdrawal_updated_at,
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

  const user = await env.DB.prepare("SELECT * FROM users WHERE principal_id = ?").bind(authUser.principal_id).first();
  if (!user) {
    return errorResponse("User not found", 404, "USER_NOT_FOUND", request, env);
  }

  const now = Date.now();
  
  // Check withdrawal update limit (once per 30 days)
  const isUpdatingWithdrawal = body.withdrawal_token !== undefined || body.withdrawal_network !== undefined || body.withdrawal_address !== undefined;
  let nextWithdrawalUpdatedAt = user.withdrawal_updated_at;

  if (isUpdatingWithdrawal) {
    const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000;
    if (user.withdrawal_updated_at) {
      const nextAllowed = user.withdrawal_updated_at + ONE_MONTH_MS;
      if (now < nextAllowed) {
        return errorResponse("Withdrawal address can only be changed once a month.", 400, "UPDATE_LIMIT_REACHED", request, env);
      }
    }
    nextWithdrawalUpdatedAt = now;
  }

  await env.DB.prepare(
    `UPDATE users 
     SET email = COALESCE(?, email),
         tos_accepted_version = COALESCE(?, tos_accepted_version),
         kyc_status = COALESCE(?, kyc_status),
         creator_org_name = COALESCE(?, creator_org_name),
         withdrawal_token = COALESCE(?, withdrawal_token),
         withdrawal_network = COALESCE(?, withdrawal_network),
         withdrawal_address = COALESCE(?, withdrawal_address),
         withdrawal_updated_at = COALESCE(?, withdrawal_updated_at),
         updated_at = ?
     WHERE principal_id = ?`,
  )
    .bind(
      body.email ?? null,
      body.tos_accepted_version ?? null,
      body.kyc_status ?? null,
      body.creator_org_name !== undefined ? body.creator_org_name : null,
      body.withdrawal_token !== undefined ? body.withdrawal_token : null,
      body.withdrawal_network !== undefined ? body.withdrawal_network : null,
      body.withdrawal_address !== undefined ? body.withdrawal_address : null,
      nextWithdrawalUpdatedAt !== undefined ? nextWithdrawalUpdatedAt : null,
      now,
      authUser.principal_id,
    )
    .run();

  return jsonResponse({ success: true, message: "Profile updated successfully" }, 200, request, env);
}
