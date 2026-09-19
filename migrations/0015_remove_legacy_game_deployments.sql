-- Retire the pre-TW2-3689 deployment table. deployment_records is the source of truth.
DROP TABLE IF EXISTS game_deployments;
