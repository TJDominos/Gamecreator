-- Migration: 0001_init.sql
-- Database: Cloudflare D1 (SQLite) for RandSeed Developer Portal (Gamecreator)
-- Scope: SSO & Identity Shadow Accounts (as defined in docs/database/sso_schema.md)

-- 1. 影子账户表 (Shadow Users)
CREATE TABLE IF NOT EXISTS users (
    principal_id TEXT PRIMARY KEY,       -- 核心锚点: 对应主站的 Internet Computer Principal
    role TEXT DEFAULT 'player',          -- 门户专属角色: 'player', 'creator', 'admin'
    dev_notification_email TEXT,         -- 开发者接收审核邮件的专属邮箱(可选)
    email TEXT,                          -- 从主站同步过来的邮箱
    is_email_verified INTEGER DEFAULT 0, -- 是否在主站已验证 (0: 否, 1: 是)
    tos_accepted_version TEXT,           -- 签署的《创作者协议》版本号 (如 'v1.2')
    kyc_status TEXT DEFAULT 'unverified',-- 开发者认证状态: 'unverified', 'individual', 'company'
    last_portal_login_at INTEGER,        -- 最近一次登录 Creator 控制台的时间 (毫秒时间戳)
    created_at INTEGER NOT NULL,         -- 首次在开发者门户登录的时间 (毫秒时间戳)
    updated_at INTEGER NOT NULL          -- 更新时间 (毫秒时间戳)
);

-- 2. 开发者组织表 (Developer Organizations)
CREATE TABLE IF NOT EXISTS developer_organizations (
    id TEXT PRIMARY KEY,                 -- 组织 ID (如 'RS-ORG-ABC123')
    owner_principal TEXT NOT NULL,       -- 外键关联 users.principal_id
    name TEXT NOT NULL UNIQUE,           -- 组织名称
    contact_email TEXT NOT NULL,         -- 联系邮箱
    support_email TEXT,                  -- 支持邮箱
    logo TEXT,                           -- 组织 Logo
    description TEXT,                    -- 组织简介
    social_links_json TEXT,              -- 社交链接 JSON 数组
    status TEXT DEFAULT 'pending_review',-- 审核状态: 'pending_review', 'approved', 'rejected'
    level TEXT DEFAULT 'Starter',        -- 组织等级
    revenue_share REAL DEFAULT 0.7,      -- 收益分成比例 (如 0.7 表示 70%)
    platform_account TEXT,               -- 结算账户
    created_at INTEGER NOT NULL,         -- 创建时间 (毫秒时间戳)
    updated_at INTEGER NOT NULL,         -- 更新时间 (毫秒时间戳)
    FOREIGN KEY (owner_principal) REFERENCES users(principal_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_dev_org_owner ON developer_organizations(owner_principal);
