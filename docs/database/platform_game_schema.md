# 平台与游戏 (Platform & Game) 数据表设计

> 数据库: Cloudflare D1 (SQLite)
> 后端语言: Rust (worker-rs)

这里将“平台基础配置”与“游戏核心资产”独立出来。悬赏(Bounty)等营销模块将依附于游戏(Game)之上。

## 1. D1 数据库建表语句 (SQL)

```sql
-- 1. 平台全局配置表 (Platform Configs)
-- 用于控制前端强制刷新、全局停服维护等系统级参数
CREATE TABLE IF NOT EXISTS platform_configs (
    key TEXT PRIMARY KEY,                -- 配置键名 (例如: 'frontend_spa_version', 'is_maintenance')
    value_json TEXT NOT NULL,            -- 配置值 (存储 JSON 字符串)
    description TEXT,                    -- 配置说明
    updated_at INTEGER NOT NULL
);

-- 2. 游戏/项目核心表 (Games)
-- 游戏是独立的实体，不属于 Bounty。Bounty 只是为游戏拉新的手段之一。
CREATE TABLE IF NOT EXISTS games (
    id TEXT PRIMARY KEY,                 -- 游戏 ID
    org_id TEXT NOT NULL,                -- 所属组织 (外键 developer_organizations.id)
    name TEXT NOT NULL,                  -- 游戏名称
    genre TEXT,                          -- 游戏类型
    
    -- ===== 客户端版本控制机制 =====
    latest_client_version TEXT,          -- 最新客户端版本号 (例如: 'v1.2.5')
    min_required_version TEXT,           -- 最低强制要求版本 (例如: 'v1.2.0')
    client_update_url TEXT,              -- 更新包/应用商店下载地址 (可选)
    -- ==============================
    
    status TEXT DEFAULT 'pending_review',-- 状态: 'pending_review'(待审), 'active'(已上架), 'rejected'(被拒)
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (org_id) REFERENCES developer_organizations(principal_id) ON DELETE CASCADE
);
```

## 2. Rust 数据模型与序列化 (Structs)

```rust
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct PlatformConfig {
    pub key: String,
    pub value_json: String,
    pub description: Option<String>,
    pub updated_at: u64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Game {
    pub id: String,
    pub org_id: String,
    pub name: String,
    pub genre: Option<String>,
    
    pub latest_client_version: Option<String>,
    pub min_required_version: Option<String>,
    pub client_update_url: Option<String>,
    
    pub status: String,
    pub created_at: u64,
    pub updated_at: u64,
}
```
