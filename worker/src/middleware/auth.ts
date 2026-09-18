import type { AuthenticatedUser, Env, UserRole } from "../types";
import { verifyJwt } from "../utils/crypto";

const VALID_ROLES: UserRole[] = ["player", "creator", "admin"];

export function normalizeRoles(
  role: UserRole,
  roles?: UserRole[] | string | null,
): UserRole[] {
  let parsed: unknown = roles;
  if (typeof roles === "string") {
    try {
      parsed = JSON.parse(roles);
    } catch {
      parsed = [];
    }
  }
  const normalized = Array.isArray(parsed)
    ? parsed.filter((item): item is UserRole => VALID_ROLES.includes(item as UserRole))
    : [];
  if (normalized.length === 0) normalized.push(role);
  if (!normalized.includes(role)) normalized.push(role);
  return [...new Set(normalized)];
}

export async function getAuthenticatedUser(
  request: Request,
  env: Env,
): Promise<AuthenticatedUser | null> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.substring(7).trim();
  if (!token) {
    return null;
  }

  const payload = await verifyJwt(token, env.JWT_SECRET);
  if (!payload) {
    return null;
  }

  return {
    principal_id: payload.principal_id,
    role: payload.role,
    roles: normalizeRoles(payload.role, payload.roles),
    email: payload.email,
    is_email_verified: payload.is_email_verified,
  };
}

export function hasRole(user: Pick<AuthenticatedUser, "role" | "roles">, role: UserRole): boolean {
  return normalizeRoles(user.role, user.roles).includes(role);
}

export function hasRequiredRole(
  user: Pick<AuthenticatedUser, "role" | "roles">,
  requiredRole: UserRole,
): boolean {
  const roles = normalizeRoles(user.role, user.roles);
  if (roles.includes("admin")) return true;
  if (roles.includes("creator") && (requiredRole === "creator" || requiredRole === "player")) return true;
  if (roles.includes("player") && requiredRole === "player") return true;
  return false;
}
