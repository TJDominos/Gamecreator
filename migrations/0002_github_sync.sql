-- Migration: 0002_github_sync.sql
-- Database: Cloudflare D1 (SQLite) for RandSeed Developer Portal
-- Scope: GitHub App Installations, Game-to-Repository Bindings, and Sandbox Deployments

-- 1. GitHub App 安装记录表 (GitHub Installations)
CREATE TABLE IF NOT EXISTS github_installations (
    id TEXT PRIMARY KEY,
    installation_id INTEGER NOT NULL UNIQUE,
    account_login TEXT NOT NULL,
    account_type TEXT DEFAULT 'User', -- 'User' 或 'Organization'
    owner_principal TEXT NOT NULL,    -- 关联 users.principal_id
    permissions_json TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (owner_principal) REFERENCES users(principal_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_gh_inst_owner ON github_installations(owner_principal);
CREATE INDEX IF NOT EXISTS idx_gh_inst_id ON github_installations(installation_id);

-- 2. 游戏与仓库绑定表 (Game Repository Bindings)
CREATE TABLE IF NOT EXISTS game_repo_bindings (
    game_id TEXT PRIMARY KEY,             -- 对应 Game ID (如 'g_101')
    installation_id INTEGER NOT NULL,     -- 关联 github_installations.installation_id
    repo_name TEXT NOT NULL,              -- 完整仓库名 (如 'TJDominos/Gamecreator')
    default_branch TEXT DEFAULT 'main',   -- 监听分支
    api_token_hash TEXT NOT NULL,         -- RANDSEED_API_TOKEN 的安全摘要
    sync_method TEXT DEFAULT 'github_action', -- 'github_action', 'webhook', 'manual'
    sync_status TEXT DEFAULT 'synced',    -- 'synced', 'syncing', 'outdated', 'error'
    last_synced_commit TEXT,              -- 最新成功部署的 Commit SHA (7-40字符)
    last_commit_message TEXT,             -- Commit 摘要
    last_synced_at INTEGER,               -- 最近同步部署时间 (毫秒时间戳)
    sandbox_url TEXT,                     -- Sandbox 预览地址
    build_dir TEXT DEFAULT 'dist',        -- 构建输出目录
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_game_repo_name ON game_repo_bindings(repo_name);

-- 3. 游戏构建与部署记录表 (Game Deployments)
CREATE TABLE IF NOT EXISTS game_deployments (
    id TEXT PRIMARY KEY,                  -- 部署 ID (如 'dep_001')
    game_id TEXT NOT NULL,                -- 关联 game_repo_bindings.game_id
    commit_sha TEXT NOT NULL,             -- Commit Hash
    commit_message TEXT,                  -- Commit 摘要
    branch TEXT DEFAULT 'main',           -- 分支
    status TEXT NOT NULL,                 -- 'pending', 'building', 'deployed', 'failed'
    sandbox_url TEXT,                     -- 产物预览地址
    deployer TEXT DEFAULT 'github_action',-- 触发方式 ('github_action', 'webhook', 'manual')
    created_at INTEGER NOT NULL,          -- 部署发起时间 (毫秒时间戳)
    FOREIGN KEY (game_id) REFERENCES game_repo_bindings(game_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_deployments_game_id ON game_deployments(game_id);
CREATE INDEX IF NOT EXISTS idx_deployments_commit ON game_deployments(commit_sha);
