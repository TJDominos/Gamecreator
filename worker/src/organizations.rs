use serde_json::{json, Value};
use worker::{js_sys, Env, Method, Request, Result, Response};

use crate::{auth, db, response};

pub async fn route(request: &mut Request, env: &Env) -> Result<Option<Response>> {
    match (request.method(), request.path().as_str()) {
        (Method::Get, "/api/organizations/my") => Ok(Some(get_my(request, env).await?)),
        (Method::Get, "/api/organizations/check-name") => Ok(Some(check_name(request, env).await?)),
        (Method::Post, "/api/organizations") => Ok(Some(create(request, env).await?)),
        _ => Ok(None),
    }
}

async fn get_my(request: &Request, env: &Env) -> Result<Response> {
    let Some(claims) = auth::user(request, env) else {
        return response::error(request, env, "Unauthorized", 401, "UNAUTHORIZED");
    };
    let row = db::first(&db::database(env)?, "SELECT * FROM developer_organizations WHERE owner_principal = ?", &[json!(claims.principal_id)]).await?;
    response::json(request, env, &json!({ "success": true, "organization": row }), 200)
}

async fn check_name(request: &Request, env: &Env) -> Result<Response> {
    let url = request.url()?;
    let name = url.query_pairs().find(|(key, _)| key == "name").map(|(_, value)| value.trim().to_string());
    let Some(name) = name.filter(|value| !value.is_empty()) else {
        return response::json(request, env, &json!({ "available": false, "error": "Name parameter is required" }), 200);
    };
    let exists = db::first(&db::database(env)?, "SELECT id FROM developer_organizations WHERE LOWER(name) = LOWER(?)", &[json!(name)]).await?.is_some();
    response::json(request, env, &json!({ "success": true, "available": !exists }), 200)
}

async fn create(request: &mut Request, env: &Env) -> Result<Response> {
    let Some(claims) = auth::user(request, env) else {
        return response::error(request, env, "Unauthorized", 401, "UNAUTHORIZED");
    };
    let body = request.json::<Value>().await.unwrap_or_else(|_| json!({}));
    let name = body.get("name").and_then(Value::as_str).unwrap_or_default().trim().to_string();
    let contact = body.get("contactEmail").and_then(Value::as_str).unwrap_or_default().trim().to_string();
    if name.is_empty() || contact.is_empty() {
        return response::error(request, env, "Organization name and contact email are required", 400, "INVALID_INPUT");
    }
    let database = db::database(env)?;
    let existing = db::first(&database, "SELECT id, owner_principal FROM developer_organizations WHERE LOWER(name) = LOWER(?)", &[json!(name.clone())]).await?;
    if let Some(row) = &existing {
        if db::string(row, "owner_principal").as_deref() != Some(claims.principal_id.as_str()) {
            return response::error(request, env, "This organization name is already taken", 409, "NAME_EXISTS");
        }
    }
    let id = db::string(existing.as_ref().unwrap_or(&json!({})), "id").unwrap_or_else(|| format!("RS-ORG-{}", uuid::Uuid::new_v4().simple().to_string()[..6].to_uppercase()));
    let now = js_sys::Date::now() as i64;
    db::run(&database, "INSERT INTO developer_organizations (id, owner_principal, name, contact_email, support_email, logo, description, social_links, status, level, revenue_share, platform_account, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending_review', 'L1', 0.8, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET name = excluded.name, contact_email = excluded.contact_email, support_email = excluded.support_email, logo = excluded.logo, description = excluded.description, social_links = excluded.social_links, updated_at = excluded.updated_at", &[
        json!(id.clone()), json!(claims.principal_id), json!(name), json!(contact),
        body.get("supportEmail").cloned().unwrap_or_else(|| json!(contact)),
        body.get("logo").cloned().unwrap_or_else(|| json!("")),
        body.get("description").cloned().unwrap_or_else(|| json!("")),
        json!(serde_json::to_string(body.get("socialLinks").unwrap_or(&json!(["", ""])))?),
        json!(claims.principal_id), json!(now), json!(now),
    ]).await?;
    let saved = db::first(&database, "SELECT * FROM developer_organizations WHERE id = ?", &[json!(id)]).await?;
    response::json(request, env, &json!({ "success": true, "organization": saved }), 201)
}