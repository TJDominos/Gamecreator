-- One-time authorization codes exchanged from the RandSeed identity canister.
CREATE TABLE IF NOT EXISTS used_sso_codes (
    code TEXT PRIMARY KEY,
    principal_id TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_used_sso_codes_expires ON used_sso_codes(expires_at);
