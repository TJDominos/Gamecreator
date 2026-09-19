-- Persist the GitHub user authorized during App installation.
ALTER TABLE github_installations ADD COLUMN github_user_id INTEGER;
ALTER TABLE github_installations ADD COLUMN github_user_login TEXT;
ALTER TABLE github_installations ADD COLUMN github_user_name TEXT;
ALTER TABLE github_installations ADD COLUMN github_user_avatar_url TEXT;
ALTER TABLE github_installations ADD COLUMN github_user_email TEXT;