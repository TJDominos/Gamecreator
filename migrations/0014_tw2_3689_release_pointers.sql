ALTER TABLE game_release_pointers ADD COLUMN previous_active_deployment_id TEXT;
ALTER TABLE game_release_pointers ADD COLUMN sandbox_deployment_id TEXT;
ALTER TABLE game_release_pointers ADD COLUMN preview_deployment_id TEXT;

UPDATE game_release_pointers
SET sandbox_deployment_id = active_deployment_id
WHERE sandbox_deployment_id IS NULL;

CREATE TABLE IF NOT EXISTS game_sandbox_pointers (
	game_id TEXT PRIMARY KEY,
	deployment_id TEXT NOT NULL,
	artifact_prefix TEXT NOT NULL,
	version INTEGER NOT NULL DEFAULT 1,
	updated_at INTEGER NOT NULL,
	FOREIGN KEY (game_id) REFERENCES game_repo_bindings(game_id) ON DELETE CASCADE,
	FOREIGN KEY (deployment_id) REFERENCES deployment_records(id) ON DELETE RESTRICT
);

INSERT OR IGNORE INTO game_sandbox_pointers (game_id, deployment_id, artifact_prefix, version, updated_at)
SELECT game_id, sandbox_deployment_id, artifact_prefix, version, updated_at
FROM game_release_pointers
WHERE sandbox_deployment_id IS NOT NULL;