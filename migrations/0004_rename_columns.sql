-- Migration: 0004_rename_columns.sql
-- Database: Cloudflare D1 (SQLite) for RandSeed Developer Portal (Gamecreator)
-- Scope: Semantic cleanup and concise schema naming

-- 1. users table cleanup
ALTER TABLE users RENAME COLUMN last_portal_login_at TO last_login_at;
ALTER TABLE users RENAME COLUMN is_email_verified TO email_verified;
ALTER TABLE users DROP COLUMN dev_notification_email;

-- 2. developer_organizations table cleanup
ALTER TABLE developer_organizations RENAME COLUMN social_links_json TO social_links;

-- 3. github_installations table cleanup
ALTER TABLE github_installations RENAME COLUMN permissions_json TO permissions;

-- 4. game_repo_bindings table cleanup
ALTER TABLE game_repo_bindings RENAME COLUMN repo_name TO repo_full_name;
ALTER TABLE game_repo_bindings RENAME COLUMN api_token_hash TO sync_token_hash;
DROP INDEX IF EXISTS idx_game_repo_name;
CREATE INDEX IF NOT EXISTS idx_game_repo_full_name ON game_repo_bindings(repo_full_name);

-- 5. game_deployments table cleanup
ALTER TABLE game_deployments RENAME COLUMN deployer TO trigger_type;
