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
    admin_id TEXT NOT NULL,              -- 发布人/审核人 ID (外键 users.principal_id, 仅限Admin)
    
    -- 基础信息
    category TEXT NOT NULL,              -- 游戏分类 (全局类别，如 'RPG', 'Action')
    title TEXT NOT NULL,                 -- 悬赏标题 (max 10 words)
    short_description TEXT NOT NULL,     -- 简短描述 (max 50 words)
    full_description TEXT NOT NULL,      -- 详细描述 (Markdown)
    thumbnail_url TEXT NOT NULL,         -- 封面图链接 (适配 480x270 及 1920x1080)
    
    -- 奖励与名额
    reward_amount REAL NOT NULL,         -- Bounty Pool Amount
    reward_currency TEXT NOT NULL,       -- 货币类型 ('WLT' | 'USD')
    max_participants INTEGER NOT NULL,   -- 最大参与人数限制
    
    -- 状态与时间轴
    status TEXT DEFAULT 'open',          -- 状态: 'open', 'development', 'online', 'closed'
    participation_end_date INTEGER,      -- 开放参与截止时间 (Open 阶段结束)
    release_date INTEGER,                -- 开发结束/发布时间 (Development 阶段结束)
    distribution_date INTEGER,           -- 奖金发放时间 (Online 阶段结束)
    closed_at INTEGER,                   -- 彻底关闭时间
    
    -- 规则与示例 (JSON 字符串，Rust 侧解析)
    settlement_rules TEXT NOT NULL,      -- 结算与发奖规则 (默认算法描述等)
    game_examples_json TEXT,             -- 游戏案例参考 [{"type": "image"|"video"|"web", "url": "...", "thumbnail": "..."}]
    
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (admin_id) REFERENCES users(principal_id)
);

-- 2. 悬赏参与者/认领表 (Bounty Participants)
CREATE TABLE IF NOT EXISTS bounty_participants (
    id TEXT PRIMARY KEY,                 
    bounty_id TEXT NOT NULL,             
    user_id TEXT NOT NULL,               -- 参与者 ID (对应 users.principal_id)
    
    status TEXT DEFAULT 'subscribed',    -- 状态: 'subscribed'(已参与), 'published'(已发布作品), 'winner'(最终获奖者)
    time_rank INTEGER,                   -- 参与的顺位排名 (Earliest at the first)
    
    submitted_url TEXT,                  -- 开发者最终提交的游戏/作品链接
    
    created_at INTEGER NOT NULL,         -- 参与时间
    updated_at INTEGER NOT NULL,
    
    UNIQUE(bounty_id, user_id),
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
    pub admin_id: String,
    pub category: String,
    pub title: String,
    pub short_description: String,
    pub full_description: String,
    pub thumbnail_url: String,
    pub reward_amount: f64,
    pub reward_currency: String,
    pub max_participants: u32,
    pub status: String,
    pub participation_end_date: Option<u64>,
    pub release_date: Option<u64>,
    pub distribution_date: Option<u64>,
    pub closed_at: Option<u64>,
    pub settlement_rules: String,
    pub game_examples_json: Option<String>,
    pub created_at: u64,
    pub updated_at: u64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BountyParticipant {
    pub id: String,
    pub bounty_id: String,
    pub user_id: String,
    pub status: String,
    pub time_rank: u32,
    pub submitted_url: Option<String>,
    pub created_at: u64,
    pub updated_at: u64,
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

## 3. 接口定义 (API Endpoints)

### 3.1 Bounty 管理 (Platform Admin)
仅限具有 `admin` 角色的用户访问。

- **`POST /api/admin/bounties`**
  - **功能**: 创建新的 Bounty
  - **Body**: `Bounty` 相关字段 (除去 id, created_at, updated_at, admin_id 等自动生成项)
  - **返回**: 201 Created，包含新建的 Bounty 数据

- **`PUT /api/admin/bounties/:id`**
  - **功能**: 修改已存在的 Bounty
  - **Body**: 允许更新的 Bounty 字段
  - **返回**: 200 OK

- **`POST /api/admin/bounties/:id/force-close`**
  - **功能**: 提前结束 Bounty
  - **返回**: 200 OK (状态变更为 closed, 更新 closed_at 时间)

- **`GET /api/admin/bounties`**
  - **功能**: 获取所有 Bounty 列表 (包含 participants 统计概览)
  - **返回**: 200 OK

- **`POST /api/admin/bounties/:id/participants/:user_id/mark-winner`**
  - **功能**: 平台管理员在 online 阶段标记最终获奖者
  - **返回**: 200 OK (参与者状态变为 winner)

### 3.2 前端展示 (C 端展示)
所有用户（包括未登录用户）均可访问。

- **`GET /api/bounties`**
  - **功能**: 获取分类聚合的 Bounty 列表
  - **Query Params**: `?category=All` (可选，按分类过滤)
  - **返回**: 200 OK，包含各分类下按时间降序的 Bounty 卡片数据

- **`GET /api/bounties/:id`**
  - **功能**: 获取单个 Bounty 的全量详情数据
  - **返回**: 200 OK，包含 Bounty 基础信息及 `game_examples_json` 等详细展示数据

### 3.3 Bounty Participants (C 端参与)
仅限已登录的 Creator 访问。

- **`POST /api/bounties/:id/participate`**
  - **功能**: 报名参与 Bounty (订阅)
  - **限制**: 不得超过 `max_participants`
  - **返回**: 200 OK (生成一条状态为 `subscribed` 的 participant 记录，记录 `time_rank`)

- **`POST /api/bounties/:id/submit`**
  - **功能**: 参与者提交最终游戏/作品链接
  - **Body**: `{ "submitted_url": "https://..." }`
  - **返回**: 200 OK (状态变更为 `published`)

- **`GET /api/users/me/bounties`**
  - **功能**: 获取当前登录用户参与过的所有 Bounty 及状态
  - **返回**: 200 OK，列表数据
