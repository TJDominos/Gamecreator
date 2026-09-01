/// <reference types="@cloudflare/workers-types" />

export type UserRole = "player" | "creator" | "admin";

export interface Env {
  DB: D1Database;
  JWT_SECRET?: string;
  MAIN_SITE_URL?: string;
  CORS_ORIGINS?: string;
}

export interface UserRow {
  principal_id: string;
  role: UserRole;
  dev_notification_email: string | null;
  email: string | null;
  is_email_verified: number; // 0 or 1
  tos_accepted_version: string | null;
  kyc_status: string;
  last_portal_login_at: number | null;
  created_at: number;
  updated_at: number;
}

export interface DeveloperOrganizationRow {
  id: string;
  owner_principal: string;
  name: string;
  contact_email: string;
  support_email: string | null;
  logo: string | null;
  description: string | null;
  social_links_json: string | null;
  status: string;
  level: string;
  revenue_share: number;
  platform_account: string | null;
  created_at: number;
  updated_at: number;
}

export interface JwtPayload {
  principal_id: string;
  role: UserRole;
  email?: string;
  is_email_verified: boolean;
  iat: number;
  exp: number;
}

export interface AuthenticatedUser {
  principal_id: string;
  role: UserRole;
  email?: string;
  is_email_verified: boolean;
}
