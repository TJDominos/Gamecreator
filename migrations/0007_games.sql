-- Migration: 0007_games.sql
-- Database: Cloudflare D1 (SQLite) for RandSeed Developer Portal
-- Scope: Games table for persistent draft creation, storefront profiles, and lifecycle tracking

CREATE TABLE IF NOT EXISTS games (
    id TEXT PRIMARY KEY,                       -- Game ID (e.g. 'g_101')
    tenant_id TEXT,                            -- Associated tenant/organization
    creator_principal TEXT NOT NULL,           -- Owner user principal
    name TEXT NOT NULL,                        -- Game name
    status TEXT NOT NULL DEFAULT 'DRAFT',      -- 'DRAFT', 'DEVELOPMENT', 'PRIVATE_TESTING', 'PENDING_REVIEW', 'PUBLIC_ACTIVE', 'ARCHIVED'
    version TEXT DEFAULT '---',                -- Bound to latest deployment / release pointer
    description TEXT,                          -- Storefront description (max 500 words)
    cover_image TEXT,                          -- Cover image URL (400x400, max 1MB)
    animation_url TEXT,                        -- Game animation URL (MP4, max 10MB)
    visitors TEXT DEFAULT '---',
    players TEXT DEFAULT '---',
    revenue TEXT DEFAULT '---',
    available_balance TEXT DEFAULT '---',
    escrowed_balance TEXT DEFAULT '---',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (creator_principal) REFERENCES users(principal_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_games_creator ON games(creator_principal);
CREATE INDEX IF NOT EXISTS idx_games_name ON games(name);
CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);
