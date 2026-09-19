-- Short-lived access JWTs use this rotating, server-side refresh session.
CREATE TABLE IF NOT EXISTS auth_refresh_sessions (
    token_hash TEXT PRIMARY KEY,
    family_id TEXT NOT NULL,
    principal_id TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    last_used_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL,
    revoked_at INTEGER,
    user_agent TEXT,
    FOREIGN KEY (principal_id) REFERENCES users(principal_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_auth_refresh_sessions_family
    ON auth_refresh_sessions(family_id);
CREATE INDEX IF NOT EXISTS idx_auth_refresh_sessions_principal
    ON auth_refresh_sessions(principal_id);
CREATE INDEX IF NOT EXISTS idx_auth_refresh_sessions_expiry
    ON auth_refresh_sessions(expires_at);
