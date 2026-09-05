-- Migration: 0003_sso_security.sql
-- Database: Cloudflare D1 (SQLite) for RandSeed Developer Portal (Gamecreator)
-- Scope: Replay attack prevention for SSO Tokens

CREATE TABLE IF NOT EXISTS used_sso_nonces (
    nonce TEXT PRIMARY KEY,
    principal_id TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_nonce_expires ON used_sso_nonces(expires_at);
