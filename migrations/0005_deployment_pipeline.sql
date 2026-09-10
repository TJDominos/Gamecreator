-- Phase 1 deployment pipeline: immutable static files, OIDC callbacks and release pointers.

CREATE TABLE IF NOT EXISTS deployment_records (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    game_id TEXT NOT NULL,
    repository TEXT NOT NULL,
    installation_id INTEGER NOT NULL,
    branch TEXT NOT NULL,
    build_dir TEXT NOT NULL DEFAULT 'dist',
    commit_sha TEXT NOT NULL,
    commit_message TEXT,
    github_delivery_id TEXT,
    github_run_id TEXT,
    workflow_run_attempt INTEGER,
    status TEXT NOT NULL,
    artifact_prefix TEXT,
    artifact_sha256 TEXT,
    artifact_size INTEGER,
    upload_session_id TEXT,
    preview_url TEXT,
    live_url TEXT,
    error_code TEXT,
    error_message TEXT,
    created_at INTEGER NOT NULL,
    started_at INTEGER,
    uploaded_at INTEGER,
    published_at INTEGER,
    finished_at INTEGER,
    FOREIGN KEY (game_id) REFERENCES game_repo_bindings(game_id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_deployment_game_commit
    ON deployment_records(game_id, commit_sha);
CREATE UNIQUE INDEX IF NOT EXISTS idx_deployment_delivery
    ON deployment_records(github_delivery_id)
    WHERE github_delivery_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_deployment_game_created
    ON deployment_records(game_id, created_at DESC);

CREATE TABLE IF NOT EXISTS deployment_upload_sessions (
    id TEXT PRIMARY KEY,
    deployment_id TEXT NOT NULL UNIQUE,
    token_hash TEXT NOT NULL,
    object_prefix TEXT NOT NULL,
    expected_manifest_json TEXT NOT NULL,
    expected_files INTEGER NOT NULL,
    expected_bytes INTEGER NOT NULL,
    expires_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    completed_at INTEGER,
    FOREIGN KEY (deployment_id) REFERENCES deployment_records(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS deployment_upload_files (
    session_id TEXT NOT NULL,
    path TEXT NOT NULL,
    expected_sha256 TEXT NOT NULL,
    expected_size INTEGER NOT NULL,
    object_key TEXT NOT NULL,
    uploaded_at INTEGER,
    PRIMARY KEY (session_id, path),
    FOREIGN KEY (session_id) REFERENCES deployment_upload_sessions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_upload_files_session
    ON deployment_upload_files(session_id, uploaded_at);

CREATE TABLE IF NOT EXISTS game_release_pointers (
    game_id TEXT PRIMARY KEY,
    active_deployment_id TEXT NOT NULL,
    artifact_prefix TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (game_id) REFERENCES game_repo_bindings(game_id) ON DELETE CASCADE,
    FOREIGN KEY (active_deployment_id) REFERENCES deployment_records(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS deployment_events (
    delivery_id TEXT PRIMARY KEY,
    deployment_id TEXT,
    event_name TEXT NOT NULL,
    payload_sha256 TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (deployment_id) REFERENCES deployment_records(id) ON DELETE SET NULL
);