use serde_json::{json, Value};
use worker::{js_sys, Env, Method, Request, Result, Response};

use crate::{auth, db, response};

pub async fn route(request: &mut Request, env: &Env) -> Result<Option<Response>> {
    match (request.method(), request.path().as_str()) {
        (Method::Post, "/api/admin/users/role") => Ok(Some(update_role(request, env).await?)),
        (Method::Get, "/api/admin/users") => Ok(Some(list_users(request, env).await?)),
        (Method::Delete, "/api/admin/users") => Ok(Some(delete_user(request, env).await?)),
        _ => Ok(None),
    }
}

fn admin(request: &Request, env: &Env) -> Result<auth::Claims> {
    let Some(claims) = auth::user(request, env) else { return Err(worker::Error::from("UNAUTHORIZED")); };
    if !auth::has_role(&claims, "admin") { return Err(worker::Error::from("FORBIDDEN")); }
    Ok(claims)
}

async fn update_role(request: &mut Request, env: &Env) -> Result<Response> {
    let claims = match admin(request, env) { Ok(value) => value, Err(_) => return response::error(request, env, "Admin access required", 403, "FORBIDDEN") };
    let body = request.json::<Value>().await.unwrap_or_else(|_| json!({}));
    let email = body.get("email").and_then(Value::as_str).unwrap_or_default().trim().to_lowercase();
    let role = body.get("role").and_then(Value::as_str).unwrap_or_default();
    if email.is_empty() || !matches!(role, "player" | "creator" | "admin") { return response::error(request, env, "Missing email or role", 400, "INVALID_BODY"); }
    if email == claims.email.clone().unwrap_or_default() && role != "admin" { return response::error(request, env, "Cannot remove your own admin access", 400, "INVALID_ACTION"); }
    let database = db::database(env)?;
    let now = js_sys::Date::now() as i64;
    let existing = db::first(&database, "SELECT role, roles FROM users WHERE email = ? COLLATE NOCASE", &[json!(email.clone())]).await?;
    if let Some(row) = existing {
        let roles = json!([role]);
        db::run(&database, "UPDATE users SET role = ?, roles = ?, updated_at = ? WHERE email = ? COLLATE NOCASE", &[json!(role), json!(serde_json::to_string(&roles)?), json!(now), json!(email.clone())]).await?;
    } else {
        db::run(&database, "INSERT INTO users (principal_id, role, roles, email, email_verified, created_at, updated_at) VALUES (?, ?, ?, ?, 0, ?, ?) ON CONFLICT(principal_id) DO UPDATE SET role = excluded.role, roles = excluded.roles, updated_at = excluded.updated_at", &[json!(format!("pending:{email}")), json!(role), json!(format!("[\"{role}\"]")), json!(email.clone()), json!(now), json!(now)]).await?;
    }
    response::json(request, env, &json!({ "success": true, "message": format!("Role updated for {email}") }), 200)
}

async fn list_users(request: &Request, env: &Env) -> Result<Response> {
    if admin(request, env).is_err() { return response::error(request, env, "Admin access required", 403, "FORBIDDEN"); }
    let rows = db::all(&db::database(env)?, "SELECT principal_id, role, roles, email, email_verified, created_at, last_login_at FROM users ORDER BY created_at DESC LIMIT 100", &[]).await?;
    response::json(request, env, &json!({ "success": true, "users": rows }), 200)
}

async fn delete_user(request: &mut Request, env: &Env) -> Result<Response> {
    let claims = match admin(request, env) { Ok(value) => value, Err(_) => return response::error(request, env, "Admin access required", 403, "FORBIDDEN") };
    let body = request.json::<Value>().await.unwrap_or_else(|_| json!({}));
    let principal = body.get("principal_id").and_then(Value::as_str).unwrap_or_default();
    if principal.is_empty() { return response::error(request, env, "Missing principal_id", 400, "INVALID_BODY"); }
    if principal == claims.principal_id { return response::error(request, env, "Cannot delete your own admin account", 400, "INVALID_ACTION"); }
    db::run(&db::database(env)?, "DELETE FROM users WHERE principal_id = ?", &[json!(principal)]).await?;
    response::json(request, env, &json!({ "success": true, "message": "User deleted" }), 200)
}