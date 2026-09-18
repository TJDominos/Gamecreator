import type { Env, UserRole } from "../types";
import { errorResponse, jsonResponse } from "../utils/response";
import { getAuthenticatedUser, hasRole, normalizeRoles } from "../middleware/auth";

export async function handleAdminRoutes(request: Request, env: Env): Promise<Response | null> {
  const url = new URL(request.url);

  if (url.pathname === "/api/admin/users/role" && request.method === "POST") {
    return handleUpdateUserRole(request, env);
  }
  
  if (url.pathname === "/api/admin/users" && request.method === "GET") {
    return handleListUsers(request, env);
  }

  if (url.pathname === "/api/admin/users" && request.method === "DELETE") {
    return handleDeleteUser(request, env);
  }

  return null;
}

async function handleUpdateUserRole(request: Request, env: Env): Promise<Response> {
  const authUser = await getAuthenticatedUser(request, env);
  if (!authUser || !hasRole(authUser, "admin")) {
    return errorResponse("Admin access required", 403, "FORBIDDEN", request, env);
  }

  const body = (await request.json().catch(() => null)) as { email?: string; role?: UserRole } | null;
  if (!body || !body.email || !body.role) {
    return errorResponse("Missing email or role", 400, "INVALID_BODY", request, env);
  }

  try {
    // If the user doesn't exist, we insert a shadow user that will be matched later when they sign in.
    // Or we only allow updating existing users. Let's do an UPSERT for the shadow user if they don't exist.
    const email = body.email.trim().toLowerCase();
    const role = body.role;
    
    if (!["player", "creator", "admin"].includes(role)) {
      return errorResponse("Invalid role", 400, "INVALID_ROLE", request, env);
    }

    const now = Date.now();
    
    // Check if user exists
    const user = await env.DB.prepare("SELECT role, roles FROM users WHERE email = ? COLLATE NOCASE").bind(email).first<{ role: UserRole; roles: string | null }>();
    
    if (user) {
      const roles = role === "player"
        ? ["player"]
        : normalizeRoles(user.role, user.roles).filter((item) => item !== "player").concat(role);
      const uniqueRoles = [...new Set(roles)];
      const primaryRole: UserRole = uniqueRoles.includes("admin") ? "admin" : uniqueRoles.includes("creator") ? "creator" : "player";
      await env.DB.prepare("UPDATE users SET role = ?, roles = ?, updated_at = ? WHERE email = ? COLLATE NOCASE")
        .bind(primaryRole, JSON.stringify(uniqueRoles), now, email)
        .run();
    } else {
      // Create shadow user with a mock principal ID (will be overwritten on first login, wait actually SSO uses principal ID from github/google)
      // Actually it's better to just require the user to exist, or we can insert a placeholder.
      // Wait, in auth.ts, it matches by email if they sign in? 
      // In auth.ts:
      // existingUser = await env.DB.prepare("SELECT * FROM users WHERE principal_id = ?").bind(principalId).first<UserRow>();
      // It doesn't query by email to link accounts. But if ADMIN_EMAILS contains it, it sets them to admin.
      // If we insert a row with a fake principal ID, when they log in they'll get a real principal ID and it won't link unless we match by email.
      // Let's just update the DB if they exist, else we can insert a pending admin.
      // Actually, we can update the users table. Let's just create a row with `principal_id` = `pending:email`
      const mockPrincipal = `pending:${email}`;
      await env.DB.prepare(`
        INSERT INTO users (principal_id, role, roles, email, email_verified, created_at, updated_at)
        VALUES (?, ?, ?, ?, 0, ?, ?)
        ON CONFLICT(principal_id) DO UPDATE SET role = excluded.role, roles = excluded.roles, updated_at = excluded.updated_at
      `).bind(mockPrincipal, role, JSON.stringify([role]), email, now, now).run();
    }

    return jsonResponse({ success: true, message: `Role updated for ${email}` }, 200, request, env);
  } catch (err: any) {
    return errorResponse(err.message, 500, "DB_ERROR", request, env);
  }
}

async function handleListUsers(request: Request, env: Env): Promise<Response> {
  const authUser = await getAuthenticatedUser(request, env);
  if (!authUser || !hasRole(authUser, "admin")) {
    return errorResponse("Admin access required", 403, "FORBIDDEN", request, env);
  }

  try {
    const { results } = await env.DB.prepare("SELECT principal_id, role, roles, email, email_verified, created_at, last_login_at FROM users ORDER BY created_at DESC LIMIT 100").all();
    return jsonResponse({ success: true, users: results }, 200, request, env);
  } catch (err: any) {
    return errorResponse(err.message, 500, "DB_ERROR", request, env);
  }
}


async function handleDeleteUser(request: Request, env: Env): Promise<Response> {
  const authUser = await getAuthenticatedUser(request, env);
  if (!authUser || !hasRole(authUser, "admin")) {
    return errorResponse("Admin access required", 403, "FORBIDDEN", request, env);
  }

  const body = (await request.json().catch(() => null)) as { principal_id?: string } | null;
  if (!body || !body.principal_id) {
    return errorResponse("Missing principal_id", 400, "INVALID_BODY", request, env);
  }

  if (body.principal_id === authUser.principal_id) {
    return errorResponse("Cannot delete your own admin account", 400, "INVALID_ACTION", request, env);
  }

  try {
    await env.DB.prepare("DELETE FROM users WHERE principal_id = ?").bind(body.principal_id).run();
    return jsonResponse({ success: true, message: "User deleted" }, 200, request, env);
  } catch (err: any) {
    return errorResponse(err.message, 500, "DB_ERROR", request, env);
  }
}
