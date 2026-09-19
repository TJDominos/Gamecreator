use std::{cell::RefCell, collections::HashMap};

use serde_json::json;
use sha2::{Digest, Sha256};
use worker::{js_sys, Bucket, Cache, Env, Method, Request, Response, Result};

use crate::db;

const POINTER_CACHE_TTL_MS: i64 = 25_000;

#[derive(Clone)]
struct PointerCacheEntry {
    prefix: String,
    expires_at: i64,
}

thread_local! {
    static POINTER_CACHE: RefCell<HashMap<String, PointerCacheEntry>> = RefCell::new(HashMap::new());
}

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
    let is_sandbox = parts[0] == "sandbox";
    let is_private = parts[0] == "private" || private_token.is_some();
    if !is_sandbox && !is_private { game_id = resolve_public_game_id(&game_id, env).await?; }
    let database = db::database(env)?;
    let prefix = if let Some(token) = private_token { resolve_private_prefix(&database, &game_id, &token).await? } else if is_sandbox { resolve_sandbox_prefix(&database, &game_id).await? } else { resolve_public_prefix(&database, &game_id).await? };
    let Some(prefix) = prefix else { return Ok(Some(Response::error("Game release not found", 404)?)); };
    let cache_request = if request.method() == Method::Get && !is_private && target_path != "index.html" {
        let separator = if url.query_pairs().next().is_some() { '&' } else { '?' };
        Some(Request::new(&format!("{}{}__release={}", request.url()?, separator, urlencoding::encode(&prefix)), Method::Get)?)
    } else { None };
    if let Some(cache_request) = cache_request.as_ref() {
        if let Some(response) = Cache::open("default".to_string()).await.get(cache_request, true).await? { return Ok(Some(response)); }
    }
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
    let response = builder.body(body);
    if let Some(cache_request) = cache_request.as_ref() {
        let cache = Cache::open("default".to_string()).await;
        cache.put(cache_request, response).await?;
        return Ok(cache.get(cache_request, true).await?);
    }
    Ok(Some(response))
}

async fn resolve_public_game_id(identifier: &str, env: &Env) -> Result<String> {
    let cache_key = format!("public:{identifier}").to_ascii_lowercase();
    if let Some(value) = cached_prefix(&cache_key) { return Ok(value); }
    let row = db::first(&db::database(env)?, "SELECT id FROM games WHERE lower(trim(short_name)) = lower(trim(?)) AND status = 'PUBLIC_ACTIVE' LIMIT 1", &[json!(identifier)]).await?;
    let resolved = row.and_then(|value| db::string(&value, "id")).unwrap_or_else(|| identifier.to_string());
    cache_prefix(cache_key, resolved.clone());
    Ok(resolved)
}

async fn resolve_public_prefix(database: &worker::d1::D1Database, game_id: &str) -> Result<Option<String>> {
    let cache_key = format!("pointer:{game_id}");
    if let Some(value) = cached_prefix(&cache_key) { return Ok(Some(value)); }
    let prefix = db::first(database, "SELECT p.artifact_prefix FROM game_release_pointers p JOIN games g ON g.id = p.game_id WHERE p.game_id = ? AND g.status = 'PUBLIC_ACTIVE'", &[json!(game_id)]).await?.and_then(|row| db::string(&row, "artifact_prefix"));
    if let Some(value) = prefix.clone() { cache_prefix(cache_key, value); }
    Ok(prefix)
}

async fn resolve_sandbox_prefix(database: &worker::d1::D1Database, game_id: &str) -> Result<Option<String>> {
    let cache_key = format!("sandbox:{game_id}");
    if let Some(value) = cached_prefix(&cache_key) { return Ok(Some(value)); }
    let prefix = db::first(database, "SELECT artifact_prefix FROM game_sandbox_pointers WHERE game_id = ?", &[json!(game_id)]).await?.and_then(|row| db::string(&row, "artifact_prefix"));
    if let Some(value) = prefix.clone() { cache_prefix(cache_key, value); }
    Ok(prefix)
}

async fn resolve_private_prefix(database: &worker::d1::D1Database, game_id: &str, token: &str) -> Result<Option<String>> {
    let hash = hex::encode(Sha256::digest(token.as_bytes()));
    let prefix = db::first(database, "SELECT d.artifact_prefix FROM private_releases r JOIN deployment_records d ON d.id = r.deployment_id WHERE r.game_id = ? AND r.token_hash = ? AND r.revoked_at IS NULL AND (r.expires_at IS NULL OR r.expires_at > ?) AND d.status IN ('ready', 'published')", &[json!(game_id), json!(hash), json!(js_sys::Date::now() as i64)]).await?.and_then(|row| db::string(&row, "artifact_prefix"));
    Ok(prefix)
}

fn cached_prefix(key: &str) -> Option<String> {
    let now = js_sys::Date::now() as i64;
    POINTER_CACHE.with(|cache| {
        let mut cache = cache.borrow_mut();
        let entry = cache.get(key).cloned();
        if entry.as_ref().map(|value| value.expires_at > now).unwrap_or(false) { return entry.map(|value| value.prefix); }
        cache.remove(key);
        None
    })
}

fn cache_prefix(key: String, prefix: String) {
    POINTER_CACHE.with(|cache| { cache.borrow_mut().insert(key, PointerCacheEntry { prefix, expires_at: js_sys::Date::now() as i64 + POINTER_CACHE_TTL_MS }); });
}

fn normalize_path(path: &str) -> Option<String> { if path.is_empty() { return Some("index.html".to_string()); } if path.len() > 512 || path.starts_with('/') || path.contains('\\') || path.split('/').any(|part| part.is_empty() || part == "." || part == "..") { None } else { Some(path.to_string()) } }
fn mime(path: &str) -> &'static str { match path.rsplit('.').next().unwrap_or_default().to_ascii_lowercase().as_str() { "html" => "text/html; charset=utf-8", "js" | "mjs" => "application/javascript; charset=utf-8", "css" => "text/css; charset=utf-8", "json" => "application/json", "wasm" => "application/wasm", "png" => "image/png", "jpg" | "jpeg" => "image/jpeg", "svg" => "image/svg+xml", "mp4" => "video/mp4", _ => "application/octet-stream" } }