# 悬赏业务 (Bounty System) 数据表设计

> 数据库: Cloudflare D1 (SQLite)
> 后端语言: Rust (worker-rs)

该模块负责处理 Creator（组织）发布悬赏、Player（用户）认领悬赏、以及提交作品凭证的完整生命周期。
注意：游戏 (Games) 已经剥离为独立的核心资产，此处悬赏通过 `game_id` 依附于游戏实体。

## 1. D1 数据库建表语句 (SQL)

```sql
-- 1. 悬赏任务表 (Bounties)
CREATE TABLE IF NOT EXISTS bounties (
    id TEXT PRIMARY KEY,                 -- 悬赏 ID (例如: bnt_xyz789)
    game_id TEXT NOT NULL,               -- 关联的游戏 ID (外键 games.id)
    admin_id TEXT NOT NULL,              -- 发布人/审核人 ID (外键 users.principal_id, 仅限Admin)
    title TEXT NOT NULL,                 -- 悬赏标题
    description TEXT NOT NULL,           -- 详细描述 (Markdown)
    
    -- 奖励配置
    reward_amount REAL NOT NULL,         -- 奖励数量 (如 100.5)
    reward_token TEXT NOT NULL,          -- 奖励代币符号 (如 'USDC', 'ICP', 'WL')
    total_spots INTEGER NOT NULL,        -- 总名额上限
    claimed_spots INTEGER DEFAULT 0,     -- 已认领/已发奖的名额
    
    -- 任务规则 (JSON 字符串，Rust 侧解析)
    requirements_json TEXT NOT NULL,     -- {"min_level": 10, "require_twitter": true}
    
    status TEXT DEFAULT 'active',        -- 状态: 'draft', 'active', 'paused', 'completed'
    expires_at INTEGER,                  -- 截止时间 (Unix Timestamp)
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
    FOREIGN KEY (admin_id) REFERENCES users(principal_id)
);

-- 2. 悬赏认领记录表 (Bounty Claims)
-- 核心纽带：将 SSO 的用户与 Bounty 业务连接起来
CREATE TABLE IF NOT EXISTS bounty_claims (
    id TEXT PRIMARY KEY,                 -- 认领记录 ID
    bounty_id TEXT NOT NULL,             -- 悬赏 ID
    user_id TEXT NOT NULL,               -- 认领玩家 ID (通过 SSO JWT 获取的 users.principal_id)
    
    status TEXT DEFAULT 'pending',       -- 状态: 'pending'(审核中), 'approved'(已批准), 'rejected'(被拒), 'paid'(已发放)
    proof_data TEXT,                     -- 玩家提交的完成凭证 (JSON文本, 比如图片URL或游戏内截图)
    reviewer_comment TEXT,               -- Creator 拒绝/批准时的附言
    
    submitted_at INTEGER NOT NULL,       -- 提交时间
    reviewed_at INTEGER,                 -- 审核时间
    
    UNIQUE(bounty_id, user_id),          -- 限制: 每个玩家对同一个悬赏只能有一条活动记录
    FOREIGN KEY (bounty_id) REFERENCES bounties(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(principal_id) ON DELETE CASCADE
);
```

## 2. Rust 数据模型与序列化 (Structs)

```rust
use serde::{Deserialize, Serialize};

// ==========================
// 数据库行映射 (Row Models)
// ==========================

#[derive(Debug, Serialize, Deserialize)]
pub struct Bounty {
    pub id: String,
    pub game_id: String,
    pub admin_id: String,
    pub title: String,
    pub description: String,
    pub reward_amount: f64,
    pub reward_token: String,
    pub total_spots: u32,
    pub claimed_spots: u32,
    pub requirements_json: String, // 数据库存的是字符串
    pub status: String,
    pub expires_at: Option<u64>,
    pub created_at: u64,
    pub updated_at: u64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BountyClaim {
    pub id: String,
    pub bounty_id: String,
    pub user_id: String,       // 连接到 SSO User
    pub status: String,
    pub proof_data: Option<String>,
    pub reviewer_comment: Option<String>,
    pub submitted_at: u64,
    pub reviewed_at: Option<u64>,
}

// ==========================
// API 请求与响应 Payload
// ==========================

// 玩家提交悬赏凭证请求
#[derive(Debug, Deserialize)]
pub struct SubmitClaimRequest {
    pub bounty_id: String,
    pub proof_data: serde_json::Value, // 接收 JSON
    pub player_client_version: Option<String>, // 在此处也可以顺带校验版本
}

// Creator 审核悬赏请求
#[derive(Debug, Deserialize)]
pub struct ReviewClaimRequest {
    pub claim_id: String,
    pub action: ReviewAction,          // 'approve' 或 'reject'
    pub comment: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum ReviewAction {
    Approve,
    Reject,
}
```
