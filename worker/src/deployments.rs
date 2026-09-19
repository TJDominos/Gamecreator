use serde_json::{json, Value};
use sha2::{Digest, Sha256};
use worker::{Bucket, Env, HttpMetadata, Method, Request, Result, Response};

use crate::{auth, db, github, response};

pub async fn route(request: &mut Request, env: &Env) -> Result<Option<Response>> {
    let path = request.path();
    if let Some(rest) = path.strip_prefix("/api/games/") {
        let mut parts = rest.split('/');
        let game_id = parts.next().unwrap_or_default();
        let resource = parts.next();
        if resource == Some("rollback") && request.method() == Method::Post {
            return Ok(Some(rollback(game_id, request, env).await?));
        }
        if resource == Some("public-releases") && request.method() == Method::Post {
            return Ok(Some(public_release(game_id, request, env).await?));
        }
        if resource == Some("deployments") && request.method() == Method::Get {
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
        let action = parts.next();
        if request.method() == Method::Get && action == Some("events") { return Ok(Some(events(deployment_id, request, env).await?)); }
        if request.method() == Method::Get && action == Some("logs") { return Ok(Some(logs(deployment_id, request, env).await?)); }
        if request.method() == Method::Get && action.is_none() { return Ok(Some(get_any(deployment_id, request, env).await?)); }
        if request.method() == Method::Post && action == Some("upload-session") { return Ok(Some(create_upload_session(deployment_id, request, env).await?)); }
        if request.method() == Method::Post && action == Some("upload-complete") { return Ok(Some(complete_upload(deployment_id, request, env).await?)); }
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
    if files.is_empty() || files.len() > 2000 { return None; }
    let mut total = 0_i64;
    let mut paths = std::collections::HashSet::with_capacity(files.len());
    for file in &files { let path = file.get("path")?.as_str()?; let digest = file.get("sha256")?.as_str()?; let size = file.get("size")?.as_i64()?; if !static_path_allowed(path) || digest.len() != 64 || !digest.bytes().all(|byte| byte.is_ascii_hexdigit()) || size < 0 || !paths.insert(path.to_string()) { return None; } total = total.checked_add(size)?; }
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
    let oidc_run_id = match github::verify_github_oidc(&oidc_token, env, &db::string(&deployment, "repository").unwrap_or_default(), &commit, &db::string(&deployment, "branch").unwrap_or_default(), &env.var("GITHUB_ACTION_WORKFLOW").map(|value| value.to_string()).unwrap_or_else(|_| "randseed-deploy.yml".to_string())).await { Ok(run_id) => run_id, Err(error) => return response::error(request, env, &error, 401, "INVALID_OIDC") };
    if db::string(&deployment, "github_run_id").as_deref() != Some(oidc_run_id.as_str()) { return response::error(request, env, "GitHub workflow run does not match this deployment", 403, "RUN_MISMATCH"); }
    if db::string(&deployment, "status").as_deref() != Some("build_succeeded") { return response::error(request, env, "Deployment is not accepting an artifact", 409, "INVALID_DEPLOYMENT_STATE"); }
    if db::first(&database, "SELECT id FROM deployment_upload_sessions WHERE deployment_id = ? AND completed_at IS NULL", &[json!(deployment_id)]).await?.is_some() { return response::error(request, env, "An upload session already exists for this deployment", 409, "UPLOAD_SESSION_EXISTS"); }
    let now = worker::js_sys::Date::now() as i64;
    let session_id = format!("ups_{}", uuid::Uuid::new_v4().simple());
    let token = format!("rs_upload_{}", uuid::Uuid::new_v4().simple());
    let prefix = format!("tenants/{}/games/{}/deployments/{}", db::string(&deployment, "tenant_id").unwrap_or_default(), db::string(&deployment, "game_id").unwrap_or_default(), deployment_id);
    db::run(&database, "INSERT INTO deployment_upload_sessions (id, deployment_id, token_hash, object_prefix, expected_manifest_json, expected_files, expected_bytes, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", &[json!(session_id.clone()), json!(deployment_id), json!(sha256(&token)), json!(prefix.clone()), json!(body.get("manifest").cloned().unwrap_or(Value::Null).to_string()), json!(files.len() as i64), json!(total), json!(now + 15 * 60 * 1000), json!(now)]).await?;
    for file in &files { db::run(&database, "INSERT INTO deployment_upload_files (session_id, path, expected_sha256, expected_size, object_key) VALUES (?, ?, ?, ?, ?)", &[json!(session_id.clone()), file.get("path").cloned().unwrap_or(Value::Null), file.get("sha256").cloned().unwrap_or(Value::Null), file.get("size").cloned().unwrap_or(Value::Null), json!(format!("{}/{}", prefix, file.get("path").and_then(Value::as_str).unwrap_or_default()))]).await?; }
    if db::run_changes(&database, "UPDATE deployment_records SET status = 'uploading', upload_session_id = ?, artifact_prefix = ?, started_at = COALESCE(started_at, ?) WHERE id = ? AND status = 'build_succeeded'", &[json!(session_id.clone()), json!(prefix), json!(now), json!(deployment_id)]).await? == 0 { return response::error(request, env, "Deployment is no longer accepting an artifact", 409, "DEPLOYMENT_RACE"); }
    response::json(request, env, &json!({ "success": true, "deployment_id": deployment_id, "upload_session_id": session_id, "upload_token": token, "expires_at": now + 15 * 60 * 1000, "upload_base_url": format!("/api/deployments/{}/artifact", deployment_id) }), 201)
}

async fn upload_artifact(deployment_id: &str, file_path: &str, request: &mut Request, env: &Env) -> Result<Response> {
    let Some(token) = bearer(request) else { return response::error(request, env, "Upload token and file path are required", 401, "UPLOAD_AUTH_REQUIRED"); };
    if file_path.is_empty() || file_path.contains("..") || file_path.starts_with('/') { return response::error(request, env, "Upload token and file path are required", 401, "UPLOAD_AUTH_REQUIRED"); }
    let database = db::database(env)?;
    let session = db::first(&database, "SELECT s.* FROM deployment_upload_sessions s JOIN deployment_records d ON d.id = s.deployment_id WHERE s.deployment_id = ? AND s.token_hash = ? AND s.completed_at IS NULL AND s.expires_at > ? AND d.status = 'uploading'", &[json!(deployment_id), json!(sha256(&token)), json!(worker::js_sys::Date::now() as i64)]).await?;
    let Some(session) = session else { return response::error(request, env, "Upload session is invalid or expired", 401, "INVALID_UPLOAD_TOKEN"); };
    let Some(file) = db::first(&database, "SELECT * FROM deployment_upload_files WHERE session_id = ? AND path = ? AND uploaded_at IS NULL", &[json!(db::string(&session, "id").unwrap_or_default()), json!(file_path)]).await? else { return response::error(request, env, "File is not part of the deployment manifest or was already uploaded", 409, "FILE_NOT_DECLARED"); };
    let bytes = request.bytes().await?;
    if bytes.len() as i64 != db::integer(&file, "expected_size") { return response::error(request, env, "Uploaded file size does not match the manifest", 400, "SIZE_MISMATCH"); }
    if !static_content_allowed(file_path, &bytes) { return response::error(request, env, "Artifact violates the static content security rules", 400, "STATIC_CONTENT_REJECTED"); }
    let bucket: Bucket = env.bucket("ARTIFACTS")?;
    if bucket.head(&db::string(&file, "object_key").unwrap_or_default()).await?.is_some() { return response::error(request, env, "Artifact object already exists", 409, "IMMUTABLE_OBJECT_EXISTS"); }
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
    let oidc_run_id = match github::verify_github_oidc(&oidc_token, env, &db::string(&deployment, "repository").unwrap_or_default(), &db::string(&deployment, "commit_sha").unwrap_or_default(), &db::string(&deployment, "branch").unwrap_or_default(), &env.var("GITHUB_ACTION_WORKFLOW").map(|value| value.to_string()).unwrap_or_else(|_| "randseed-deploy.yml".to_string())).await { Ok(run_id) => run_id, Err(error) => return response::error(request, env, &error, 401, "INVALID_OIDC") };
    if db::string(&deployment, "github_run_id").as_deref() != Some(oidc_run_id.as_str()) { return response::error(request, env, "GitHub workflow run does not match this deployment", 403, "RUN_MISMATCH"); }
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
    let manifest_hash = sha256(&body.get("manifest").cloned().unwrap_or(Value::Null).to_string());
    if let Some(newer) = db::first(&database, "SELECT id FROM deployment_records WHERE game_id = ? AND created_at > ? AND status NOT IN ('failed', 'cancelled', 'superseded') LIMIT 1", &[json!(db::string(&deployment, "game_id").unwrap_or_default()), json!(db::integer(&deployment, "created_at"))]).await? { db::run(&database, "UPDATE deployment_records SET status = 'superseded', error_code = 'NEWER_DEPLOYMENT', error_message = 'A newer deployment exists', finished_at = ? WHERE id = ? AND status = 'ready'", &[json!(now), json!(deployment_id)]).await?; return response::error(request, env, &format!("A newer deployment ({}) has superseded this build", db::string(&newer, "id").unwrap_or_default()), 409, "SUPERSEDED"); }
    let game_id = db::string(&deployment, "game_id").unwrap_or_default();
    let sandbox_prefix = db::string(&session, "object_prefix").unwrap_or_default();
    if db::run_changes(&database, "UPDATE deployment_records SET status = 'verifying' WHERE id = ? AND status = 'uploading'", &[json!(deployment_id)]).await? != 1 {
        return response::error(request, env, "Deployment completion changed concurrently; retry the upload", 409, "COMPLETION_RACE");
    }
    let results = db::batch(&database, vec![
        db::statement(&database, "UPDATE deployment_records SET status = 'ready', artifact_sha256 = ?, artifact_size = ?, uploaded_at = ?, finished_at = ? WHERE id = ? AND status = 'verifying'", &[json!(manifest_hash), json!(db::integer(&session, "expected_bytes")), json!(now), json!(now), json!(deployment_id)])?,
        db::statement(&database, "INSERT INTO game_sandbox_pointers (game_id, deployment_id, artifact_prefix, version, updated_at) SELECT ?, ?, ?, 1, ? WHERE EXISTS (SELECT 1 FROM deployment_records WHERE id = ? AND status = 'ready') ON CONFLICT(game_id) DO UPDATE SET deployment_id = excluded.deployment_id, artifact_prefix = excluded.artifact_prefix, version = game_sandbox_pointers.version + 1, updated_at = excluded.updated_at", &[json!(game_id.clone()), json!(deployment_id), json!(sandbox_prefix), json!(now), json!(deployment_id)])?,
        db::statement(&database, "UPDATE game_repo_bindings SET last_synced_commit = ?, last_commit_message = ?, last_synced_at = ?, sync_status = 'synced', updated_at = ? WHERE game_id = ?", &[json!(db::string(&deployment, "commit_sha").unwrap_or_default()), json!(db::string(&deployment, "commit_message").unwrap_or_default()), json!(now), json!(now), json!(game_id.clone())])?,
        db::statement(&database, "UPDATE deployment_upload_sessions SET completed_at = ? WHERE id = ? AND completed_at IS NULL AND EXISTS (SELECT 1 FROM deployment_records WHERE id = ? AND status = 'ready')", &[json!(now), json!(db::string(&session, "id").unwrap_or_default()), json!(deployment_id)])?,
    ]).await?;
    if results.len() < 4 || db::changes(&results[0])? != 1 || db::changes(&results[1])? != 1 || db::changes(&results[2])? != 1 || db::changes(&results[3])? != 1 {
        return response::error(request, env, "Deployment completion changed concurrently; retry the upload", 409, "COMPLETION_RACE");
    }
    response::json(request, env, &json!({ "success": true, "deployment_id": deployment_id, "status": "ready", "sandbox_url": format!("/sandbox/{game_id}") }), 200)
}

async fn active_private(game_id: &str, request: &Request, env: &Env) -> Result<Response> {
    let claims = match creator(request, env) { Ok(value) => value, Err(_) => return response::error(request, env, "Authentication required", 401, "UNAUTHORIZED") };
    if !allowed(game_id, &claims, env).await? { return response::error(request, env, "You do not have access to this game", 403, "FORBIDDEN"); }
    let row = db::first(&db::database(env)?, "SELECT id, game_id, deployment_id, expires_at, created_by, created_at FROM private_releases WHERE game_id = ? AND revoked_at IS NULL AND (expires_at IS NULL OR expires_at > ?) ORDER BY created_at DESC LIMIT 1", &[json!(game_id), json!(worker::js_sys::Date::now() as i64)]).await?;
    response::json(request, env, &json!({ "success": true, "active_release": row }), 200)
}

async fn public_release(game_id: &str, request: &mut Request, env: &Env) -> Result<Response> {
    let claims = match creator(request, env) { Ok(value) => value, Err(error) if error.to_string() == "UNAUTHORIZED" => return response::error(request, env, "Authentication required", 401, "UNAUTHORIZED"), Err(_) => return response::error(request, env, "Creator access required", 403, "FORBIDDEN") };
    if !allowed(game_id, &claims, env).await? { return response::error(request, env, "You do not have access to this game", 403, "FORBIDDEN"); }
    let body = request.json::<Value>().await.unwrap_or_else(|_| json!({}));
    let deployment_id = body.get("deployment_id").and_then(Value::as_str).unwrap_or_default();
    if deployment_id.is_empty() { return response::error(request, env, "A deployment_id is required", 400, "MISSING_DEPLOYMENT_ID"); }
    let database = db::database(env)?;
    let game = db::first(&database, "SELECT id, short_name, status FROM games WHERE id = ?", &[json!(game_id)]).await?;
    let Some(game) = game else { return response::error(request, env, "Game not found", 404, "NOT_FOUND"); };
    let game_status = db::string(&game, "status").unwrap_or_default();
    if game_status != "APPROVED" && game_status != "PUBLIC_ACTIVE" { return response::error(request, env, "The game must be approved before public publishing", 409, "PUBLIC_REVIEW_REQUIRED"); }
    let Some(deployment) = db::first(&database, "SELECT id, artifact_prefix, status FROM deployment_records WHERE id = ? AND game_id = ? AND status IN ('ready', 'published') AND artifact_prefix IS NOT NULL", &[json!(deployment_id), json!(game_id)]).await? else { return response::error(request, env, "Only a verified deployment can be published", 409, "DEPLOYMENT_NOT_READY"); };
    if db::first(&database, "SELECT id FROM private_releases WHERE game_id = ? AND deployment_id = ? AND revoked_at IS NULL AND (expires_at IS NULL OR expires_at > ?)", &[json!(game_id), json!(deployment_id), json!(worker::js_sys::Date::now() as i64)]).await?.is_none() { return response::error(request, env, "The selected deployment must have an active private release before public review", 409, "PRIVATE_PUBLISH_REQUIRED"); }
    let now = worker::js_sys::Date::now() as i64;
    let pointer = db::first(&database, "SELECT active_deployment_id, artifact_prefix, version FROM game_release_pointers WHERE game_id = ?", &[json!(game_id)]).await?;
    let mut statements = Vec::new();
    if let Some(pointer) = pointer.as_ref() {
        statements.push(db::statement(&database, "UPDATE game_release_pointers SET previous_active_deployment_id = active_deployment_id, active_deployment_id = ?, artifact_prefix = ?, version = version + 1, updated_at = ? WHERE game_id = ? AND version = ? AND active_deployment_id = ?", &[json!(deployment_id), deployment.get("artifact_prefix").cloned().unwrap_or(Value::Null), json!(now), json!(game_id), pointer.get("version").cloned().unwrap_or(Value::Null), pointer.get("active_deployment_id").cloned().unwrap_or(Value::Null)])?);
    } else {
        statements.push(db::statement(&database, "INSERT INTO game_release_pointers (game_id, active_deployment_id, artifact_prefix, version, updated_at) VALUES (?, ?, ?, 1, ?)", &[json!(game_id), json!(deployment_id), deployment.get("artifact_prefix").cloned().unwrap_or(Value::Null), json!(now)])?);
    }
    statements.push(db::statement(&database, "UPDATE deployment_records SET status = 'published', published_at = COALESCE(published_at, ?), finished_at = ?, live_url = ? WHERE id = ? AND status IN ('ready', 'published') AND EXISTS (SELECT 1 FROM game_release_pointers WHERE game_id = ? AND active_deployment_id = ?)", &[json!(now), json!(now), json!(format!("/{}", game_id)), json!(deployment_id), json!(game_id), json!(deployment_id)])?);
    statements.push(db::statement(&database, "UPDATE games SET status = 'PUBLIC_ACTIVE', updated_at = ? WHERE id = ? AND status IN ('APPROVED', 'PUBLIC_ACTIVE') AND EXISTS (SELECT 1 FROM game_release_pointers WHERE game_id = ? AND active_deployment_id = ?)", &[json!(now), json!(game_id), json!(game_id), json!(deployment_id)])?);
    let results = db::batch(&database, statements).await?;
    if results.first().map(db::changes).transpose()?.unwrap_or_default() != 1 {
        return response::error(request, env, "Public release changed concurrently; retry the publish", 409, "PUBLIC_RELEASE_RACE");
    }
    let published = db::first(&database, "SELECT d.id FROM deployment_records d JOIN game_release_pointers p ON p.active_deployment_id = d.id JOIN games g ON g.id = p.game_id WHERE d.id = ? AND d.status = 'published' AND g.status = 'PUBLIC_ACTIVE'", &[json!(deployment_id)]).await?;
    if published.is_none() { return response::error(request, env, "Public release changed concurrently; retry the publish", 409, "PUBLIC_RELEASE_RACE"); }
    let public_name = db::string(&game, "short_name").unwrap_or_else(|| game_id.to_string());
    response::json(request, env, &json!({ "success": true, "game_id": game_id, "deployment_id": deployment_id, "status": "PUBLIC_ACTIVE", "public_url": format!("/{public_name}") }), 200)
}

async fn create_private(game_id: &str, request: &mut Request, env: &Env) -> Result<Response> {
    let claims = match creator(request, env) { Ok(value) => value, Err(_) => return response::error(request, env, "Authentication required", 401, "UNAUTHORIZED") };
    if !allowed(game_id, &claims, env).await? { return response::error(request, env, "You do not have access to this game", 403, "FORBIDDEN"); }
    let body = request.json::<Value>().await.unwrap_or_else(|_| json!({}));
    let deployment_id = body.get("deployment_id").and_then(Value::as_str).unwrap_or_default();
    let days = match body.get("expires_in_days") {
        Some(Value::Null) => None,
        Some(value) => value.as_i64(),
        None => Some(7),
    };
    if deployment_id.is_empty() { return response::error(request, env, "A deployment_id is required", 400, "MISSING_DEPLOYMENT_ID"); }
    if days.is_some_and(|value| !(1..=30).contains(&value)) || body.get("expires_in_days").is_some_and(|value| !value.is_null() && value.as_i64().is_none()) { return response::error(request, env, "Private release expiry must be between 1 and 30 days or null for no expiry", 400, "INVALID_EXPIRY"); }
    let database = db::database(env)?;
    if db::first(&database, "SELECT id FROM deployment_records WHERE id = ? AND game_id = ? AND status IN ('ready', 'published') AND artifact_prefix IS NOT NULL", &[json!(deployment_id), json!(game_id)]).await?.is_none() { return response::error(request, env, "Only a verified deployment can be privately published", 409, "DEPLOYMENT_NOT_READY"); }
    let now = worker::js_sys::Date::now() as i64;
    if let Some(active) = db::first(&database, "SELECT id FROM private_releases WHERE game_id = ? AND revoked_at IS NULL AND (expires_at IS NULL OR expires_at > ?)", &[json!(game_id), json!(now)]).await? { if body.get("force_replace").and_then(Value::as_bool) != Some(true) { return response::error(request, env, "A private publishing link is already active for this game", 409, "ACTIVE_PRIVATE_RELEASE_EXISTS"); } }
    let token = format!("rs_private_{}", uuid::Uuid::new_v4().simple());
    let release_id = format!("pr_{}", uuid::Uuid::new_v4().simple());
    let expires = days.map(|value| now + value * 24 * 60 * 60 * 1000);
    let force_replace = body.get("force_replace").and_then(Value::as_bool) == Some(true);
    let results = db::batch(&database, vec![
        db::statement(&database, "INSERT INTO private_releases (id, tenant_id, game_id, deployment_id, token_hash, expires_at, created_by, created_at) SELECT ?, tenant_id, ?, id, ?, ?, ?, ? FROM deployment_records WHERE id = ? AND game_id = ? AND status IN ('ready', 'published') AND artifact_prefix IS NOT NULL AND (? = 1 OR NOT EXISTS (SELECT 1 FROM private_releases WHERE game_id = ? AND revoked_at IS NULL AND (expires_at IS NULL OR expires_at > ?)))", &[json!(release_id.clone()), json!(game_id), json!(sha256(&token)), json!(expires), json!(claims.principal_id), json!(now), json!(deployment_id), json!(game_id), json!(if force_replace { 1 } else { 0 }), json!(game_id.clone()), json!(now)])?,
        db::statement(&database, "UPDATE private_releases SET revoked_at = ? WHERE game_id = ? AND id != ? AND revoked_at IS NULL AND ((expires_at IS NOT NULL AND expires_at <= ?) OR ? = 1) AND EXISTS (SELECT 1 FROM private_releases WHERE id = ?)", &[json!(now), json!(game_id.clone()), json!(release_id.clone()), json!(now), json!(if force_replace { 1 } else { 0 }), json!(release_id.clone())])?,
    ]).await?;
    if results.first().map(db::changes).transpose()?.unwrap_or_default() != 1 {
        return response::error(request, env, "The selected deployment or private release state changed; retry publishing", 409, "PRIVATE_RELEASE_RACE");
    }
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

async fn logs(deployment_id: &str, request: &Request, env: &Env) -> Result<Response> {
    let claims = match creator(request, env) { Ok(value) => value, Err(error) if error.to_string() == "UNAUTHORIZED" => return response::error(request, env, "Authentication required", 401, "UNAUTHORIZED"), Err(_) => return response::error(request, env, "Creator access required", 403, "FORBIDDEN") };
    let database = db::database(env)?;
    let Some(deployment) = db::first(&database, "SELECT d.id, d.game_id, d.status, d.error_code, d.error_message, d.created_at, d.started_at, d.uploaded_at, d.published_at, d.finished_at FROM deployment_records d JOIN games g ON g.id = d.game_id WHERE d.id = ? AND (g.creator_principal = ? OR ? = 'admin')", &[json!(deployment_id), json!(claims.principal_id), json!(claims.role)]).await? else { return response::error(request, env, "Deployment not found", 404, "NOT_FOUND"); };
    let events = db::all(&database, "SELECT event_name, payload_sha256, created_at FROM deployment_events WHERE deployment_id = ? ORDER BY created_at ASC", &[json!(deployment_id)]).await?;
    response::json(request, env, &json!({ "success": true, "deployment": deployment, "events": events }), 200)
}

async fn rollback(game_id: &str, request: &mut Request, env: &Env) -> Result<Response> {
    let claims = match creator(request, env) { Ok(value) => value, Err(error) if error.to_string() == "UNAUTHORIZED" => return response::error(request, env, "Authentication required", 401, "UNAUTHORIZED"), Err(_) => return response::error(request, env, "Creator access required", 403, "FORBIDDEN") };
    if !allowed(game_id, &claims, env).await? { return response::error(request, env, "You do not have access to this game", 403, "FORBIDDEN"); }
    let body = request.json::<Value>().await.unwrap_or_else(|_| json!({}));
    let target_id = body.get("deployment_id").and_then(Value::as_str).unwrap_or_default();
    if target_id.is_empty() { return response::error(request, env, "A deployment_id is required", 400, "MISSING_DEPLOYMENT_ID"); }
    let database = db::database(env)?;
    let Some(target) = db::first(&database, "SELECT id, artifact_prefix, status FROM deployment_records WHERE id = ? AND game_id = ? AND status IN ('ready', 'published')", &[json!(target_id), json!(game_id)]).await? else { return response::error(request, env, "Only a verified deployment can be restored", 409, "DEPLOYMENT_NOT_VERIFIED"); };
    let Some(pointer) = db::first(&database, "SELECT active_deployment_id, version FROM game_release_pointers WHERE game_id = ?", &[json!(game_id)]).await? else { return response::error(request, env, "No active release exists", 409, "NO_ACTIVE_RELEASE"); };
    let now = worker::js_sys::Date::now() as i64;
    let results = db::batch(&database, vec![db::statement(&database, "UPDATE game_release_pointers SET previous_active_deployment_id = active_deployment_id, active_deployment_id = ?, artifact_prefix = ?, version = version + 1, updated_at = ? WHERE game_id = ? AND version = ? AND active_deployment_id = ?", &[json!(target_id), target.get("artifact_prefix").cloned().unwrap_or(Value::Null), json!(now), json!(game_id), pointer.get("version").cloned().unwrap_or(Value::Null), pointer.get("active_deployment_id").cloned().unwrap_or(Value::Null)])?]).await?;
    if results.first().map(db::changes).transpose()?.unwrap_or_default() != 1 {
        return response::error(request, env, "Release changed concurrently; retry the rollback", 409, "RELEASE_RACE");
    }
    let active = db::first(&database, "SELECT active_deployment_id FROM game_release_pointers WHERE game_id = ?", &[json!(game_id)]).await?;
    if active.and_then(|row| db::string(&row, "active_deployment_id")) != Some(target_id.to_string()) { return response::error(request, env, "Release changed concurrently; retry the rollback", 409, "RELEASE_RACE"); }
    response::json(request, env, &json!({ "success": true, "game_id": game_id, "deployment_id": target_id, "status": "published" }), 200)
}

fn static_path_allowed(path: &str) -> bool {
    if path.is_empty() || path.len() > 512 || path.starts_with('/') || path.contains('\\') || path.split('/').any(|part| part.is_empty() || part == "." || part == "..") { return false; }
    let extension = path.rsplit('.').next().unwrap_or_default().to_ascii_lowercase();
    !matches!(extension.as_str(), "exe" | "dll" | "so" | "dylib" | "msi" | "sh" | "bash" | "bat" | "cmd" | "ps1" | "php" | "py" | "rb" | "pl" | "cgi" | "toml" | "yaml" | "yml" | "jsonc" | "wrangler")
}

fn static_content_allowed(path: &str, bytes: &[u8]) -> bool {
    if !static_path_allowed(path) { return false; }
    let extension = path.rsplit('.').next().unwrap_or_default().to_ascii_lowercase();
    if matches!(extension.as_str(), "html" | "htm" | "js" | "mjs") {
        let content = String::from_utf8_lossy(bytes).to_ascii_lowercase();
        return !["window.top", "top.location", "parent.location", "window.parent"].iter().any(|pattern| content.contains(pattern));
    }
    true
}

fn hex_to_bytes(value: &str) -> Option<Vec<u8>> {
    if value.len() != 64 || !value.bytes().all(|byte| byte.is_ascii_hexdigit()) { return None; }
    (0..value.len()).step_by(2).map(|index| u8::from_str_radix(&value[index..index + 2], 16).ok()).collect()
}

#[cfg(test)]
mod tests {
    use super::{hex_to_bytes, manifest, static_content_allowed, static_path_allowed};
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

    #[test]
    fn rejects_non_static_and_top_level_escape_content() {
        assert!(!static_path_allowed("server.php"));
        assert!(!static_path_allowed("../index.html"));
        assert!(!static_content_allowed("index.html", b"<script>window.top.location='https://evil.example'</script>"));
        assert!(static_content_allowed("game.js", b"console.log('play')"));
    }
}