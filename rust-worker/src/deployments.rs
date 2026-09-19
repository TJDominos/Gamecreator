use serde_json::{json, Value};
use sha2::{Digest, Sha256};
use worker::{Bucket, Env, HttpMetadata, Method, Request, Result, Response};

use crate::{auth, db, github, response};

pub async fn route(request: &mut Request, env: &Env) -> Result<Option<Response>> {
    let path = request.path();
    if let Some(rest) = path.strip_prefix("/api/games/") {
        let mut parts = rest.split('/');
        let game_id = parts.next().unwrap_or_default();
        if parts.next() == Some("deployments") && request.method() == Method::Get {
            return Ok(Some(if let Some(deployment_id) = parts.next() { get(game_id, deployment_id, request, env).await? } else { list(game_id, request, env).await? }));
        }
        if let Some(rest) = rest.strip_prefix(&format!("{game_id}/private-releases")) {
            let release_id = rest.strip_prefix('/').filter(|value| !value.is_empty());
            return Ok(Some(match (request.method(), release_id) {
                (Method::Get, None) => active_private(game_id, request, env).await?,
                (Method::Post, None) => create_private(game_id, request, env).await?,
                (Method::Delete, Some(id)) => revoke_private(game_id, id, request, env).await?,
                _ => return Ok(None),
            }));
        }
    }
    if let Some(rest) = path.strip_prefix("/api/deployments/") {
        let mut parts = rest.split('/');
        let deployment_id = parts.next().unwrap_or_default();
        if request.method() == Method::Get && parts.next() == Some("events") { return Ok(Some(events(deployment_id, request, env).await?)); }
        if request.method() == Method::Get && parts.next().is_none() { return Ok(Some(get_any(deployment_id, request, env).await?)); }
        if request.method() == Method::Post && parts.next() == Some("upload-session") { return Ok(Some(create_upload_session(deployment_id, request, env).await?)); }
        if request.method() == Method::Post && parts.next() == Some("upload-complete") { return Ok(Some(complete_upload(deployment_id, request, env).await?)); }
    }
    if let Some(rest) = path.strip_prefix("/api/deployments/") {
        let mut parts = rest.split('/');
        let deployment_id = parts.next().unwrap_or_default();
        if request.method() == Method::Put && parts.next() == Some("artifact") { let file_path = parts.collect::<Vec<_>>().join("/"); return Ok(Some(upload_artifact(deployment_id, &file_path, request, env).await?)); }
    }
    Ok(None)
}

fn bearer(request: &Request) -> Option<String> { request.headers().get("Authorization").ok().flatten().and_then(|value| value.strip_prefix("Bearer ").map(|token| token.trim().to_string())).filter(|value| !value.is_empty()) }
fn sha256(value: &str) -> String { hex::encode(Sha256::digest(value.as_bytes())) }

fn manifest(body: &Value, deployment_id: &str, commit_sha: &str, build_dir: &str) -> Option<(Vec<Value>, i64)> {
    let object = body.as_object()?;
    if object.get("deployment_id")?.as_str()? != deployment_id || object.get("commit_sha")?.as_str()? != commit_sha || object.get("root")?.as_str()? != build_dir { return None; }
    let files = object.get("files")?.as_array()?.clone();
    if files.is_empty() || files.len() > 5000 { return None; }
    let mut total = 0_i64;
    let mut paths = std::collections::HashSet::with_capacity(files.len());
    for file in &files { let path = file.get("path")?.as_str()?; let digest = file.get("sha256")?.as_str()?; let size = file.get("size")?.as_i64()?; if path.is_empty() || path.contains("..") || path.starts_with('/') || digest.len() != 64 || !digest.bytes().all(|byte| byte.is_ascii_hexdigit()) || size < 0 || !paths.insert(path.to_string()) { return None; } total = total.checked_add(size)?; }
    if object.get("total_bytes")?.as_i64()? != total { return None; }
    Some((files, total))
}

async fn create_upload_session(deployment_id: &str, request: &mut Request, env: &Env) -> Result<Response> {
    if env.bucket("ARTIFACTS").is_err() { return response::error(request, env, "Artifact storage is not configured", 503, "R2_NOT_CONFIGURED"); }
    let database = db::database(env)?;
    let Some(deployment) = db::first(&database, "SELECT * FROM deployment_records WHERE id = ?", &[json!(deployment_id)]).await? else { return response::error(request, env, "Deployment not found", 404, "NOT_FOUND"); };
    let body = request.json::<Value>().await.unwrap_or_else(|_| json!({}));
    let commit = db::string(&deployment, "commit_sha").unwrap_or_default();
    let build_dir = db::string(&deployment, "build_dir").unwrap_or_else(|| "dist".to_string());
    let Some((files, total)) = manifest(body.get("manifest").unwrap_or(&Value::Null), deployment_id, &commit, &build_dir) else { return response::error(request, env, "Invalid deployment manifest", 400, "INVALID_MANIFEST"); };
    let max = env.var("MAX_ARTIFACT_BYTES").ok().and_then(|value| value.to_string().parse::<i64>().ok()).unwrap_or(25 * 1024 * 1024);
    if total > max { return response::error(request, env, "Artifact exceeds the configured size limit", 413, "ARTIFACT_TOO_LARGE"); }
    let Some(oidc_token) = bearer(request) else { return response::error(request, env, "GitHub OIDC token is required", 401, "OIDC_REQUIRED"); };
    if let Err(error) = github::verify_github_oidc(&oidc_token, env, &db::string(&deployment, "repository").unwrap_or_default(), &commit, &db::string(&deployment, "branch").unwrap_or_default(), &env.var("GITHUB_ACTION_WORKFLOW").map(|value| value.to_string()).unwrap_or_else(|_| "randseed-deploy.yml".to_string())).await { return response::error(request, env, &error, 401, "INVALID_OIDC"); }
    if !matches!(db::string(&deployment, "status").as_deref(), Some("pending") | Some("queued") | Some("building") | Some("build_succeeded") | Some("uploading")) { return response::error(request, env, "Deployment is not accepting an artifact", 409, "INVALID_DEPLOYMENT_STATE"); }
    if db::first(&database, "SELECT id FROM deployment_upload_sessions WHERE deployment_id = ? AND completed_at IS NULL", &[json!(deployment_id)]).await?.is_some() { return response::error(request, env, "An upload session already exists for this deployment", 409, "UPLOAD_SESSION_EXISTS"); }
    let now = worker::js_sys::Date::now() as i64;
    let session_id = format!("ups_{}", uuid::Uuid::new_v4().simple());
    let token = format!("rs_upload_{}", uuid::Uuid::new_v4().simple());
    let prefix = format!("tenants/{}/games/{}/releases/{}", db::string(&deployment, "tenant_id").unwrap_or_default(), db::string(&deployment, "game_id").unwrap_or_default(), commit);
    db::run(&database, "INSERT INTO deployment_upload_sessions (id, deployment_id, token_hash, object_prefix, expected_manifest_json, expected_files, expected_bytes, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", &[json!(session_id.clone()), json!(deployment_id), json!(sha256(&token)), json!(prefix.clone()), json!(body.get("manifest").cloned().unwrap_or(Value::Null).to_string()), json!(files.len() as i64), json!(total), json!(now + 15 * 60 * 1000), json!(now)]).await?;
    for file in &files { db::run(&database, "INSERT INTO deployment_upload_files (session_id, path, expected_sha256, expected_size, object_key) VALUES (?, ?, ?, ?, ?)", &[json!(session_id.clone()), file.get("path").cloned().unwrap_or(Value::Null), file.get("sha256").cloned().unwrap_or(Value::Null), file.get("size").cloned().unwrap_or(Value::Null), json!(format!("{}/{}", prefix, file.get("path").and_then(Value::as_str).unwrap_or_default()))]).await?; }
    db::run(&database, "UPDATE deployment_records SET status = 'uploading', upload_session_id = ?, artifact_prefix = ?, started_at = COALESCE(started_at, ?) WHERE id = ?", &[json!(session_id.clone()), json!(prefix), json!(now), json!(deployment_id)]).await?;
    response::json(request, env, &json!({ "success": true, "deployment_id": deployment_id, "upload_session_id": session_id, "upload_token": token, "expires_at": now + 15 * 60 * 1000, "upload_base_url": format!("/api/deployments/{}/artifact", deployment_id) }), 201)
}

async fn upload_artifact(deployment_id: &str, file_path: &str, request: &mut Request, env: &Env) -> Result<Response> {
    let Some(token) = bearer(request) else { return response::error(request, env, "Upload token and file path are required", 401, "UPLOAD_AUTH_REQUIRED"); };
    if file_path.is_empty() || file_path.contains("..") || file_path.starts_with('/') { return response::error(request, env, "Upload token and file path are required", 401, "UPLOAD_AUTH_REQUIRED"); }
    let database = db::database(env)?;
    let session = db::first(&database, "SELECT s.* FROM deployment_upload_sessions s JOIN deployment_records d ON d.id = s.deployment_id WHERE s.deployment_id = ? AND s.token_hash = ? AND s.completed_at IS NULL AND s.expires_at > ? AND d.status = 'uploading'", &[json!(deployment_id), json!(sha256(&token)), json!(worker::js_sys::Date::now() as i64)]).await?;
    let Some(session) = session else { return response::error(request, env, "Upload session is invalid or expired", 401, "INVALID_UPLOAD_TOKEN"); };
    let Some(file) = db::first(&database, "SELECT * FROM deployment_upload_files WHERE session_id = ? AND path = ?", &[json!(db::string(&session, "id").unwrap_or_default()), json!(file_path)]).await? else { return response::error(request, env, "File is not part of the deployment manifest", 403, "FILE_NOT_DECLARED"); };
    let bytes = request.bytes().await?;
    if bytes.len() as i64 != db::integer(&file, "expected_size") { return response::error(request, env, "Uploaded file size does not match the manifest", 400, "SIZE_MISMATCH"); }
    let bucket: Bucket = env.bucket("ARTIFACTS")?;
    let expected_sha256 = hex_to_bytes(&db::string(&file, "expected_sha256").unwrap_or_default()).ok_or_else(|| worker::Error::from("invalid expected checksum"))?;
    bucket.put(&db::string(&file, "object_key").unwrap_or_default(), bytes).sha256(expected_sha256).http_metadata(HttpMetadata { content_type: Some("application/octet-stream".to_string()), ..Default::default() }).execute().await?;
    db::run(&database, "UPDATE deployment_upload_files SET uploaded_at = ? WHERE session_id = ? AND path = ? AND uploaded_at IS NULL", &[json!(worker::js_sys::Date::now() as i64), json!(db::string(&session, "id").unwrap_or_default()), json!(file_path)]).await?;
    response::json(request, env, &json!({ "success": true, "path": file_path }), 200)
}

async fn complete_upload(deployment_id: &str, request: &mut Request, env: &Env) -> Result<Response> {
    let database = db::database(env)?;
    let Some(deployment) = db::first(&database, "SELECT * FROM deployment_records WHERE id = ?", &[json!(deployment_id)]).await? else { return response::error(request, env, "Deployment not found", 404, "NOT_FOUND"); };
    let body = request.json::<Value>().await.unwrap_or_else(|_| json!({}));
    let Some(oidc_token) = bearer(request) else { return response::error(request, env, "Manifest and GitHub OIDC token are required", 400, "INVALID_COMPLETION"); };
    if let Err(error) = github::verify_github_oidc(&oidc_token, env, &db::string(&deployment, "repository").unwrap_or_default(), &db::string(&deployment, "commit_sha").unwrap_or_default(), &db::string(&deployment, "branch").unwrap_or_default(), &env.var("GITHUB_ACTION_WORKFLOW").map(|value| value.to_string()).unwrap_or_else(|_| "randseed-deploy.yml".to_string())).await { return response::error(request, env, &error, 401, "INVALID_OIDC"); }
    let Some(session) = db::first(&database, "SELECT * FROM deployment_upload_sessions WHERE deployment_id = ? AND completed_at IS NULL AND expires_at > ?", &[json!(deployment_id), json!(worker::js_sys::Date::now() as i64)]).await? else { return response::error(request, env, "Upload session is invalid or expired", 409, "INVALID_UPLOAD_SESSION"); };
    let submitted_manifest = body.get("manifest").and_then(|value| manifest(value, deployment_id, &db::string(&deployment, "commit_sha").unwrap_or_default(), &db::string(&deployment, "build_dir").unwrap_or_else(|| "dist".to_string())));
    let expected_manifest = session.get("expected_manifest_json").and_then(Value::as_str).and_then(|value| serde_json::from_str::<Value>(value).ok()).and_then(|value| manifest(&value, deployment_id, &db::string(&deployment, "commit_sha").unwrap_or_default(), &db::string(&deployment, "build_dir").unwrap_or_else(|| "dist".to_string())));
    if submitted_manifest != expected_manifest { return response::error(request, env, "Completion manifest does not match the authorized manifest", 400, "MANIFEST_MISMATCH"); }
    let files = db::all(&database, "SELECT * FROM deployment_upload_files WHERE session_id = ?", &[json!(db::string(&session, "id").unwrap_or_default())]).await?;
    if files.len() != db::integer(&session, "expected_files") as usize || files.iter().any(|file| file.get("uploaded_at").is_none() || file.get("uploaded_at") == Some(&Value::Null)) { return response::error(request, env, "Not all manifest files have been uploaded", 409, "FILES_MISSING"); }
    let bucket: Bucket = env.bucket("ARTIFACTS")?;
    for file in &files {
        let key = db::string(file, "object_key").unwrap_or_default();
        let Some(object) = bucket.head(&key).await? else { return response::error(request, env, &format!("Artifact verification failed for {}", db::string(file, "path").unwrap_or_default()), 400, "ARTIFACT_VERIFICATION_FAILED"); };
        if object.size() != db::integer(file, "expected_size") as u64 { return response::error(request, env, &format!("Artifact verification failed for {}", db::string(file, "path").unwrap_or_default()), 400, "ARTIFACT_VERIFICATION_FAILED"); }
        let actual = object.checksum().sha256.map(|value| hex::encode(value));
        if actual.as_deref() != db::string(file, "expected_sha256").as_deref() { return response::error(request, env, &format!("Artifact checksum mismatch for {}", db::string(file, "path").unwrap_or_default()), 400, "CHECKSUM_MISMATCH"); }
    }
    let now = worker::js_sys::Date::now() as i64;
    if db::run_changes(&database, "UPDATE deployment_records SET status = 'publishing', artifact_sha256 = ?, artifact_size = ?, uploaded_at = ? WHERE id = ? AND status = 'uploading'", &[json!(sha256(&body.get("manifest").cloned().unwrap_or(Value::Null).to_string())), json!(db::integer(&session, "expected_bytes")), json!(now), json!(deployment_id)]).await? == 0 { return response::error(request, env, "Deployment is no longer publishable", 409, "DEPLOYMENT_RACE"); }
    if let Some(newer) = db::first(&database, "SELECT id FROM deployment_records WHERE game_id = ? AND created_at > ? AND status NOT IN ('failed', 'cancelled', 'superseded') LIMIT 1", &[json!(db::string(&deployment, "game_id").unwrap_or_default()), json!(db::integer(&deployment, "created_at"))]).await? { db::run(&database, "UPDATE deployment_records SET status = 'superseded', error_code = 'NEWER_DEPLOYMENT', error_message = 'A newer deployment exists', finished_at = ? WHERE id = ? AND status = 'publishing'", &[json!(now), json!(deployment_id)]).await?; return response::error(request, env, &format!("A newer deployment ({}) has superseded this build", db::string(&newer, "id").unwrap_or_default()), 409, "SUPERSEDED"); }
    let pointer = db::first(&database, "SELECT * FROM game_release_pointers WHERE game_id = ?", &[json!(db::string(&deployment, "game_id").unwrap_or_default())]).await?;
    let game_id = db::string(&deployment, "game_id").unwrap_or_default();
    let published = if let Some(pointer) = pointer {
        let active = db::first(&database, "SELECT created_at FROM deployment_records WHERE id = ?", &[pointer.get("active_deployment_id").cloned().unwrap_or(Value::Null)]).await?;
        if active.as_ref().map(|row| db::integer(row, "created_at") >= db::integer(&deployment, "created_at")).unwrap_or(false) { false } else { db::run_changes(&database, "UPDATE game_release_pointers SET active_deployment_id = ?, artifact_prefix = ?, version = version + 1, updated_at = ? WHERE game_id = ? AND version = ? AND active_deployment_id = ?", &[json!(deployment_id), json!(db::string(&session, "object_prefix").unwrap_or_default()), json!(now), json!(game_id.clone()), pointer.get("version").cloned().unwrap_or(Value::Null), pointer.get("active_deployment_id").cloned().unwrap_or(Value::Null)]).await? == 1 }
    } else { db::run_changes(&database, "INSERT OR IGNORE INTO game_release_pointers (game_id, active_deployment_id, artifact_prefix, version, updated_at) VALUES (?, ?, ?, 1, ?)", &[json!(game_id.clone()), json!(deployment_id), json!(db::string(&session, "object_prefix").unwrap_or_default()), json!(now)]).await? == 1 };
    if !published { db::run(&database, "UPDATE deployment_records SET status = 'superseded', error_code = 'PUBLISH_RACE', error_message = 'A newer deployment is already active', finished_at = ? WHERE id = ? AND status = 'publishing'", &[json!(now), json!(deployment_id)]).await?; return response::error(request, env, "Deployment lost the publish race", 409, "PUBLISH_RACE"); }
    if db::run_changes(&database, "UPDATE deployment_records SET status = 'published', published_at = ?, finished_at = ?, live_url = ? WHERE id = ? AND status = 'publishing' AND EXISTS (SELECT 1 FROM game_release_pointers WHERE game_id = ? AND active_deployment_id = ?)", &[json!(now), json!(now), json!(format!("/sandbox/{game_id}")), json!(deployment_id), json!(game_id.clone()), json!(deployment_id)]).await? == 0 { return response::error(request, env, "Deployment lost the publish race", 409, "PUBLISH_RACE"); }
    db::run(&database, "UPDATE game_repo_bindings SET last_synced_commit = ?, last_commit_message = ?, last_synced_at = ?, sync_status = 'synced', updated_at = ? WHERE game_id = ?", &[json!(db::string(&deployment, "commit_sha").unwrap_or_default()), json!(db::string(&deployment, "commit_message").unwrap_or_default()), json!(now), json!(now), json!(game_id.clone())]).await?;
    db::run(&database, "UPDATE deployment_upload_sessions SET completed_at = ? WHERE id = ? AND completed_at IS NULL", &[json!(now), json!(db::string(&session, "id").unwrap_or_default())]).await?;
    response::json(request, env, &json!({ "success": true, "deployment_id": deployment_id, "status": "published", "live_url": format!("/sandbox/{}", db::string(&deployment, "game_id").unwrap_or_default()) }), 200)
}

async fn active_private(game_id: &str, request: &Request, env: &Env) -> Result<Response> {
    let claims = match creator(request, env) { Ok(value) => value, Err(_) => return response::error(request, env, "Authentication required", 401, "UNAUTHORIZED") };
    if !allowed(game_id, &claims, env).await? { return response::error(request, env, "You do not have access to this game", 403, "FORBIDDEN"); }
    let row = db::first(&db::database(env)?, "SELECT * FROM private_releases WHERE game_id = ? AND revoked_at IS NULL AND (expires_at IS NULL OR expires_at > ?) ORDER BY created_at DESC LIMIT 1", &[json!(game_id), json!(worker::js_sys::Date::now() as i64)]).await?;
    response::json(request, env, &json!({ "success": true, "active_release": row }), 200)
}

async fn create_private(game_id: &str, request: &mut Request, env: &Env) -> Result<Response> {
    let claims = match creator(request, env) { Ok(value) => value, Err(_) => return response::error(request, env, "Authentication required", 401, "UNAUTHORIZED") };
    if !allowed(game_id, &claims, env).await? { return response::error(request, env, "You do not have access to this game", 403, "FORBIDDEN"); }
    let body = request.json::<Value>().await.unwrap_or_else(|_| json!({}));
    let deployment_id = body.get("deployment_id").and_then(Value::as_str).unwrap_or_default();
    let days = body.get("expires_in_days").and_then(Value::as_i64).unwrap_or(7);
    if deployment_id.is_empty() { return response::error(request, env, "A deployment_id is required", 400, "MISSING_DEPLOYMENT_ID"); }
    if days < 1 || days > 30 { return response::error(request, env, "Private release expiry must be between 1 and 30 days", 400, "INVALID_EXPIRY"); }
    let database = db::database(env)?;
    if db::first(&database, "SELECT id FROM deployment_records WHERE id = ? AND game_id = ? AND status = 'published'", &[json!(deployment_id), json!(game_id)]).await?.is_none() { return response::error(request, env, "Only a published deployment can be shared", 409, "DEPLOYMENT_NOT_PUBLISHED"); }
    let now = worker::js_sys::Date::now() as i64;
    if let Some(active) = db::first(&database, "SELECT id FROM private_releases WHERE game_id = ? AND revoked_at IS NULL AND (expires_at IS NULL OR expires_at > ?)", &[json!(game_id), json!(now)]).await? { if body.get("force_replace").and_then(Value::as_bool) == Some(true) { db::run(&database, "UPDATE private_releases SET revoked_at = ? WHERE id = ?", &[json!(now), active.get("id").cloned().unwrap_or(Value::Null)]).await?; } else { return response::error(request, env, "A private publishing link is already active for this game", 409, "ACTIVE_PRIVATE_RELEASE_EXISTS"); } }
    let token = format!("rs_private_{}", uuid::Uuid::new_v4().simple());
    let release_id = format!("pr_{}", uuid::Uuid::new_v4().simple());
    let expires = now + days * 24 * 60 * 60 * 1000;
    db::run(&database, "INSERT INTO private_releases (id, tenant_id, game_id, deployment_id, token_hash, expires_at, created_by, created_at) SELECT ?, tenant_id, ?, id, ?, ?, ?, ? FROM deployment_records WHERE id = ?", &[json!(release_id.clone()), json!(game_id), json!(sha256(&token)), json!(expires), json!(claims.principal_id), json!(now), json!(deployment_id)]).await?;
    response::json(request, env, &json!({ "success": true, "release_id": release_id, "deployment_id": deployment_id, "expires_at": expires, "url": format!("/private/{game_id}/{token}/index.html") }), 201)
}

async fn revoke_private(game_id: &str, release_id: &str, request: &Request, env: &Env) -> Result<Response> {
    let claims = match creator(request, env) { Ok(value) => value, Err(_) => return response::error(request, env, "Authentication required", 401, "UNAUTHORIZED") };
    if !allowed(game_id, &claims, env).await? { return response::error(request, env, "You do not have access to this game", 403, "FORBIDDEN"); }
    db::run(&db::database(env)?, "UPDATE private_releases SET revoked_at = ? WHERE id = ? AND game_id = ? AND revoked_at IS NULL", &[json!(worker::js_sys::Date::now() as i64), json!(release_id), json!(game_id)]).await?;
    response::json(request, env, &json!({ "success": true, "release_id": release_id, "revoked": true }), 200)
}

fn creator(request: &Request, env: &Env) -> Result<auth::Claims> {
    let Some(claims) = auth::user(request, env) else { return Err(worker::Error::from("UNAUTHORIZED")); };
    if !auth::has_role(&claims, "creator") { return Err(worker::Error::from("FORBIDDEN")); }
    Ok(claims)
}

async fn allowed(game_id: &str, claims: &auth::Claims, env: &Env) -> Result<bool> {
    Ok(db::first(&db::database(env)?, "SELECT id FROM games WHERE id = ? AND (creator_principal = ? OR ? = 'admin')", &[json!(game_id), json!(claims.principal_id.clone()), json!(claims.role.clone())]).await?.is_some())
}

async fn list(game_id: &str, request: &Request, env: &Env) -> Result<Response> {
    let claims = match creator(request, env) { Ok(value) => value, Err(error) if error.to_string() == "UNAUTHORIZED" => return response::error(request, env, "Authentication required", 401, "UNAUTHORIZED"), Err(_) => return response::error(request, env, "Creator access required", 403, "FORBIDDEN") };
    if !allowed(game_id, &claims, env).await? { return response::error(request, env, "You do not have access to this game", 403, "FORBIDDEN"); }
    let rows = db::all(&db::database(env)?, "SELECT * FROM deployment_records WHERE game_id = ? ORDER BY created_at DESC", &[json!(game_id)]).await?;
    response::json(request, env, &json!({ "success": true, "deployments": rows }), 200)
}

async fn get(game_id: &str, deployment_id: &str, request: &Request, env: &Env) -> Result<Response> {
    let claims = match creator(request, env) { Ok(value) => value, Err(error) if error.to_string() == "UNAUTHORIZED" => return response::error(request, env, "Authentication required", 401, "UNAUTHORIZED"), Err(_) => return response::error(request, env, "Creator access required", 403, "FORBIDDEN") };
    if !allowed(game_id, &claims, env).await? { return response::error(request, env, "You do not have access to this game", 403, "FORBIDDEN"); }
    let row = db::first(&db::database(env)?, "SELECT * FROM deployment_records WHERE id = ? AND game_id = ?", &[json!(deployment_id), json!(game_id)]).await?;
    let Some(row) = row else { return response::error(request, env, "Deployment not found", 404, "NOT_FOUND"); };
    response::json(request, env, &json!({ "success": true, "deployment": row }), 200)
}

async fn get_any(deployment_id: &str, request: &Request, env: &Env) -> Result<Response> {
    let claims = match creator(request, env) { Ok(value) => value, Err(error) if error.to_string() == "UNAUTHORIZED" => return response::error(request, env, "Authentication required", 401, "UNAUTHORIZED"), Err(_) => return response::error(request, env, "Creator access required", 403, "FORBIDDEN") };
    let database = db::database(env)?;
    let row = db::first(&database, "SELECT d.* FROM deployment_records d JOIN games g ON g.id = d.game_id WHERE d.id = ? AND (g.creator_principal = ? OR ? = 'admin')", &[json!(deployment_id), json!(claims.principal_id), json!(claims.role)]).await?;
    let Some(row) = row else { return response::error(request, env, "Deployment not found", 404, "NOT_FOUND"); };
    response::json(request, env, &json!({ "success": true, "deployment": row }), 200)
}

async fn events(deployment_id: &str, request: &Request, env: &Env) -> Result<Response> {
    let claims = match creator(request, env) { Ok(value) => value, Err(error) if error.to_string() == "UNAUTHORIZED" => return response::error(request, env, "Authentication required", 401, "UNAUTHORIZED"), Err(_) => return response::error(request, env, "Creator access required", 403, "FORBIDDEN") };
    let rows = db::all(&db::database(env)?, "SELECT e.* FROM deployment_events e JOIN deployment_records d ON d.id = e.deployment_id JOIN games g ON g.id = d.game_id WHERE e.deployment_id = ? AND (g.creator_principal = ? OR ? = 'admin') ORDER BY e.created_at ASC", &[json!(deployment_id), json!(claims.principal_id), json!(claims.role)]).await?;
    response::json(request, env, &json!({ "success": true, "events": rows }), 200)
}

fn hex_to_bytes(value: &str) -> Option<Vec<u8>> {
    if value.len() != 64 || !value.bytes().all(|byte| byte.is_ascii_hexdigit()) { return None; }
    (0..value.len()).step_by(2).map(|index| u8::from_str_radix(&value[index..index + 2], 16).ok()).collect()
}

#[cfg(test)]
mod tests {
    use super::{hex_to_bytes, manifest};
    use serde_json::json;

    #[test]
    fn accepts_manifest_only_when_root_and_total_match() {
        let digest = "a".repeat(64);
        let value = json!({
            "deployment_id": "dep_1",
            "commit_sha": "c1",
            "root": "dist",
            "files": [{ "path": "index.html", "sha256": digest, "size": 3 }],
            "total_bytes": 3
        });
        let parsed = manifest(&value, "dep_1", "c1", "dist");
        assert!(parsed.is_some());
        assert!(manifest(&value, "dep_1", "c1", "other").is_none());
    }

    #[test]
    fn rejects_duplicate_or_traversal_paths() {
        let digest = "b".repeat(64);
        let duplicate = json!({ "deployment_id": "dep_1", "commit_sha": "c1", "root": "dist", "files": [
            { "path": "index.html", "sha256": digest, "size": 1 },
            { "path": "index.html", "sha256": digest, "size": 1 }
        ], "total_bytes": 2 });
        assert!(manifest(&duplicate, "dep_1", "c1", "dist").is_none());

        let traversal = json!({ "deployment_id": "dep_1", "commit_sha": "c1", "root": "dist", "files": [
            { "path": "../index.html", "sha256": "b".repeat(64), "size": 1 }
        ], "total_bytes": 1 });
        assert!(manifest(&traversal, "dep_1", "c1", "dist").is_none());
    }

    #[test]
    fn parses_only_full_sha256_hex_values() {
        assert_eq!(hex_to_bytes(&"00".repeat(32)).map(|bytes| bytes.len()), Some(32));
        assert!(hex_to_bytes("not-a-checksum").is_none());
        assert!(hex_to_bytes(&"0".repeat(62)).is_none());
    }
}