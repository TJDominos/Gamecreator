CREATE TABLE bounties (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    full_description TEXT,
    state TEXT NOT NULL DEFAULT 'OPEN',
    category TEXT NOT NULL,
    prize_pool REAL NOT NULL,
    currency TEXT NOT NULL,
    tags TEXT,
    deadline DATETIME,
    battle_end DATETIME,
    video_url TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

CREATE TABLE bounty_examples (
    id TEXT PRIMARY KEY,
    bounty_id TEXT NOT NULL REFERENCES bounties(id) ON DELETE CASCADE,
    title TEXT,
    thumbnail TEXT,
    url TEXT
);

CREATE TABLE bounty_participants (
    bounty_id TEXT NOT NULL REFERENCES bounties(id) ON DELETE CASCADE,
    principal_id TEXT NOT NULL REFERENCES users(principal_id) ON DELETE CASCADE,
    joined_at INTEGER NOT NULL,
    PRIMARY KEY(bounty_id, principal_id)
);

CREATE TABLE bounty_published_games (
    id TEXT PRIMARY KEY,
    bounty_id TEXT NOT NULL REFERENCES bounties(id) ON DELETE CASCADE,
    game_id TEXT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    principal_id TEXT NOT NULL REFERENCES users(principal_id) ON DELETE CASCADE,
    prize TEXT,
    uu INTEGER DEFAULT 0,
    review_score REAL DEFAULT 0,
    performance_score REAL DEFAULT 0,
    is_winner BOOLEAN DEFAULT 0,
    published_at INTEGER NOT NULL
);
