-- Add private release links without changing immutable deployment objects.

ALTER TABLE deployment_records ADD COLUMN release_channel TEXT NOT NULL DEFAULT 'sandbox';

CREATE INDEX IF NOT EXISTS idx_deployment_release_channel
    ON deployment_records(game_id, release_channel, created_at DESC);

CREATE TABLE IF NOT EXISTS private_releases (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    game_id TEXT NOT NULL,
    deployment_id TEXT NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at INTEGER,
    revoked_at INTEGER,
    created_by TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (game_id) REFERENCES game_repo_bindings(game_id) ON DELETE CASCADE,
    FOREIGN KEY (deployment_id) REFERENCES deployment_records(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_private_release_game
    ON private_releases(game_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_private_release_token
    ON private_releases(token_hash);
