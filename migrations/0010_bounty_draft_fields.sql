ALTER TABLE bounties ADD COLUMN max_participants INTEGER NOT NULL DEFAULT 100;
ALTER TABLE bounties ADD COLUMN release_date TEXT;
ALTER TABLE bounties ADD COLUMN settlement_rules TEXT NOT NULL DEFAULT 'Default Distribution Algorithm';
ALTER TABLE bounty_examples ADD COLUMN type TEXT NOT NULL DEFAULT 'web';
