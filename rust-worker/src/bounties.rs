use serde_json::{json, Value};
use sha2::{Digest, Sha256};
use worker::{js_sys, Bucket, Env, FormEntry, HttpMetadata, Method, Request, Result, Response};

use crate::{auth, db, response};

pub async fn route(request: &mut Request, env: &Env) -> Result<Option<Response>> {
    let path = request.path();
    match (request.method(), path.as_str()) {
        (Method::Get, "/api/bounties") => Ok(Some(list(request, env).await?)),
        (Method::Get, "/api/admin/bounties") => Ok(Some(admin_list(request, env).await?)),
        (Method::Post, "/api/admin/bounties") => Ok(Some(create(request, env).await?)),
        (Method::Put, "/api/admin/bounties/media") => Ok(Some(upload_media(request, env).await?)),
        _ => {
            if let Some(rest) = path.strip_prefix("/api/bounties/") {
                let mut parts = rest.split('/');
                let id = parts.next().unwrap_or_default();
                if parts.next() == Some("participate") {
                    return Ok(Some(match request.method() { Method::Post => participate(id, request, env).await?, Method::Delete => leave(id, request, env).await?, _ => return Ok(None) }));
                }
                if request.method() == Method::Get && !id.is_empty() { return Ok(Some(get(id, request, env).await?)); }
            }
            if let Some(rest) = path.strip_prefix("/api/admin/bounties/") {
                let id = rest.trim_end_matches('/');
                if id.is_empty() { return Ok(None); }
                return Ok(Some(match request.method() { Method::Put => update(id, request, env).await?, Method::Delete => delete(id, request, env).await?, _ => return Ok(None) }));
            }
            Ok(None)
        }
    }
}

async fn upload_media(request: &mut Request, env: &Env) -> Result<Response> {
    if admin(request, env).is_err() { return response::error(request, env, "Admin access required", 403, "FORBIDDEN"); }
    let content_type = request.headers().get("content-type").ok().flatten().unwrap_or_default();
    let (bytes, mime_type) = if content_type.to_ascii_lowercase().starts_with("multipart/form-data") {
        let form = request.form_data().await?;
        let Some(FormEntry::File(file)) = form.get("file") else { return response::error(request, env, "No file uploaded", 400, "MISSING_FILE"); };
        let mime_type = file.type_();
        (file.bytes().await?, mime_type)
    } else {
        (request.bytes().await?, content_type.split(';').next().unwrap_or_default().trim().to_string())
    };
    if !(mime_type.starts_with("image/") || mime_type == "video/mp4") { return response::error(request, env, "Unsupported file type", 400, "INVALID_FILE"); }
    if bytes.len() > 10 * 1024 * 1024 { return response::error(request, env, "File too large", 400, "FILE_TOO_LARGE"); }
    if env.bucket("ARTIFACTS").is_err() { return response::error(request, env, "Artifact storage is not configured", 503, "STORAGE_UNAVAILABLE"); }
    let digest = Sha256::digest(&bytes);
    let hash = hex::encode(digest);
    let extension = if mime_type == "video/mp4" { "mp4".to_string() } else { mime_type.split('/').nth(1).unwrap_or("png").replace("+xml", "") };
    let object_key = format!("bounties/media_{}.{}", &hash[..16], extension);
    let bucket: Bucket = env.bucket("ARTIFACTS")?;
    bucket.put(&object_key, bytes).http_metadata(HttpMetadata { content_type: Some(mime_type), ..Default::default() }).execute().await?;
    response::json(request, env, &json!({ "success": true, "url": format!("/api/media/{}", urlencoding::encode(&object_key)) }), 200)
}

fn admin(request: &Request, env: &Env) -> Result<auth::Claims> {
    let Some(claims) = auth::user(request, env) else { return Err(worker::Error::from("FORBIDDEN")); };
    if !auth::has_role(&claims, "admin") { return Err(worker::Error::from("FORBIDDEN")); }
    Ok(claims)
}

async fn list(request: &Request, env: &Env) -> Result<Response> {
    let principal = auth::user(request, env).map(|claims| claims.principal_id);
    let database = db::database(env)?;
    let rows = db::all(&database, "SELECT b.*, (SELECT COUNT(*) FROM bounty_participants p WHERE p.bounty_id = b.id) AS subscriptions, (SELECT COUNT(*) FROM bounty_published_games g WHERE g.bounty_id = b.id) AS online_games, CASE WHEN ? IS NULL THEN 0 ELSE EXISTS(SELECT 1 FROM bounty_participants p2 WHERE p2.bounty_id = b.id AND p2.principal_id = ?) END AS is_subscribed FROM bounties b WHERE b.state != 'DRAFT' ORDER BY b.created_at DESC", &[json!(principal.clone()), json!(principal.clone())]).await?;
    let mut bounties = Vec::with_capacity(rows.len());
    for mut row in rows {
        let id = db::string(&row, "id").unwrap_or_default();
        let examples = db::all(&database, "SELECT * FROM bounty_examples WHERE bounty_id = ?", &[json!(id)]).await?;
        if let Some(object) = row.as_object_mut() { object.insert("examples".to_string(), json!(examples)); }
        bounties.push(row);
    }
    response::json(request, env, &json!({ "success": true, "bounties": bounties }), 200)
}

async fn get(id: &str, request: &Request, env: &Env) -> Result<Response> {
    let principal = auth::user(request, env).map(|claims| claims.principal_id);
    let database = db::database(env)?;
    let Some(mut bounty) = db::first(&database, "SELECT b.*, (SELECT COUNT(*) FROM bounty_participants p WHERE p.bounty_id = b.id) AS subscriptions, (SELECT COUNT(*) FROM bounty_published_games g WHERE g.bounty_id = b.id) AS online_games, CASE WHEN ? IS NULL THEN 0 ELSE EXISTS(SELECT 1 FROM bounty_participants p2 WHERE p2.bounty_id = b.id AND p2.principal_id = ?) END AS is_subscribed FROM bounties b WHERE b.id = ? AND b.state != 'DRAFT'", &[json!(principal.clone()), json!(principal.clone()), json!(id)]).await? else { return response::error(request, env, "Bounty not found", 404, "NOT_FOUND"); };
    let examples = db::all(&database, "SELECT * FROM bounty_examples WHERE bounty_id = ?", &[json!(id)]).await?;
    let participants = db::all(&database, "SELECT p.principal_id, p.joined_at, u.email FROM bounty_participants p LEFT JOIN users u ON u.principal_id = p.principal_id WHERE p.bounty_id = ? ORDER BY p.joined_at ASC", &[json!(id)]).await?;
    let games = db::all(&database, "SELECT p.id, p.game_id, p.principal_id, p.prize, p.uu, p.review_score, p.performance_score, p.is_winner, p.game_id AS game_name, u.email FROM bounty_published_games p LEFT JOIN users u ON u.principal_id = p.principal_id WHERE p.bounty_id = ? ORDER BY p.performance_score DESC, p.published_at ASC", &[json!(id)]).await?;
    if let Some(object) = bounty.as_object_mut() { object.insert("examples".to_string(), json!(examples)); object.insert("participants".to_string(), json!(participants)); object.insert("published_games".to_string(), json!(games.iter().filter(|row| row.get("is_winner").and_then(Value::as_i64).unwrap_or_default() == 0).cloned().collect::<Vec<_>>())); object.insert("winners".to_string(), json!(games.into_iter().filter(|row| row.get("is_winner").and_then(Value::as_i64).unwrap_or_default() != 0).collect::<Vec<_>>())); }
    response::json(request, env, &json!({ "success": true, "bounty": bounty }), 200)
}

async fn admin_list(request: &Request, env: &Env) -> Result<Response> {
    if admin(request, env).is_err() { return response::error(request, env, "Admin access required", 403, "FORBIDDEN"); }
    let url = request.url()?;
    let query = |key: &str| url.query_pairs().find(|(name, _)| name == key).map(|(_, value)| value.to_string());
    let state = query("state").filter(|value| matches!(value.as_str(), "ACTIVE" | "CLOSED" | "DRAFT")).unwrap_or_else(|| "ACTIVE".to_string());
    let search = query("search").unwrap_or_default();
    let page = query("page").and_then(|value| value.parse::<i64>().ok()).filter(|value| *value > 0).unwrap_or(1);
    let size = query("pageSize").and_then(|value| value.parse::<i64>().ok()).map(|value| value.clamp(1, 100)).unwrap_or(20);
    let offset = (page - 1) * size;
    let active = state == "ACTIVE";
    let mut sql = if active { "SELECT * FROM bounties WHERE state NOT IN ('DRAFT', 'CLOSED')".to_string() } else { "SELECT * FROM bounties WHERE state = ?".to_string() };
    let mut values = if active { vec![] } else { vec![json!(state)] };
    if !search.is_empty() { sql.push_str(" AND (title LIKE ? OR id LIKE ?)"); values.extend([json!(format!("%{search}%")), json!(format!("%{search}%"))]); }
    sql.push_str(" ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?"); values.extend([json!(size), json!(offset)]);
    let rows = db::all(&db::database(env)?, &sql, &values).await?;
    response::json(request, env, &json!({ "success": true, "bounties": rows, "pagination": { "page": page, "pageSize": size } }), 200)
}

fn text(body: &Value, keys: &[&str]) -> Option<String> { keys.iter().find_map(|key| body.get(*key).and_then(Value::as_str).map(str::trim).filter(|value| !value.is_empty()).map(ToOwned::to_owned)) }

async fn create(request: &mut Request, env: &Env) -> Result<Response> {
    if admin(request, env).is_err() { return response::error(request, env, "Admin access required", 403, "FORBIDDEN"); }
    let body = request.json::<Value>().await.unwrap_or_else(|_| json!({}));
    let id = format!("bty_{}", uuid::Uuid::new_v4().simple());
    let now = js_sys::Date::now() as i64;
    let database = db::database(env)?;
    db::run(&database, "INSERT INTO bounties (id, title, description, full_description, state, category, prize_pool, currency, tags, max_participants, deadline, release_date, battle_end, video_url, settlement_rules, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", &[json!(id.clone()), json!(body.get("title").and_then(Value::as_str).unwrap_or_default()), json!(text(&body, &["shortDesc", "description"]).unwrap_or_default()), json!(text(&body, &["fullDesc", "fullDescription"])), json!(body.get("state").and_then(Value::as_str).unwrap_or("OPEN")), json!(body.get("category").and_then(Value::as_str).unwrap_or_default()), body.get("poolAmount").or_else(|| body.get("prizePool")).cloned().unwrap_or(json!(0)), json!(body.get("currency").and_then(Value::as_str).unwrap_or("WLT")), json!(serde_json::to_string(body.get("tags").unwrap_or(&json!([])))?), body.get("maxParticipants").or_else(|| body.get("max_participants")).cloned().unwrap_or(json!(100)), json!(text(&body, &["participationEndDate", "deadline"])), json!(text(&body, &["releaseDate", "release_date"])), json!(text(&body, &["distributionDate", "battleEnd"])), json!(text(&body, &["videoUrl", "thumbnailUrl"])), json!(text(&body, &["settlementRules", "settlement_rules"]).unwrap_or_else(|| "Default Distribution Algorithm".to_string())), json!(now), json!(now)]).await?;
    response::json(request, env, &json!({ "success": true, "id": id }), 200)
}

async fn update(id: &str, request: &mut Request, env: &Env) -> Result<Response> {
    if admin(request, env).is_err() { return response::error(request, env, "Admin access required", 403, "FORBIDDEN"); }
    let body = request.json::<Value>().await.unwrap_or_else(|_| json!({}));
    let database = db::database(env)?;
    db::run(&database, "UPDATE bounties SET title = ?, description = ?, full_description = ?, state = COALESCE(?, state), category = ?, prize_pool = ?, currency = ?, tags = ?, max_participants = ?, deadline = ?, release_date = ?, battle_end = ?, video_url = ?, settlement_rules = ?, updated_at = ? WHERE id = ?", &[json!(body.get("title").and_then(Value::as_str).unwrap_or_default()), json!(text(&body, &["shortDesc", "description"]).unwrap_or_default()), json!(text(&body, &["fullDesc", "fullDescription"])), body.get("state").cloned().unwrap_or(Value::Null), json!(body.get("category").and_then(Value::as_str).unwrap_or_default()), body.get("poolAmount").or_else(|| body.get("prizePool")).cloned().unwrap_or(json!(0)), json!(body.get("currency").and_then(Value::as_str).unwrap_or("WLT")), json!(serde_json::to_string(body.get("tags").unwrap_or(&json!([])))?), body.get("maxParticipants").or_else(|| body.get("max_participants")).cloned().unwrap_or(json!(100)), json!(text(&body, &["participationEndDate", "deadline"])), json!(text(&body, &["releaseDate", "release_date"])), json!(text(&body, &["distributionDate", "battleEnd"])), json!(text(&body, &["videoUrl", "thumbnailUrl"])), json!(text(&body, &["settlementRules", "settlement_rules"]).unwrap_or_else(|| "Default Distribution Algorithm".to_string())), json!(js_sys::Date::now() as i64), json!(id)]).await?;
    response::json(request, env, &json!({ "success": true }), 200)
}

async fn delete(id: &str, request: &Request, env: &Env) -> Result<Response> {
    if admin(request, env).is_err() { return response::error(request, env, "Admin access required", 403, "FORBIDDEN"); }
    db::run(&db::database(env)?, "DELETE FROM bounties WHERE id = ?", &[json!(id)]).await?;
    response::json(request, env, &json!({ "success": true }), 200)
}

async fn participate(id: &str, request: &Request, env: &Env) -> Result<Response> {
    let Some(claims) = auth::user(request, env) else { return response::error(request, env, "Authentication required", 401, "UNAUTHORIZED"); };
    let database = db::database(env)?;
    let Some(bounty) = db::first(&database, "SELECT state FROM bounties WHERE id = ?", &[json!(id)]).await? else { return response::error(request, env, "Bounty not found", 404, "NOT_FOUND"); };
    if db::string(&bounty, "state").as_deref() != Some("OPEN") { return response::error(request, env, "This bounty is not accepting new subscriptions", 409, "SUBSCRIPTION_LOCKED"); }
    db::run(&database, "INSERT INTO bounty_participants (bounty_id, principal_id, joined_at) VALUES (?, ?, ?) ON CONFLICT DO NOTHING", &[json!(id), json!(claims.principal_id), json!(js_sys::Date::now() as i64)]).await?;
    response::json(request, env, &json!({ "success": true }), 200)
}

async fn leave(id: &str, request: &Request, env: &Env) -> Result<Response> {
    let Some(claims) = auth::user(request, env) else { return response::error(request, env, "Authentication required", 401, "UNAUTHORIZED"); };
    let database = db::database(env)?;
    let Some(bounty) = db::first(&database, "SELECT state FROM bounties WHERE id = ?", &[json!(id)]).await? else { return response::error(request, env, "Bounty not found", 404, "NOT_FOUND"); };
    if !matches!(db::string(&bounty, "state").as_deref(), Some("OPEN") | Some("RUNNING")) { return response::error(request, env, "Unsubscription is locked for this bounty", 409, "SUBSCRIPTION_LOCKED"); }
    db::run(&database, "DELETE FROM bounty_participants WHERE bounty_id = ? AND principal_id = ?", &[json!(id), json!(claims.principal_id)]).await?;
    response::json(request, env, &json!({ "success": true }), 200)
}