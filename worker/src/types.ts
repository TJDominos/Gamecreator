/// <reference types="@cloudflare/workers-types" />

export type UserRole = "player" | "creator" | "admin";

export interface Env {
  DB: D1Database;
  ARTIFACTS?: R2Bucket;
  JWT_SECRET: string;
  ENVIRONMENT?: string;
  IC_GATEWAY_URL?: string;
  WL_USER_CANISTER_ID?: string;
  MAIN_SITE_URL?: string;
  ADMIN_EMAILS?: string;
  CORS_ORIGINS?: string;
  GITHUB_APP_ID?: string;
  GITHUB_APP_SLUG?: string;
  GITHUB_CLIENT_ID?: string;
  GITHUB_CLIENT_SECRET?: string;
  GITHUB_WEBHOOK_SECRET?: string;
  GITHUB_APP_PRIVATE_KEY?: string;
  GITHUB_ACTION_WORKFLOW?: string;
  GITHUB_OIDC_AUDIENCE?: string;
  MAX_ARTIFACT_BYTES?: string;
  SANDBOX_BASE_URL?: string;
  PLAY_BASE_DOMAIN?: string;
  GAME_CSP_CONNECT_SRC?: string;
  ASSETS?: Fetcher;
}

export interface PlayEnv {
  DB: D1Database;
  ARTIFACTS?: R2Bucket;
  PLAY_BASE_DOMAIN?: string;
  GAME_CSP_CONNECT_SRC?: string;
}

export interface GithubInstallationRow {
  id: string;
  installation_id: number;
  account_login: string;
  account_type: string;
  owner_principal: string;
  permissions: string | null;
  created_at: number;
  updated_at: number;
}

export interface GameRepoBindingRow {
  game_id: string;
  installation_id: number;
  repo_full_name: string;
  default_branch: string;
  sync_token_hash: string;
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
  trigger_type: string;
  created_at: number;
}

export type DeploymentStatus =
  | "pending"
  | "queued"
  | "building"
  | "uploading"
  | "uploaded"
  | "verifying"
  | "ready"
  | "publishing"
  | "published"
  | "failed"
  | "cancelled"
  | "superseded";

export interface DeploymentRecordRow {
  id: string;
  tenant_id: string;
  game_id: string;
  repository: string;
  installation_id: number;
  branch: string;
  build_dir: string;
  release_channel: "sandbox" | "private";
  commit_sha: string;
  commit_message: string | null;
  github_delivery_id: string | null;
  github_run_id: string | null;
  workflow_run_attempt: number | null;
  status: DeploymentStatus;
  artifact_prefix: string | null;
  artifact_sha256: string | null;
  artifact_size: number | null;
  upload_session_id: string | null;
  preview_url: string | null;
  live_url: string | null;
  error_code: string | null;
  error_message: string | null;
  created_at: number;
  started_at: number | null;
  uploaded_at: number | null;
  published_at: number | null;
  finished_at: number | null;
}

export interface DeploymentUploadSessionRow {
  id: string;
  deployment_id: string;
  token_hash: string;
  object_prefix: string;
  expected_manifest_json: string;
  expected_files: number;
  expected_bytes: number;
  expires_at: number;
  created_at: number;
  completed_at: number | null;
}

export interface DeploymentUploadFileRow {
  session_id: string;
  path: string;
  expected_sha256: string;
  expected_size: number;
  object_key: string;
  uploaded_at: number | null;
}

export interface GameReleasePointerRow {
  game_id: string;
  active_deployment_id: string;
  artifact_prefix: string;
  version: number;
  updated_at: number;
}

export interface PrivateReleaseRow {
  id: string;
  tenant_id: string;
  game_id: string;
  deployment_id: string;
  token_hash: string;
  expires_at: number | null;
  revoked_at: number | null;
  created_by: string;
  created_at: number;
}

export interface DeploymentManifestFile {
  path: string;
  sha256: string;
  size: number;
}

export interface DeploymentManifest {
  deployment_id: string;
  commit_sha: string;
  root: string;
  files: DeploymentManifestFile[];
  total_bytes: number;
}

export interface UserRow {
  principal_id: string;
  role: UserRole;
  email: string | null;
  email_verified: number; // 0 or 1
  tos_accepted_version: string | null;
  kyc_status: string;
  last_login_at: number | null;
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
  social_links: string | null;
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
