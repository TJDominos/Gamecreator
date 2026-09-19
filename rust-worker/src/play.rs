use serde_json::json;
use sha2::{Digest, Sha256};
use worker::{js_sys, Bucket, Env, Method, Request, Response, Result};

use crate::db;

pub async fn route(request: &Request, env: &Env) -> Result<Option<Response>> {
    if !matches!(request.method(), Method::Get | Method::Head) { return Ok(None); }
    let path = request.path();
    let parts: Vec<&str> = path.split('/').filter(|value| !value.is_empty()).collect();
    if parts.is_empty() || parts[0].starts_with("api") || parts[0] == "dashboard" { return Ok(None); }
    let mut game_id = parts[0].to_string();
    let mut index = 1;
    let mut private_token = None;
    if parts[0] == "sandbox" && parts.len() > 1 { game_id = parts[1].to_string(); index = 2; }
    else if parts[0] == "private" && parts.len() > 2 { game_id = parts[1].to_string(); private_token = Some(parts[2].to_string()); index = 3; }
    let url = request.url()?;
    if private_token.is_none() { private_token = url.query_pairs().find(|(key, _)| key == "token").map(|(_, value)| value.to_string()); }
    let mut target_path = normalize_path(parts.get(index..).unwrap_or_default().join("/").as_str()).unwrap_or_else(|| "index.html".to_string());
    if parts[0] != "sandbox" && parts[0] != "private" { let public = db::first(&db::database(env)?, "SELECT id FROM games WHERE lower(trim(short_name)) = lower(trim(?)) AND status = 'PUBLIC_ACTIVE' LIMIT 1", &[json!(game_id.clone())]).await?; if let Some(row) = public { game_id = db::string(&row, "id").unwrap_or(game_id); } }
    let database = db::database(env)?;
    let prefix = if let Some(token) = private_token { let hash = hex::encode(Sha256::digest(token.as_bytes())); db::first(&database, "SELECT d.artifact_prefix FROM private_releases r JOIN deployment_records d ON d.id = r.deployment_id WHERE r.game_id = ? AND r.token_hash = ? AND r.revoked_at IS NULL AND (r.expires_at IS NULL OR r.expires_at > ?) AND d.status = 'published'", &[json!(game_id.clone()), json!(hash), json!(js_sys::Date::now() as i64)]).await?.and_then(|row| db::string(&row, "artifact_prefix")) } else { db::first(&database, "SELECT artifact_prefix FROM game_release_pointers WHERE game_id = ?", &[json!(game_id.clone())]).await?.and_then(|row| db::string(&row, "artifact_prefix")) };
    let Some(prefix) = prefix else { return Ok(Some(Response::error("Game release not found", 404)?)); };
    let bucket: Bucket = env.bucket("ARTIFACTS")?;
    let mut key = format!("{prefix}/{target_path}");
    let mut object = if request.method() == Method::Head { bucket.head(&key).await? } else { bucket.get(&key).execute().await? };
    if object.is_none() && request.headers().get("Accept-Encoding").ok().flatten().unwrap_or_default().contains("br") && !target_path.ends_with(".br") { key.push_str(".br"); object = if request.method() == Method::Head { bucket.head(&key).await? } else { bucket.get(&key).execute().await? }; }
    if object.is_none() && target_path != "index.html" && !target_path.contains('.') {
        key = format!("{prefix}/index.html");
        object = if request.method() == Method::Head { bucket.head(&key).await? } else { bucket.get(&key).execute().await? };
        if object.is_some() { target_path = "index.html".to_string(); }
    }
    if object.is_none() { return Ok(Some(Response::error("File not found", 404)?)); }
    let Some(object) = object else { return Ok(Some(Response::error("File not found", 404)?)); };
    let connect_sources = env.var("GAME_CSP_CONNECT_SRC").map(|value| value.to_string()).unwrap_or_else(|_| "'self'".to_string()).split(',').map(str::trim).filter(|value| !value.is_empty()).collect::<Vec<_>>().join(" ");
    let csp = format!("default-src 'self' blob: data:; base-uri 'none'; object-src 'none'; frame-ancestors 'self' https://randseed.org https://*.randseed.org https://devcreator.randseed.org http://localhost:* http://127.0.0.1:*; form-action 'none'; script-src 'self' 'unsafe-eval' 'unsafe-inline' 'wasm-unsafe-eval' blob:; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; media-src 'self' data: blob: https:; font-src 'self' data: https:; connect-src 'self' {connect_sources} https: wss:; worker-src 'self' blob:; manifest-src 'self'");
    let mut builder = Response::builder().with_header("Cache-Control", if target_path == "index.html" { "no-cache, no-store, must-revalidate" } else { "public, max-age=31536000, immutable" })?.with_header("Content-Type", mime(&target_path))?.with_header("Content-Security-Policy", &csp)?.with_header("X-Content-Type-Options", "nosniff")?.with_header("Referrer-Policy", "no-referrer-when-downgrade")?.with_header("Permissions-Policy", "camera=(), microphone=(), geolocation=(), autoplay=(self), fullscreen=(self), gamepad=(self)")?.with_header("Cross-Origin-Opener-Policy", "same-origin")?.with_header("Cross-Origin-Embedder-Policy", "credentialless")?.with_header("Cross-Origin-Resource-Policy", "cross-origin")?;
    if key.ends_with(".br") { builder = builder.with_header("Content-Encoding", "br")?; }
    if request.method() == Method::Head { return Ok(Some(builder.empty())); }
    let body = object.body().ok_or_else(|| worker::Error::from("release body unavailable"))?.response_body()?;
    Ok(Some(builder.body(body)))
}

fn normalize_path(path: &str) -> Option<String> { if path.is_empty() { return Some("index.html".to_string()); } if path.len() > 512 || path.starts_with('/') || path.contains('\\') || path.split('/').any(|part| part.is_empty() || part == "." || part == "..") { None } else { Some(path.to_string()) } }
fn mime(path: &str) -> &'static str { match path.rsplit('.').next().unwrap_or_default().to_ascii_lowercase().as_str() { "html" => "text/html; charset=utf-8", "js" | "mjs" => "application/javascript; charset=utf-8", "css" => "text/css; charset=utf-8", "json" => "application/json", "wasm" => "application/wasm", "png" => "image/png", "jpg" | "jpeg" => "image/jpeg", "svg" => "image/svg+xml", "mp4" => "video/mp4", _ => "application/octet-stream" } }