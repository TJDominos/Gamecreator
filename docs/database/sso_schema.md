# SSO & 身份鉴权 (SSO & Identity) 影子账户设计

> 数据库: Cloudflare D1 (SQLite)
> 后端语言: Rust (worker-rs)

## 架构原则 (联邦身份模型)
- **主站 (IC)**: 是唯一事实源 (Single Source of Truth)。用户的头像、昵称、积分、余额、风控黑名单等业务数据**全留在 IC，不同步到 D1**。
- **门户 (D1)**: 建立“影子账户”。只通过 `principal_id` 进行关联，仅存储 Creator 门户特有的业务数据（组织关系、开发者通知邮箱等）。
- **双后台隔离 (Dual Admin)**: 主站后台管理C端用户和营销；Creator 门户具备独立的 B 端 Admin 权限，专门负责游戏上下架审核、Bounty 审核发布，两者互不干扰。

## 1. D1 数据库建表语句 (SQL)

```sql
-- 1. 影子账户表 (Shadow Users)
-- 直接使用 principal_id 作为主键，消除内部 ID 映射的复杂度
CREATE TABLE IF NOT EXISTS users (
    principal_id TEXT PRIMARY KEY,       -- 核心锚点: 对应主站的 Internet Computer Principal
    
    -- 下面是主站同步过来或门户专属的数据
    role TEXT DEFAULT 'player',          -- 门户专属角色: 'player', 'creator', 'admin'
    dev_notification_email TEXT,         -- 开发者接收悬赏审核邮件的专属邮箱(可选)
    
    -- 邮箱同步与验证 (随主站 SSO 登录时更新)
    email TEXT,                          -- 从主站同步过来的邮箱
    is_email_verified BOOLEAN DEFAULT 0, -- 是否在主站已验证
    
    -- B端法务与合规
    tos_accepted_version TEXT,           -- 签署的《创作者协议》版本号 (如 'v1.2')
    kyc_status TEXT DEFAULT 'unverified',-- 开发者认证状态: 'unverified', 'individual', 'company'
    
    -- B端活跃度与系统记录
    last_portal_login_at INTEGER,        -- 最近一次登录 Creator 控制台的时间
    created_at INTEGER NOT NULL,         -- 首次在开发者门户登录的时间
    updated_at INTEGER NOT NULL
);

-- 2. 开发者组织表 (Creator 门户专属，主站不需要知道)
CREATE TABLE IF NOT EXISTS developer_organizations (
    id TEXT PRIMARY KEY,                 
    owner_principal TEXT NOT NULL,       -- 外键关联 users.principal_id
    name TEXT NOT NULL UNIQUE,           
    contact_email TEXT NOT NULL,         
    status TEXT DEFAULT 'pending_review',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (owner_principal) REFERENCES users(principal_id) ON DELETE CASCADE
);
```

## 2. Rust 数据模型 (Structs)

```rust
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub enum UserRole {
    #[serde(rename = "player")]
    Player,
    #[serde(rename = "creator")]
    Creator,
    #[serde(rename = "admin")]
    Admin,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct User {
    pub principal_id: String,
    pub role: UserRole,
    pub dev_notification_email: Option<String>,
    pub email: Option<String>,
    pub is_email_verified: bool,
    pub created_at: u64,
    pub updated_at: u64,
}

// ... 组织相关的 struct 同理更新 owner_principal 字段 ...
```
