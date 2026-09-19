-- One-time GitHub installation states prevent callback replay.
CREATE TABLE IF NOT EXISTS github_oauth_states (
    nonce TEXT PRIMARY KEY,
    principal_id TEXT NOT NULL,
    game_id TEXT,
    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL,
    used_at INTEGER,
    FOREIGN KEY (principal_id) REFERENCES users(principal_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_github_oauth_states_expiry
    ON github_oauth_states(expires_at);