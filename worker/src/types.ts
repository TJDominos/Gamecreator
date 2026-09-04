/// <reference types="@cloudflare/workers-types" />

export type UserRole = "player" | "creator" | "admin";

export interface Env {
  DB: D1Database;
  JWT_SECRET?: string;
  MAIN_SITE_URL?: string;
  CORS_ORIGINS?: string;
  GITHUB_APP_ID?: string;
  GITHUB_APP_SLUG?: string;
  GITHUB_CLIENT_ID?: string;
  GITHUB_CLIENT_SECRET?: string;
  GITHUB_WEBHOOK_SECRET?: string;
  GITHUB_APP_PRIVATE_KEY?: string;
  SANDBOX_BASE_URL?: string;
}

export interface GithubInstallationRow {
  id: string;
  installation_id: number;
  account_login: string;
  account_type: string;
  owner_principal: string;
  permissions_json: string | null;
  created_at: number;
  updated_at: number;
}

export interface GameRepoBindingRow {
  game_id: string;
  installation_id: number;
  repo_name: string;
  default_branch: string;
  api_token_hash: string;
  sync_method: string;
  sync_status: string;
  last_synced_commit: string | null;
  last_commit_message: string | null;
  last_synced_at: number | null;
  sandbox_url: string | null;
  build_dir: string;
  created_at: number;
  updated_at: number;
}

export interface GameDeploymentRow {
  id: string;
  game_id: string;
  commit_sha: string;
  commit_message: string | null;
  branch: string;
  status: string;
  sandbox_url: string | null;
  deployer: string;
  created_at: number;
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
