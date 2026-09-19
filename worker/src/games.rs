use serde_json::{json, Value};
use worker::{js_sys, Bucket, Env, HttpMetadata, Method, Request, Result, Response};

use crate::{auth, db, response};

pub async fn route(request: &mut Request, env: &Env) -> Result<Option<Response>> {
    let path = request.path();
    if request.method() == Method::Get && path.starts_with("/api/media/") {
        return Ok(Some(serve_media(path.trim_start_matches("/api/media/"), request, env).await?));
    }
    if request.method() == Method::Post && path.ends_with("/media-upload") {
        if let Some(game_id) = path.strip_prefix("/api/games/").and_then(|value| value.strip_suffix("/media-upload")).filter(|value| !value.is_empty()) {
            return Ok(Some(upload_media(game_id, request, env).await?));
        }
    }
    if path == "/api/games" {
        return Ok(Some(match request.method() {
            Method::Get => list(request, env).await?,
            Method::Post => create(request, env).await?,
            _ => return Ok(None),
        }));
    }
    if let Some(game_id) = path.strip_prefix("/api/games/") {
        if game_id.is_empty() || game_id.contains('/') { return Ok(None); }
        return Ok(Some(match request.method() {
            Method::Get => get(game_id, request, env).await?,
            Method::Put => update(game_id, request, env).await?,
            Method::Delete => delete(game_id, request, env).await?,
            _ => return Ok(None),
        }));
    }
    Ok(None)
}

async fn upload_media(game_id: &str, request: &mut Request, env: &Env) -> Result<Response> {
    let claims = match creator(request, env) { Ok(value) => value, Err(error) if error.to_string() == "UNAUTHORIZED" => return response::error(request, env, "Authentication required", 401, "UNAUTHORIZED"), Err(_) => return response::error(request, env, "Creator access required", 403, "FORBIDDEN") };
    let database = db::database(env)?;
    if db::first(&database, "SELECT id FROM games WHERE id = ? AND (creator_principal = ? OR ? = 'admin')", &[json!(game_id), json!(claims.principal_id), json!(claims.role)]).await?.is_none() { return response::error(request, env, "You do not have access to this game", 403, "FORBIDDEN"); }
    let media_type = request.headers().get("x-media-type").ok().flatten().unwrap_or_else(|| "cover".to_string());
    let content_type = request.headers().get("content-type").ok().flatten().unwrap_or_else(|| "application/octet-stream".to_string());
    let bytes = request.bytes().await?;
    let animation = media_type == "animation";
    let max = if animation { 10 * 1024 * 1024 } else { 1024 * 1024 };
    if bytes.len() > max { return response::error(request, env, "File size exceeds the allowed limit", 413, "PAYLOAD_TOO_LARGE"); }
    if (animation && !content_type.starts_with("video/")) || (!animation && !content_type.starts_with("image/")) { return response::error(request, env, "Invalid media format", 400, "INVALID_FORMAT"); }
    let extension = content_type.split('/').nth(1).unwrap_or("bin").split(';').next().unwrap_or("bin").replace("+xml", "");
    let key = format!("games/{game_id}/media/{}_{}.{}", media_type, uuid::Uuid::new_v4(), extension);
    let bucket: Bucket = env.bucket("ARTIFACTS")?;
    bucket.put(&key, bytes).http_metadata(HttpMetadata { content_type: Some(content_type), cache_control: Some("public, max-age=31536000, immutable".to_string()), ..Default::default() }).execute().await?;
    response::json(request, env, &json!({ "success": true, "url": format!("/api/media/{}", urlencoding::encode(&key)), "key": key }), 200)
}

async fn serve_media(key: &str, request: &Request, env: &Env) -> Result<Response> {
    let key = urlencoding::decode(key).map_err(|_| worker::Error::from("invalid media key"))?.to_string();
    if !(key.starts_with("games/") || key.starts_with("bounties/")) || key.contains("..") || key.contains('\\') { return response::error(request, env, "Invalid media key", 400, "INVALID_MEDIA_KEY"); }
    if let Some(game_id) = key.strip_prefix("games/").and_then(|value| value.split('/').next()) { if db::first(&db::database(env)?, "SELECT id FROM games WHERE id = ?", &[json!(game_id)]).await?.is_none() { return response::error(request, env, "Media not found", 404, "NOT_FOUND"); } }
    let bucket: Bucket = env.bucket("ARTIFACTS")?;
    let Some(object) = bucket.get(&key).execute().await? else { return response::error(request, env, "Media not found", 404, "NOT_FOUND"); };
    let body = object.body().ok_or_else(|| worker::Error::from("media body unavailable"))?.response_body()?;
    let content_type = key.rsplit('.').next().map(|ext| match ext.to_ascii_lowercase().as_str() { "png" => "image/png", "jpg" | "jpeg" => "image/jpeg", "webp" => "image/webp", "gif" => "image/gif", "mp4" => "video/mp4", _ => "application/octet-stream" }).unwrap_or("application/octet-stream");
    let builder = Response::builder().with_header("Content-Type", content_type)?.with_header("Cache-Control", "public, max-age=31536000, immutable")?.with_header("ETag", &object.http_etag())?;
    Ok(builder.body(body))
}

fn creator(request: &Request, env: &Env) -> Result<auth::Claims> {
    let Some(claims) = auth::user(request, env) else { return Err(worker::Error::from("UNAUTHORIZED")); };
    if !auth::has_role(&claims, "creator") { return Err(worker::Error::from("FORBIDDEN")); }
    Ok(claims)
}

fn game_json(row: &Value, pointer: Option<&Value>, sandbox_pointer: Option<&Value>, binding: Option<&Value>) -> Value {
    let public_version = pointer.and_then(|item| item.get("version")).and_then(Value::as_i64).map(|value| format!("v{value}"));
    let sandbox_version = sandbox_pointer.and_then(|item| item.get("version")).and_then(Value::as_i64).map(|value| format!("v{value}"));
    let version = public_version.clone().or_else(|| sandbox_version.clone()).or_else(|| db::string(row, "version")).unwrap_or_else(|| "---".to_string());
    json!({
        "id": db::string(row, "id"), "name": db::string(row, "name"), "shortName": db::string(row, "short_name").unwrap_or_default(),
        "status": db::string(row, "status"), "version": version, "displayVersion": db::string(row, "display_version").unwrap_or_default(),
        "publicDeploymentId": pointer.and_then(|item| db::string(item, "active_deployment_id")), "publicVersion": public_version,
        "sandboxDeploymentId": sandbox_pointer.and_then(|item| db::string(item, "deployment_id")), "sandboxVersion": sandbox_version,
        "players": db::string(row, "players").unwrap_or_else(|| "---".to_string()), "visitors": db::string(row, "visitors").unwrap_or_else(|| "---".to_string()),
        "revenue": db::string(row, "revenue").unwrap_or_else(|| "---".to_string()), "availableBalance": db::string(row, "available_balance").unwrap_or_else(|| "---".to_string()),
        "escrowedBalance": db::string(row, "escrowed_balance").unwrap_or_else(|| "---".to_string()), "createdAt": row.get("created_at"),
        "profile": { "description": db::string(row, "description").unwrap_or_default(), "coverImage": db::string(row, "cover_image").unwrap_or_default(), "animationUrl": db::string(row, "animation_url").unwrap_or_default(), "displayVersion": db::string(row, "display_version").unwrap_or_default() },
        "repoInfo": binding.map(|item| json!({ "repository": db::string(item, "repo_full_name"), "branch": db::string(item, "default_branch"), "lastCommitSha": db::string(item, "last_synced_commit").unwrap_or_else(|| "---".to_string()), "lastCommitMessage": db::string(item, "last_commit_message").unwrap_or_else(|| "---".to_string()), "lastSyncedAt": item.get("last_synced_at"), "isSynced": db::string(item, "sync_status").as_deref() == Some("synced"), "syncMethod": db::string(item, "sync_method"), "sandboxUrl": db::string(item, "sandbox_url") }))
    })
}

async fn list(request: &Request, env: &Env) -> Result<Response> {
    let claims = match creator(request, env) { Ok(value) => value, Err(error) if error.to_string() == "UNAUTHORIZED" => return response::error(request, env, "Authentication required", 401, "UNAUTHORIZED"), Err(_) => return response::error(request, env, "Creator access required", 403, "FORBIDDEN") };
    let database = db::database(env)?;
    let rows = db::all(&database, "SELECT * FROM games WHERE creator_principal = ? ORDER BY created_at DESC", &[json!(claims.principal_id)]).await?;
    let mut games = Vec::with_capacity(rows.len());
    for row in rows {
        let id = db::string(&row, "id").unwrap_or_default();
        let pointer = db::first(&database, "SELECT version, active_deployment_id FROM game_release_pointers WHERE game_id = ?", &[json!(id.clone())]).await?;
        let sandbox_pointer = db::first(&database, "SELECT version, deployment_id FROM game_sandbox_pointers WHERE game_id = ?", &[json!(id.clone())]).await?;
        let binding = db::first(&database, "SELECT * FROM game_repo_bindings WHERE game_id = ?", &[json!(id)]).await?;
        games.push(game_json(&row, pointer.as_ref(), sandbox_pointer.as_ref(), binding.as_ref()));
    }
    response::json(request, env, &json!({ "success": true, "games": games }), 200)
}

async fn get(game_id: &str, request: &Request, env: &Env) -> Result<Response> {
    let claims = match creator(request, env) { Ok(value) => value, Err(error) if error.to_string() == "UNAUTHORIZED" => return response::error(request, env, "Authentication required", 401, "UNAUTHORIZED"), Err(_) => return response::error(request, env, "Creator access required", 403, "FORBIDDEN") };
    let database = db::database(env)?;
    let row = db::first(&database, "SELECT * FROM games WHERE id = ? AND (creator_principal = ? OR ? = 'admin')", &[json!(game_id), json!(claims.principal_id.clone()), json!(claims.role)]).await?;
    let Some(row) = row else { return response::error(request, env, "Game not found", 404, "NOT_FOUND"); };
    let pointer = db::first(&database, "SELECT version, active_deployment_id FROM game_release_pointers WHERE game_id = ?", &[json!(game_id)]).await?;
    let sandbox_pointer = db::first(&database, "SELECT version, deployment_id FROM game_sandbox_pointers WHERE game_id = ?", &[json!(game_id)]).await?;
    let binding = db::first(&database, "SELECT * FROM game_repo_bindings WHERE game_id = ?", &[json!(game_id)]).await?;
    response::json(request, env, &json!({ "success": true, "game": game_json(&row, pointer.as_ref(), sandbox_pointer.as_ref(), binding.as_ref()) }), 200)
}

async fn create(request: &mut Request, env: &Env) -> Result<Response> {
    let claims = match creator(request, env) { Ok(value) => value, Err(error) if error.to_string() == "UNAUTHORIZED" => return response::error(request, env, "Authentication required", 401, "UNAUTHORIZED"), Err(_) => return response::error(request, env, "Creator access required", 403, "FORBIDDEN") };
    let body = request.json::<Value>().await.unwrap_or_else(|_| json!({}));
    let database = db::database(env)?;
    let supplied = body.get("name").and_then(Value::as_str).unwrap_or_default().trim().to_string();
    let name = if supplied.is_empty() { "new game".to_string() } else { supplied };
    let id = body.get("id").and_then(Value::as_str).filter(|value| !value.is_empty()).map(ToOwned::to_owned).unwrap_or_else(|| format!("g_{}", uuid::Uuid::new_v4().simple()));
    let now = js_sys::Date::now() as i64;
    db::run(&database, "INSERT INTO games (id, creator_principal, name, status, version, visitors, players, revenue, available_balance, escrowed_balance, created_at, updated_at) VALUES (?, ?, ?, 'DRAFT', '---', '---', '---', '---', '---', '---', ?, ?)", &[json!(id.clone()), json!(claims.principal_id), json!(name.clone()), json!(now), json!(now)]).await?;
    response::json(request, env, &json!({ "success": true, "game": { "id": id, "name": name, "shortName": "", "status": "DRAFT", "version": "---", "players": "---", "visitors": "---", "revenue": "---", "availableBalance": "---", "escrowedBalance": "---", "createdAt": now, "profile": { "description": "", "coverImage": "", "animationUrl": "" } } }), 201)
}

async fn update(game_id: &str, request: &mut Request, env: &Env) -> Result<Response> {
    let claims = match creator(request, env) { Ok(value) => value, Err(error) if error.to_string() == "UNAUTHORIZED" => return response::error(request, env, "Authentication required", 401, "UNAUTHORIZED"), Err(_) => return response::error(request, env, "Creator access required", 403, "FORBIDDEN") };
    let body = request.json::<Value>().await.unwrap_or_else(|_| json!({}));
    let database = db::database(env)?;
    let existing = db::first(&database, "SELECT * FROM games WHERE id = ? AND (creator_principal = ? OR ? = 'admin')", &[json!(game_id), json!(claims.principal_id.clone()), json!(claims.role)]).await?;
    let Some(existing) = existing else { return response::error(request, env, "Game not found", 404, "NOT_FOUND"); };
    let empty_profile = json!({});
    let profile = body.get("profile").unwrap_or(&empty_profile);
    let name = body.get("name").and_then(Value::as_str).map(str::trim).filter(|value| !value.is_empty()).map(ToOwned::to_owned).or_else(|| db::string(&existing, "name")).unwrap_or_else(|| "new game".to_string());
    let short_name = body.get("shortName").and_then(Value::as_str).map(|value| value.trim().to_lowercase()).or_else(|| db::string(&existing, "short_name")).unwrap_or_default();
    if !short_name.is_empty() && !short_name.chars().all(|value| value.is_ascii_lowercase() || value.is_ascii_digit() || value == '-') { return response::error(request, env, "Short name may contain only lowercase letters, numbers, and hyphens", 400, "INVALID_SHORT_NAME"); }
    let status = body.get("status").and_then(Value::as_str).map(ToOwned::to_owned).or_else(|| db::string(&existing, "status")).unwrap_or_else(|| "DRAFT".to_string());
    if status == "PUBLIC_ACTIVE" { return response::error(request, env, "Public active status can only be set by the public release operation", 409, "PUBLIC_RELEASE_REQUIRED"); }
    if status == "APPROVED" && !auth::has_role(&claims, "admin") { return response::error(request, env, "Only an administrator can approve a game for public release", 403, "PUBLIC_APPROVAL_REQUIRED"); }
    let display = body.get("displayVersion").or_else(|| profile.get("displayVersion")).and_then(Value::as_str).map(ToOwned::to_owned).or_else(|| db::string(&existing, "display_version")).unwrap_or_default();
    let description = profile.get("description").and_then(Value::as_str).map(ToOwned::to_owned).or_else(|| db::string(&existing, "description"));
    let cover = profile.get("coverImage").and_then(Value::as_str).map(ToOwned::to_owned).or_else(|| db::string(&existing, "cover_image"));
    let animation = profile.get("animationUrl").and_then(Value::as_str).map(ToOwned::to_owned).or_else(|| db::string(&existing, "animation_url"));
    db::run(&database, "UPDATE games SET name = ?, short_name = ?, status = ?, display_version = ?, description = ?, cover_image = ?, animation_url = ?, updated_at = ? WHERE id = ?", &[json!(name), json!(short_name), json!(status), json!(display), json!(description), json!(cover), json!(animation), json!(js_sys::Date::now() as i64), json!(game_id)]).await?;
    response::json(request, env, &json!({ "success": true }), 200)
}

async fn delete(game_id: &str, request: &Request, env: &Env) -> Result<Response> {
    let claims = match creator(request, env) { Ok(value) => value, Err(error) if error.to_string() == "UNAUTHORIZED" => return response::error(request, env, "Authentication required", 401, "UNAUTHORIZED"), Err(_) => return response::error(request, env, "Creator access required", 403, "FORBIDDEN") };
    let database = db::database(env)?;
    db::run(&database, "DELETE FROM games WHERE id = ? AND (creator_principal = ? OR ? = 'admin')", &[json!(game_id), json!(claims.principal_id), json!(claims.role)]).await?;
    response::json(request, env, &json!({ "success": true }), 200)
}
