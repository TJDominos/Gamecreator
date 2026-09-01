import type { AuthenticatedUser, Env, UserRole } from "../types";
import { verifyJwt } from "../utils/crypto";

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
    email: payload.email,
    is_email_verified: payload.is_email_verified,
  };
}

export function hasRequiredRole(
  userRole: UserRole,
  requiredRole: UserRole,
): boolean {
  if (userRole === "admin") return true;
  if (userRole === "creator" && (requiredRole === "creator" || requiredRole === "player")) return true;
  if (userRole === "player" && requiredRole === "player") return true;
  return false;
}
