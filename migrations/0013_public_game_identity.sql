-- Public game identity: optional during drafting, required when submitting for public review.
ALTER TABLE games ADD COLUMN short_name TEXT;

-- Draft/private games may share names. Public submissions and active games must be unique.
CREATE UNIQUE INDEX IF NOT EXISTS idx_games_public_name_unique
    ON games(lower(trim(name)))
    WHERE status IN ('PENDING_REVIEW', 'PUBLIC_ACTIVE');

CREATE UNIQUE INDEX IF NOT EXISTS idx_games_public_short_name_unique
    ON games(lower(trim(short_name)))
    WHERE short_name IS NOT NULL AND status IN ('PENDING_REVIEW', 'PUBLIC_ACTIVE');
