use base64::{engine::general_purpose::{STANDARD, URL_SAFE_NO_PAD}, Engine};
use hmac::{Hmac, Mac};
use rsa::{pkcs1::DecodeRsaPrivateKey, pkcs1v15::{Signature as RsaSignature, SigningKey, VerifyingKey}, pkcs8::DecodePrivateKey, signature::{SignatureEncoding, Signer, Verifier}, BigUint, RsaPrivateKey, RsaPublicKey};
use serde::{de::DeserializeOwned, Deserialize};
use serde_json::{json, Value};
use sha2::{Digest, Sha256};
use wasm_bindgen::JsValue;
use worker::{js_sys, Env, Fetch, Headers, Method, Request, RequestInit, Result, Response, Url};

use crate::{auth, db, response};

type HmacSha256 = Hmac<Sha256>;
const GITHUB_API: &str = "https://api.github.com";
const GITHUB_OIDC_ISSUER: &str = "https://token.actions.githubusercontent.com";

#[derive(Debug)]
struct GithubError {
    status: u16,
    message: String,
}

impl GithubError {
    fn new(status: u16, message: impl Into<String>) -> Self {
        Self { status, message: message.into() }
    }
}

#[derive(Debug, Deserialize)]
struct GithubOAuthTokenResponse {
    access_token: Option<String>,
    error: Option<String>,
    error_description: Option<String>,
}

#[derive(Debug, Deserialize)]
struct GithubUserProfile {
    id: i64,
    login: String,
    name: Option<String>,
    avatar_url: Option<String>,
    email: Option<String>,
}

fn github_callback_url(env: &Env) -> String {
    env.var("GITHUB_CALLBACK_URL")
        .map(|value| value.to_string())
        .unwrap_or_else(|_| {
            let main_url = env.var("MAIN_SITE_URL").map(|value| value.to_string()).unwrap_or_default();
            format!("{}/api/github/callback", main_url.trim_end_matches('/'))
        })
}

    fn installation_complete_response(env: &Env, installation_id: i64) -> Result<Response> {
        let target_origin = env
            .var("MAIN_SITE_URL")
            .map(|value| value.to_string())
            .unwrap_or_default()
            .trim_end_matches('/')
            .to_string();
        let target_origin = serde_json::to_string(&target_origin).unwrap_or_else(|_| "\"\"".to_string());
        response::html(&format!(
            r#"<!doctype html>
    <html lang="en">
    <head><meta charset="utf-8"><title>GitHub connected</title></head>
    <body>
    <p>GitHub connected. This window will close automatically.</p>
    <script>
      const targetOrigin = {target_origin};
      const message = {{ type: "randseed:github-installation", installation_id: {installation_id} }};
      if (window.opener) window.opener.postMessage(message, targetOrigin || "*");
      window.close();
    </script>
    </body>
    </html>"#
        ))
    }

pub async fn route(request: &mut Request, env: &Env) -> Result<Option<Response>> {
    let path = request.path();
    match (request.method(), path.as_str()) {
        (Method::Get, "/api/github/install") => Ok(Some(install(request, env).await?)),
        (Method::Get, "/api/github/repositories") => Ok(Some(list_repositories(request, env).await?)),
        (Method::Get, "/api/github/branches") => Ok(Some(list_branches(request, env).await?)),
        (Method::Get, "/api/github/callback") => Ok(Some(callback(request, env).await?)),
        (Method::Post, "/api/github/claim") => Ok(Some(claim_installation(request, env).await?)),
        (Method::Post, "/api/github/webhook") => Ok(Some(webhook(request, env).await?)),
        (Method::Post, "/api/webhooks/github") => Ok(Some(webhook(request, env).await?)),
        (Method::Post, "/api/sandbox/deploy") => Ok(Some(response::error(request, env, "Legacy deployment tokens are disabled; use GitHub Actions OIDC and the deployment upload API", 410, "LEGACY_DEPLOY_DISABLED")?)),
        _ => {
            if let Some(rest) = path.strip_prefix("/api/games/") {
                let mut parts = rest.split('/');
                let game_id = parts.next().unwrap_or_default();
                if parts.next() == Some("repo") {
                    return Ok(Some(match (request.method(), parts.next()) {
                        (Method::Get, None) => get_repo(game_id, request, env).await?,
                        (Method::Post, Some("link")) => link_repo(game_id, request, env).await?,
                        (Method::Post, Some("import-workflow")) => import_workflow(game_id, request, env).await?,
                        (Method::Post, Some("unlink")) => unlink_repo(game_id, request, env).await?,
                        _ => return Ok(None),
                    }));
                }
                if rest.ends_with("/sync-status") && request.method() == Method::Get {
                    return Ok(Some(sync_status(game_id, request, env).await?));
                }
            }
            Ok(None)
        }
    }
}

fn creator(request: &Request, env: &Env) -> Result<auth::Claims> {
    let Some(claims) = auth::user(request, env) else { return Err(worker::Error::from("UNAUTHORIZED")); };
    if !auth::has_role(&claims, "creator") { return Err(worker::Error::from("FORBIDDEN")); }
    Ok(claims)
}

fn github_repo_path(repository: &str) -> String {
    repository.split('/').map(urlencoding::encode).collect::<Vec<_>>().join("/")
}

async fn github_response<T: DeserializeOwned>(
    url: &str,
    token: &str,
    method: Method,
    body: Option<Value>,
) -> std::result::Result<T, GithubError> {
    let mut headers = Headers::new();
    headers.set("Accept", "application/vnd.github+json").map_err(|_| GithubError::new(502, "GitHub request setup failed"))?;
    headers.set("Authorization", &format!("Bearer {token}")).map_err(|_| GithubError::new(502, "GitHub request setup failed"))?;
    headers.set("User-Agent", "RandSeed-Gamecreator-Worker").map_err(|_| GithubError::new(502, "GitHub request setup failed"))?;
    headers.set("X-GitHub-Api-Version", "2022-11-28").map_err(|_| GithubError::new(502, "GitHub request setup failed"))?;
    let body = body.map(|value| JsValue::from_str(&value.to_string()));
    if body.is_some() { headers.set("Content-Type", "application/json").map_err(|_| GithubError::new(502, "GitHub request setup failed"))?; }
    let mut init = RequestInit::new();
    init.with_method(method).with_headers(headers).with_body(body);
    let outbound = Request::new_with_init(url, &init).map_err(|_| GithubError::new(502, "GitHub request setup failed"))?;
    let mut response = Fetch::Request(outbound).send().await.map_err(|_| GithubError::new(502, "GitHub request failed"))?;
    let status = response.status_code();
    if !(200..300).contains(&status) {
        return Err(GithubError::new(status, format!("GitHub API request failed ({status})")));
    }
    response.json().await.map_err(|_| GithubError::new(502, "Invalid GitHub response"))
}

async fn github_user_profile(env: &Env, code: &str) -> std::result::Result<GithubUserProfile, GithubError> {
    let client_id = env.var("GITHUB_CLIENT_ID")
        .map(|value| value.to_string())
        .or_else(|_| env.secret("GITHUB_CLIENT_ID").map(|value| value.to_string()))
        .map_err(|_| GithubError::new(503, "GitHub OAuth credentials are not configured"))?;
    let client_secret = env.secret("GITHUB_CLIENT_SECRET").map(|value| value.to_string()).or_else(|_| env.var("GITHUB_CLIENT_SECRET").map(|value| value.to_string())).map_err(|_| GithubError::new(503, "GitHub OAuth credentials are not configured"))?;

    let mut headers = Headers::new();
    headers.set("Accept", "application/json").map_err(|_| GithubError::new(502, "GitHub OAuth request setup failed"))?;
    headers.set("Content-Type", "application/json").map_err(|_| GithubError::new(502, "GitHub OAuth request setup failed"))?;
    headers.set("User-Agent", "RandSeed-Gamecreator-Worker").map_err(|_| GithubError::new(502, "GitHub OAuth request setup failed"))?;
    let body = JsValue::from_str(&json!({
        "client_id": client_id,
        "client_secret": client_secret,
        "code": code,
        "redirect_uri": github_callback_url(env),
    }).to_string());
    let mut init = RequestInit::new();
    init.with_method(Method::Post).with_headers(headers).with_body(Some(body));
    let outbound = Request::new_with_init("https://github.com/login/oauth/access_token", &init).map_err(|_| GithubError::new(502, "GitHub OAuth request setup failed"))?;
    let mut response = Fetch::Request(outbound).send().await.map_err(|_| GithubError::new(502, "GitHub OAuth token request failed"))?;
    let status = response.status_code();
    let token_response: GithubOAuthTokenResponse = response.json().await.map_err(|_| GithubError::new(502, "Invalid GitHub OAuth response"))?;
    let GithubOAuthTokenResponse { access_token, error, error_description } = token_response;
    let access_token = access_token.filter(|value| !value.trim().is_empty()).ok_or_else(|| {
        GithubError::new(
            if (200..300).contains(&status) { 400 } else { status },
            error_description.or(error).unwrap_or_else(|| "GitHub OAuth authorization failed".to_string()),
        )
    })?;

    let profile: Value = github_response("https://api.github.com/user", &access_token, Method::Get, None).await?;
    serde_json::from_value(profile).map_err(|_| GithubError::new(502, "Invalid GitHub user profile"))
}

async fn github_status(
    url: &str,
    token: &str,
    method: Method,
    body: Option<Value>,
) -> std::result::Result<u16, GithubError> {
    let mut headers = Headers::new();
    headers.set("Accept", "application/vnd.github+json").map_err(|_| GithubError::new(502, "GitHub request setup failed"))?;
    headers.set("Authorization", &format!("Bearer {token}")).map_err(|_| GithubError::new(502, "GitHub request setup failed"))?;
    headers.set("User-Agent", "RandSeed-Gamecreator-Worker").map_err(|_| GithubError::new(502, "GitHub request setup failed"))?;
    headers.set("X-GitHub-Api-Version", "2022-11-28").map_err(|_| GithubError::new(502, "GitHub request setup failed"))?;
    let body = body.map(|value| JsValue::from_str(&value.to_string()));
    if body.is_some() { headers.set("Content-Type", "application/json").map_err(|_| GithubError::new(502, "GitHub request setup failed"))?; }
    let mut init = RequestInit::new();
    init.with_method(method).with_headers(headers).with_body(body);
    let outbound = Request::new_with_init(url, &init).map_err(|_| GithubError::new(502, "GitHub request setup failed"))?;
    let response = Fetch::Request(outbound).send().await.map_err(|_| GithubError::new(502, "GitHub request failed"))?;
    Ok(response.status_code())
}

fn app_jwt(env: &Env) -> std::result::Result<String, GithubError> {
    let app_id = github_app_id(env)?;
    let private_key = env.secret("GITHUB_APP_PRIVATE_KEY").map(|value| value.to_string()).or_else(|_| env.var("GITHUB_APP_PRIVATE_KEY").map(|value| value.to_string())).map_err(|_| GithubError::new(503, "GitHub App credentials are not configured"))?;
    let key_text = private_key.replace("\\n", "\n");
    let key = RsaPrivateKey::from_pkcs8_pem(&key_text).or_else(|_| RsaPrivateKey::from_pkcs1_pem(&key_text)).map_err(|_| GithubError::new(503, "Invalid GitHub App private key"))?;
    let now = js_sys::Date::now() as i64 / 1000;
    let header = URL_SAFE_NO_PAD.encode(br#"{"alg":"RS256","typ":"JWT"}"#);
    let payload = URL_SAFE_NO_PAD.encode(serde_json::to_vec(&json!({ "iat": now - 60, "exp": now + 9 * 60, "iss": app_id })).map_err(|_| GithubError::new(503, "Unable to create GitHub App token"))?);
    let message = format!("{header}.{payload}");
    let signature = SigningKey::<Sha256>::new(key).sign(message.as_bytes());
    Ok(format!("{message}.{}", URL_SAFE_NO_PAD.encode(signature.to_bytes())))
}

fn github_app_id(env: &Env) -> std::result::Result<String, GithubError> {
    env.var("GITHUB_APP_ID")
        .map(|value| value.to_string())
        .or_else(|_| env.secret("GITHUB_APP_ID").map(|value| value.to_string()))
        .map_err(|_| GithubError::new(503, "GitHub App credentials are not configured"))
}

fn verified_installation(installation: &Value, env: &Env) -> std::result::Result<(String, String, Value), GithubError> {
    let expected_app_id = github_app_id(env)?.parse::<i64>().map_err(|_| GithubError::new(503, "Invalid GitHub App ID"))?;
    if installation.get("app_id").and_then(Value::as_i64) != Some(expected_app_id) {
        return Err(GithubError::new(403, "GitHub installation does not belong to this App"));
    }
    let account = installation.pointer("/account/login").and_then(Value::as_str).filter(|value| !value.is_empty()).ok_or_else(|| GithubError::new(502, "GitHub installation has no account"))?;
    let account_type = installation.pointer("/account/type").and_then(Value::as_str).unwrap_or("User");
    let permissions = installation.get("permissions").cloned().unwrap_or_else(|| json!({}));
    Ok((account.to_string(), account_type.to_string(), permissions))
}

async fn installation_token(env: &Env, installation_id: i64) -> std::result::Result<String, GithubError> {
    let token = app_jwt(env)?;
    let value: Value = github_response(&format!("{GITHUB_API}/app/installations/{installation_id}/access_tokens"), &token, Method::Post, None).await?;
    value.get("token").and_then(Value::as_str).map(ToOwned::to_owned).ok_or_else(|| GithubError::new(502, "GitHub did not return an installation token"))
}

async fn installation_info(env: &Env, installation_id: i64) -> std::result::Result<Value, GithubError> {
    let token = app_jwt(env)?;
    github_response(&format!("{GITHUB_API}/app/installations/{installation_id}"), &token, Method::Get, None).await
}

async fn installation_repositories(env: &Env, installation_id: i64) -> std::result::Result<Vec<Value>, GithubError> {
    let token = installation_token(env, installation_id).await?;
    let mut repositories = Vec::new();
    for page in 1..=10 {
        let value: Value = github_response(&format!("{GITHUB_API}/installation/repositories?per_page=100&page={page}"), &token, Method::Get, None).await?;
        let page_repositories = value.get("repositories").and_then(Value::as_array).cloned().unwrap_or_default();
        let page_len = page_repositories.len();
        repositories.extend(page_repositories.into_iter().filter_map(|repository| {
            Some(json!({
                "full_name": repository.get("full_name")?.as_str()?,
                "default_branch": repository.get("default_branch").and_then(Value::as_str).unwrap_or("main"),
                "private": repository.get("private").and_then(Value::as_bool).unwrap_or(false),
            }))
        }));
        if page_len < 100 { break; }
    }
    Ok(repositories)
}

async fn repository_branches(env: &Env, installation_id: i64, repository: &str) -> std::result::Result<Vec<Value>, GithubError> {
    let token = installation_token(env, installation_id).await?;
    let path = github_repo_path(repository);
    let mut branches = Vec::new();
    for page in 1..=10 {
        let value: Value = github_response(&format!("{GITHUB_API}/repos/{path}/branches?per_page=100&page={page}"), &token, Method::Get, None).await?;
        let page_branches = value.as_array().cloned().unwrap_or_default();
        let page_len = page_branches.len();
        branches.extend(page_branches.into_iter().filter_map(|branch| {
            Some(json!({
                "name": branch.get("name")?.as_str()?,
                "protected": branch.get("protected").and_then(Value::as_bool).unwrap_or(false),
            }))
        }));
        if page_len < 100 { break; }
    }
    Ok(branches)
}

async fn repository_info(env: &Env, installation_id: i64, repository: &str, branch: &str) -> std::result::Result<(String, String), GithubError> {
    let token = installation_token(env, installation_id).await?;
    let path = github_repo_path(repository);
    let repo: Value = github_response(&format!("{GITHUB_API}/repos/{path}"), &token, Method::Get, None).await?;
    let full_name = repo.get("full_name").and_then(Value::as_str).ok_or_else(|| GithubError::new(502, "GitHub did not return the repository name"))?.to_string();
    let resolved_branch = if branch.is_empty() { repo.get("default_branch").and_then(Value::as_str).unwrap_or("main") } else { branch };
    let _: Value = github_response(&format!("{GITHUB_API}/repos/{path}/commits/{}", urlencoding::encode(resolved_branch)), &token, Method::Get, None).await?;
    Ok((full_name, resolved_branch.to_string()))
}

async fn create_workflow_pull_request(env: &Env, installation_id: i64, repository: &str, base_branch: &str, workflow_content: &str) -> std::result::Result<Value, GithubError> {
    let token = installation_token(env, installation_id).await?;
    let path = github_repo_path(repository);
    let reference: Value = github_response(&format!("{GITHUB_API}/repos/{path}/git/ref/heads/{}", urlencoding::encode(base_branch)), &token, Method::Get, None).await?;
    let base_sha = reference.pointer("/object/sha").and_then(Value::as_str).ok_or_else(|| GithubError::new(502, "GitHub did not return the base branch commit"))?;
    let workflow_path = ".github/workflows/randseed-deploy.yml";
    let existing_status = github_status(&format!("{GITHUB_API}/repos/{path}/contents/{workflow_path}?ref={}", urlencoding::encode(base_branch)), &token, Method::Get, None).await?;
    if existing_status == 200 { return Err(GithubError::new(409, "The RandSeed workflow already exists in this repository")); }
    if existing_status != 404 { return Err(GithubError::new(existing_status, format!("GitHub workflow check failed ({existing_status})"))); }
    let branch = format!("randseed/add-workflow-{}", uuid::Uuid::new_v4().simple().to_string().chars().take(12).collect::<String>());
    let result = async {
        let _: Value = github_response(&format!("{GITHUB_API}/repos/{path}/git/refs"), &token, Method::Post, Some(json!({ "ref": format!("refs/heads/{branch}"), "sha": base_sha }))).await?;
        let _: Value = github_response(&format!("{GITHUB_API}/repos/{path}/contents/{workflow_path}"), &token, Method::Put, Some(json!({ "message": "Add RandSeed deployment workflow", "content": STANDARD.encode(workflow_content.as_bytes()), "branch": branch }))).await?;
        let pull_request: Value = github_response(&format!("{GITHUB_API}/repos/{path}/pulls"), &token, Method::Post, Some(json!({ "title": "Add RandSeed deployment workflow", "head": branch, "base": base_branch, "body": "This PR adds the RandSeed Creator Action workflow. Review the build directory and permissions before merging." }))).await?;
        Ok(json!({ "number": pull_request.get("number"), "html_url": pull_request.get("html_url"), "branch": branch }))
    }.await;
    if result.is_err() {
        let _ = github_status(&format!("{GITHUB_API}/repos/{path}/git/refs/heads/{}", urlencoding::encode(&branch)), &token, Method::Delete, None).await;
    }
    result
}

async fn dispatch_workflow(env: &Env, installation_id: i64, repository: &str, branch: &str, deployment_id: &str, commit_sha: &str, game_id: &str) -> std::result::Result<(), GithubError> {
    let token = installation_token(env, installation_id).await?;
    let workflow = env.var("GITHUB_ACTION_WORKFLOW").map(|value| value.to_string()).unwrap_or_else(|_| "randseed-deploy.yml".to_string());
    let status = github_status(&format!("{GITHUB_API}/repos/{}/actions/workflows/{}/dispatches", github_repo_path(repository), urlencoding::encode(&workflow)), &token, Method::Post, Some(json!({ "ref": branch, "inputs": { "deployment_id": deployment_id, "commit_sha": commit_sha, "game_id": game_id } }))).await?;
    if !(200..300).contains(&status) { return Err(GithubError::new(status, format!("GitHub workflow dispatch failed ({status})"))); }
    Ok(())
}

pub async fn verify_github_oidc(token: &str, env: &Env, repository: &str, commit_sha: &str, branch: &str, workflow: &str) -> std::result::Result<String, String> {
    let parts: Vec<&str> = token.split('.').collect();
    if parts.len() != 3 { return Err("Invalid OIDC token".to_string()); }
    let header: Value = serde_json::from_slice(&URL_SAFE_NO_PAD.decode(parts[0]).map_err(|_| "Invalid OIDC token")?).map_err(|_| "Invalid OIDC token")?;
    let claims: Value = serde_json::from_slice(&URL_SAFE_NO_PAD.decode(parts[1]).map_err(|_| "Invalid OIDC token")?).map_err(|_| "Invalid OIDC token")?;
    if header.get("alg").and_then(Value::as_str) != Some("RS256") { return Err("Unsupported GitHub OIDC token".to_string()); }
    let key_id = header.get("kid").and_then(Value::as_str).ok_or_else(|| "Unsupported GitHub OIDC token".to_string())?;
    let audience = env.var("GITHUB_OIDC_AUDIENCE").map(|value| value.to_string()).unwrap_or_else(|_| "randseed-gamecreator".to_string());
    let audience_matches = claims.get("aud").and_then(Value::as_str).map(|value| value == audience).unwrap_or_else(|| claims.get("aud").and_then(Value::as_array).map(|values| values.iter().any(|value| value.as_str() == Some(audience.as_str()))).unwrap_or(false));
    let now = js_sys::Date::now() as i64 / 1000;
    let exp = claims.get("exp").and_then(Value::as_i64).unwrap_or_default();
    let nbf = claims.get("nbf").and_then(Value::as_i64).unwrap_or_default();
    if claims.get("iss").and_then(Value::as_str) != Some(GITHUB_OIDC_ISSUER) || !audience_matches { return Err("GitHub OIDC issuer or audience mismatch".to_string()); }
    if exp <= now || (nbf > 0 && nbf > now + 30) { return Err("GitHub OIDC token is expired or not active".to_string()); }
    if claims.get("repository").and_then(Value::as_str) != Some(repository) || claims.get("sha").and_then(Value::as_str) != Some(commit_sha) || claims.get("ref").and_then(Value::as_str) != Some(&format!("refs/heads/{branch}")) { return Err("GitHub OIDC repository or commit mismatch".to_string()); }
    let workflow_suffix = format!("/.github/workflows/{workflow}@refs/heads/{branch}");
    let workflow_matches = claims.get("workflow").and_then(Value::as_str) == Some(workflow) || claims.get("workflow_ref").and_then(Value::as_str).map(|value| value.ends_with(&workflow_suffix)).unwrap_or(false) || claims.get("job_workflow_ref").and_then(Value::as_str).map(|value| value.ends_with(&workflow_suffix)).unwrap_or(false);
    if !workflow_matches { return Err("GitHub OIDC workflow mismatch".to_string()); }
    let run_id = claims.get("run_id").and_then(Value::as_str).map(ToOwned::to_owned).or_else(|| claims.get("run_id").and_then(Value::as_i64).map(|value| value.to_string())).ok_or_else(|| "GitHub OIDC run_id is missing".to_string())?;
    let jwks_url = Url::parse(&format!("{GITHUB_OIDC_ISSUER}/.well-known/jwks")).map_err(|_| "Unable to fetch GitHub OIDC keys".to_string())?;
    let mut jwks = Fetch::Url(jwks_url).send().await.map_err(|_| "Unable to fetch GitHub OIDC keys".to_string())?;
    if !(200..300).contains(&jwks.status_code()) { return Err("Unable to fetch GitHub OIDC keys".to_string()); }
    let jwks: Value = jwks.json().await.map_err(|_| "Unable to fetch GitHub OIDC keys".to_string())?;
    let key = jwks.get("keys").and_then(Value::as_array).and_then(|keys| keys.iter().find(|key| key.get("kid").and_then(Value::as_str) == Some(key_id))).ok_or_else(|| "GitHub OIDC signing key not found".to_string())?;
    let modulus = URL_SAFE_NO_PAD.decode(key.get("n").and_then(Value::as_str).ok_or_else(|| "Invalid GitHub OIDC signing key".to_string())?).map_err(|_| "Invalid GitHub OIDC signing key".to_string())?;
    let exponent = URL_SAFE_NO_PAD.decode(key.get("e").and_then(Value::as_str).ok_or_else(|| "Invalid GitHub OIDC signing key".to_string())?).map_err(|_| "Invalid GitHub OIDC signing key".to_string())?;
    let public_key = RsaPublicKey::new(BigUint::from_bytes_be(&modulus), BigUint::from_bytes_be(&exponent)).map_err(|_| "Invalid GitHub OIDC signing key".to_string())?;
    let verifier = VerifyingKey::<Sha256>::new(public_key);
    let signature = RsaSignature::try_from(URL_SAFE_NO_PAD.decode(parts[2]).map_err(|_| "Invalid OIDC token" )?.as_slice()).map_err(|_| "Invalid OIDC signature".to_string())?;
    verifier.verify(format!("{}.{}", parts[0], parts[1]).as_bytes(), &signature).map_err(|_| "Invalid GitHub OIDC signature".to_string())?;
    Ok(run_id)
}

async fn import_workflow(game_id: &str, request: &mut Request, env: &Env) -> Result<Response> {
    let claims = match creator(request, env) { Ok(value) => value, Err(error) if error.to_string() == "UNAUTHORIZED" => return response::error(request, env, "Authentication required", 401, "UNAUTHORIZED"), Err(_) => return response::error(request, env, "Creator access required", 403, "FORBIDDEN") };
    if !owns_game(game_id, &claims, env).await? { return response::error(request, env, "You do not have access to this game", 403, "FORBIDDEN"); }
    let body = request.json::<Value>().await.unwrap_or_else(|_| json!({}));
    let workflow_content = body.get("workflow_content").and_then(Value::as_str).unwrap_or_default();
    if workflow_content.is_empty() || workflow_content.len() > 100_000 || !workflow_content.contains("name: Deploy to RandSeed Sandbox") || !workflow_content.contains("workflow_dispatch:") || !workflow_content.contains("id-token: write") {
        return response::error(request, env, "Invalid RandSeed workflow content", 400, "INVALID_WORKFLOW");
    }
    let database = db::database(env)?;
    let binding = db::first(&database, "SELECT b.installation_id, b.repo_full_name, b.default_branch FROM game_repo_bindings b JOIN github_installations i ON i.installation_id = b.installation_id WHERE b.game_id = ? AND i.owner_principal = ?", &[json!(game_id), json!(claims.principal_id)]).await?;
    let Some(binding) = binding else { return response::error(request, env, "No GitHub repository is connected to this game", 404, "NOT_FOUND"); };
    let installation_id = binding.get("installation_id").and_then(Value::as_i64).unwrap_or_default();
    let repository = db::string(&binding, "repo_full_name").unwrap_or_default();
    let base_branch = db::string(&binding, "default_branch").unwrap_or_else(|| "main".to_string());
    match create_workflow_pull_request(env, installation_id, &repository, &base_branch, workflow_content).await {
        Ok(pull_request) => response::json(request, env, &json!({ "success": true, "pull_request": pull_request }), 201),
        Err(error) => response::error(request, env, &error.message, error.status, if error.status == 409 { "WORKFLOW_ALREADY_EXISTS" } else { "GITHUB_API_ERROR" }),
    }
}

async fn owns_game(game_id: &str, claims: &auth::Claims, env: &Env) -> Result<bool> {
    Ok(db::first(&db::database(env)?, "SELECT id FROM games WHERE id = ? AND (creator_principal = ? OR ? = 'admin')", &[json!(game_id), json!(claims.principal_id.clone()), json!(claims.role.clone())]).await?.is_some())
}

async fn install(request: &Request, env: &Env) -> Result<Response> {
    let mut claims = match creator(request, env) { Ok(value) => value, Err(error) if error.to_string() == "UNAUTHORIZED" => return response::error(request, env, "Authentication required", 401, "UNAUTHORIZED"), Err(_) => return response::error(request, env, "Creator access required", 403, "FORBIDDEN") };
    let url = request.url()?;
    let Some(game_id) = url.query_pairs().find(|(key, _)| key == "game_id").map(|(_, value)| value.to_string()).filter(|value| !value.trim().is_empty()) else {
        return response::error(request, env, "Missing required 'game_id' parameter", 400, "MISSING_GAME_ID");
    };
    if !owns_game(&game_id, &claims, env).await? {
        return response::error(request, env, "You do not have access to this game", 403, "FORBIDDEN");
    }
    let nonce = uuid::Uuid::new_v4().to_string();
    claims.game_id = Some(game_id.clone());
    claims.purpose = Some("github_bind".to_string());
    claims.nonce = Some(nonce.clone());
    let state = auth::sign(claims.clone(), &auth::secret(env)?, 600)?;
    let now = js_sys::Date::now() as i64;
    db::run(
        &db::database(env)?,
        "INSERT INTO github_oauth_states (nonce, principal_id, game_id, created_at, expires_at) VALUES (?, ?, ?, ?, ?)",
        &[json!(nonce), json!(claims.principal_id), json!(game_id.clone()), json!(now), json!(now + 600_000)],
    ).await?;
    let slug = env.var("GITHUB_APP_SLUG").map(|value| value.to_string()).unwrap_or_else(|_| "RDcreatordev".to_string());
    response::json(request, env, &json!({ "success": true, "app_slug": slug, "install_url": format!("https://github.com/apps/{slug}/installations/new?state={}&game_id={}", urlencoding::encode(&state), urlencoding::encode(&game_id)) }), 200)
}

async fn list_repositories(request: &Request, env: &Env) -> Result<Response> {
    let claims = match creator(request, env) { Ok(value) => value, Err(error) if error.to_string() == "UNAUTHORIZED" => return response::error(request, env, "Authentication required", 401, "UNAUTHORIZED"), Err(_) => return response::error(request, env, "Creator access required", 403, "FORBIDDEN") };
    let url = request.url()?;
    let installation_id = url.query_pairs().find(|(key, _)| key == "installation_id").and_then(|(_, value)| value.parse::<i64>().ok());
    let Some(installation_id) = installation_id.filter(|value| *value > 0) else { return response::error(request, env, "Missing required 'installation_id' parameter", 400, "MISSING_INSTALLATION_ID"); };
    let database = db::database(env)?;
    if db::first(&database, "SELECT installation_id FROM github_installations WHERE installation_id = ? AND owner_principal = ?", &[json!(installation_id), json!(claims.principal_id)]).await?.is_none() {
        return response::error(request, env, "GitHub installation is not owned by the authenticated creator", 403, "FORBIDDEN");
    }
    let repositories = match installation_repositories(env, installation_id).await {
        Ok(value) => value,
        Err(error) => return response::error(request, env, &error.message, error.status, "GITHUB_API_ERROR"),
    };
    response::json(request, env, &json!({ "success": true, "repositories": repositories }), 200)
}

async fn list_branches(request: &Request, env: &Env) -> Result<Response> {
    let claims = match creator(request, env) { Ok(value) => value, Err(error) if error.to_string() == "UNAUTHORIZED" => return response::error(request, env, "Authentication required", 401, "UNAUTHORIZED"), Err(_) => return response::error(request, env, "Creator access required", 403, "FORBIDDEN") };
    let url = request.url()?;
    let installation_id = url.query_pairs().find(|(key, _)| key == "installation_id").and_then(|(_, value)| value.parse::<i64>().ok());
    let repository = url.query_pairs().find(|(key, _)| key == "repository").map(|(_, value)| value.to_string()).unwrap_or_default();
    let Some(installation_id) = installation_id.filter(|value| *value > 0) else { return response::error(request, env, "Missing required 'installation_id' parameter", 400, "MISSING_INSTALLATION_ID"); };
    if repository.split('/').count() != 2 || repository.split('/').any(|part| part.is_empty()) || repository.contains(char::is_whitespace) {
        return response::error(request, env, "Invalid repository", 400, "INVALID_REPOSITORY");
    }
    let database = db::database(env)?;
    if db::first(&database, "SELECT installation_id FROM github_installations WHERE installation_id = ? AND owner_principal = ?", &[json!(installation_id), json!(claims.principal_id)]).await?.is_none() {
        return response::error(request, env, "GitHub installation is not owned by the authenticated creator", 403, "FORBIDDEN");
    }
    let branches = match repository_branches(env, installation_id, &repository).await {
        Ok(value) => value,
        Err(error) => return response::error(request, env, &error.message, error.status, "GITHUB_API_ERROR"),
    };
    response::json(request, env, &json!({ "success": true, "branches": branches }), 200)
}

async fn callback(request: &Request, env: &Env) -> Result<Response> {
    let url = request.url()?;
    let callback_error = url.query_pairs().find(|(key, _)| key == "error").map(|(_, value)| value.to_string());
    let error_description = url.query_pairs().find(|(key, _)| key == "error_description").map(|(_, value)| value.to_string());
    if let Some(error) = callback_error {
        return response::error(request, env, &format!("GitHub authorization failed: {}", error_description.unwrap_or(error)), 400, "GITHUB_OAUTH_DENIED");
    }
    let installation_id = url.query_pairs().find(|(key, _)| key == "installation_id").and_then(|(_, value)| value.parse::<i64>().ok());
    let state = url.query_pairs().find(|(key, _)| key == "state").map(|(_, value)| value.to_string()).filter(|value| !value.is_empty());
    let code = url.query_pairs().find(|(key, _)| key == "code").map(|(_, value)| value.to_string()).filter(|value| !value.is_empty());

    let Some(installation_id) = installation_id.filter(|value| *value > 0) else {
        return response::error(request, env, "Missing installation_id in callback", 400, "MISSING_PARAM");
    };

    if state.is_none() {
        let installation = match installation_info(env, installation_id).await {
            Ok(value) => value,
            Err(error) => return response::error(request, env, &error.message, error.status, "GITHUB_API_ERROR"),
        };
        if let Err(error) = verified_installation(&installation, env) {
            return response::error(request, env, &error.message, error.status, "GITHUB_API_ERROR");
        }
        if let Err(error) = installation_repositories(env, installation_id).await {
            return response::error(request, env, &error.message, error.status, "GITHUB_API_ERROR");
        }
        return installation_complete_response(env, installation_id);
    }

    let Some(claims) = auth::secret(env).ok().and_then(|secret| auth::verify(state.as_deref().unwrap_or_default(), &secret)) else {
        return response::error(request, env, "Invalid or expired installation state", 400, "INVALID_STATE");
    };

    if !auth::has_role(&claims, "creator") {
        return response::error(request, env, "Creator access required", 403, "FORBIDDEN");
    }

    let Some(nonce) = claims.nonce.as_deref().filter(|value| !value.is_empty()) else {
        return response::error(request, env, "Invalid GitHub installation state", 400, "INVALID_STATE");
    };
    if claims.purpose.as_deref() != Some("github_bind") {
        return response::error(request, env, "Invalid GitHub installation state", 400, "INVALID_STATE");
    }
    let now = js_sys::Date::now() as i64;
    let database = db::database(env)?;
    if db::first(
        &database,
        "SELECT nonce FROM github_oauth_states WHERE nonce = ? AND principal_id = ? AND (? = game_id OR (? IS NULL AND game_id IS NULL)) AND used_at IS NULL AND expires_at > ?",
        &[json!(nonce), json!(claims.principal_id.clone()), json!(claims.game_id.clone()), json!(claims.game_id.clone()), json!(now)],
    ).await?.is_none() {
        return response::error(request, env, "GitHub installation state is expired or already used", 400, "INVALID_STATE");
    }

    let github_user = match code.as_deref() {
        Some(code) => match github_user_profile(env, code).await {
            Ok(profile) => Some(profile),
            Err(error) => return response::error(request, env, &error.message, error.status, "GITHUB_OAUTH_ERROR"),
        },
        None => None,
    };

    let installation = match installation_info(env, installation_id).await {
        Ok(value) => value,
        Err(error) => return response::error(request, env, &error.message, error.status, "GITHUB_API_ERROR"),
    };
    let (account, account_type, permissions) = match verified_installation(&installation, env) {
        Ok(value) => value,
        Err(error) => return response::error(request, env, &error.message, error.status, "GITHUB_API_ERROR"),
    };
    if db::run_changes(
        &database,
        "UPDATE github_oauth_states SET used_at = ? WHERE nonce = ? AND principal_id = ? AND (? = game_id OR (? IS NULL AND game_id IS NULL)) AND used_at IS NULL AND expires_at > ?",
        &[json!(now), json!(nonce), json!(claims.principal_id.clone()), json!(claims.game_id.clone()), json!(claims.game_id.clone()), json!(now)],
    ).await? != 1 {
        return response::error(request, env, "GitHub installation state is expired or already used", 400, "INVALID_STATE");
    }
    db::run(
        &database,
        "INSERT INTO github_installations (id, installation_id, account_login, account_type, owner_principal, permissions, github_user_id, github_user_login, github_user_name, github_user_avatar_url, github_user_email, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(installation_id) DO UPDATE SET account_login = excluded.account_login, account_type = excluded.account_type, permissions = excluded.permissions, owner_principal = excluded.owner_principal, github_user_id = COALESCE(excluded.github_user_id, github_installations.github_user_id), github_user_login = COALESCE(excluded.github_user_login, github_installations.github_user_login), github_user_name = COALESCE(excluded.github_user_name, github_installations.github_user_name), github_user_avatar_url = COALESCE(excluded.github_user_avatar_url, github_installations.github_user_avatar_url), github_user_email = COALESCE(excluded.github_user_email, github_installations.github_user_email), updated_at = excluded.updated_at",
        &[
            json!(format!("gh_inst_{installation_id}")),
            json!(installation_id),
            json!(account),
            json!(account_type),
            json!(claims.principal_id),
            json!(permissions.to_string()),
            json!(github_user.as_ref().map(|profile| profile.id)),
            json!(github_user.as_ref().map(|profile| profile.login.clone())),
            json!(github_user.as_ref().and_then(|profile| profile.name.clone())),
            json!(github_user.as_ref().and_then(|profile| profile.avatar_url.clone())),
            json!(github_user.as_ref().and_then(|profile| profile.email.clone())),
            json!(now),
            json!(now),
        ],
    ).await?;

    installation_complete_response(env, installation_id)
}

async fn claim_installation(request: &mut Request, env: &Env) -> Result<Response> {
    let claims = match creator(request, env) { Ok(value) => value, Err(error) if error.to_string() == "UNAUTHORIZED" => return response::error(request, env, "Authentication required", 401, "UNAUTHORIZED"), Err(_) => return response::error(request, env, "Creator access required", 403, "FORBIDDEN") };
    let body = request.json::<Value>().await.unwrap_or_else(|_| json!({}));
    let installation_id = body.get("installation_id").and_then(Value::as_i64).filter(|value| *value > 0);
    let game_id = body.get("game_id").and_then(Value::as_str).map(str::to_owned).filter(|value| !value.trim().is_empty());
    let Some(installation_id) = installation_id else { return response::error(request, env, "Missing required 'installation_id' parameter", 400, "MISSING_INSTALLATION_ID"); };
    let Some(game_id) = game_id else { return response::error(request, env, "Missing required 'game_id' parameter", 400, "MISSING_GAME_ID"); };
    if !owns_game(&game_id, &claims, env).await? { return response::error(request, env, "You do not have access to this game", 403, "FORBIDDEN"); }
    let installation = match installation_info(env, installation_id).await {
        Ok(value) => value,
        Err(error) => return response::error(request, env, &error.message, error.status, "GITHUB_API_ERROR"),
    };
    let (account, account_type, permissions) = match verified_installation(&installation, env) {
        Ok(value) => value,
        Err(error) => return response::error(request, env, &error.message, error.status, "GITHUB_API_ERROR"),
    };
    let database = db::database(env)?;
    if let Some(existing) = db::first(&database, "SELECT owner_principal FROM github_installations WHERE installation_id = ?", &[json!(installation_id)]).await? {
        if db::string(&existing, "owner_principal").as_deref() != Some(claims.principal_id.as_str()) {
            return response::error(request, env, "GitHub installation is already claimed by another creator", 409, "INSTALLATION_CLAIMED");
        }
    }
    let now = js_sys::Date::now() as i64;
    db::run(
        &database,
        "INSERT INTO github_installations (id, installation_id, account_login, account_type, owner_principal, permissions, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(installation_id) DO UPDATE SET account_login = excluded.account_login, account_type = excluded.account_type, permissions = excluded.permissions, owner_principal = excluded.owner_principal, updated_at = excluded.updated_at",
        &[json!(format!("gh_inst_{installation_id}")), json!(installation_id), json!(account), json!(account_type), json!(claims.principal_id), json!(permissions.to_string()), json!(now), json!(now)],
    ).await?;
    response::json(request, env, &json!({ "success": true, "installation_id": installation_id }), 200)
}

async fn get_repo(game_id: &str, request: &Request, env: &Env) -> Result<Response> {
    let claims = match creator(request, env) { Ok(value) => value, Err(error) if error.to_string() == "UNAUTHORIZED" => return response::error(request, env, "Authentication required", 401, "UNAUTHORIZED"), Err(_) => return response::error(request, env, "Creator access required", 403, "FORBIDDEN") };
    if !owns_game(game_id, &claims, env).await? { return response::error(request, env, "You do not have access to this game", 403, "FORBIDDEN"); }
    let binding = db::first(&db::database(env)?, "SELECT * FROM game_repo_bindings WHERE game_id = ?", &[json!(game_id)]).await?;
    let Some(binding) = binding else { return response::error(request, env, "No GitHub repository is connected to this game", 404, "NOT_FOUND"); };
    response::json(request, env, &json!({ "success": true, "repo_info": { "repository": db::string(&binding, "repo_full_name"), "branch": db::string(&binding, "default_branch"), "lastCommitSha": db::string(&binding, "last_synced_commit").unwrap_or_default(), "lastCommitMessage": db::string(&binding, "last_commit_message").unwrap_or_else(|| "No successful deployment yet".to_string()), "lastSyncedAt": binding.get("last_synced_at"), "isSynced": db::string(&binding, "sync_status").as_deref() == Some("synced"), "syncMethod": db::string(&binding, "sync_method"), "sandboxUrl": db::string(&binding, "sandbox_url") } }), 200)
}

async fn link_repo(game_id: &str, request: &mut Request, env: &Env) -> Result<Response> {
    let claims = match creator(request, env) { Ok(value) => value, Err(error) if error.to_string() == "UNAUTHORIZED" => return response::error(request, env, "Authentication required", 401, "UNAUTHORIZED"), Err(_) => return response::error(request, env, "Creator access required", 403, "FORBIDDEN") };
    if !owns_game(game_id, &claims, env).await? { return response::error(request, env, "You do not have access to this game", 403, "FORBIDDEN"); }
    let body = request.json::<Value>().await.unwrap_or_else(|_| json!({}));
    let repository = body.get("repository").and_then(Value::as_str).unwrap_or_default().trim().to_string();
    let branch = body.get("branch").and_then(Value::as_str).unwrap_or("main").trim().to_string();
    let installation = body.get("installation_id").and_then(Value::as_i64);
    let build_dir = body.get("build_dir").and_then(Value::as_str).unwrap_or("dist").trim().trim_matches('/').to_string();
    if repository.split('/').count() != 2 || repository.split('/').any(|part| part.is_empty()) || repository.contains(char::is_whitespace) || branch.is_empty() || !branch.bytes().all(|byte| byte.is_ascii_alphanumeric() || matches!(byte, b'.' | b'_' | b'/' | b'-')) || build_dir.is_empty() || build_dir.len() > 128 || build_dir.contains('\\') || build_dir.starts_with('/') || build_dir.split('/').any(|part| part.is_empty() || part == "." || part == "..") { return response::error(request, env, "Repository, branch, or build directory is invalid", 400, "INVALID_REPOSITORY"); }
    let Some(installation) = installation.filter(|value| *value > 0) else { return response::error(request, env, "Missing required 'installation_id' parameter", 400, "MISSING_INSTALLATION_ID"); };
    let database = db::database(env)?;
    if db::first(&database, "SELECT installation_id FROM github_installations WHERE installation_id = ? AND owner_principal = ?", &[json!(installation), json!(claims.principal_id.clone())]).await?.is_none() { return response::error(request, env, "GitHub installation is not owned by the authenticated creator", 403, "FORBIDDEN"); }
    let (repository, branch) = match repository_info(env, installation, &repository, &branch).await {
        Ok(value) => value,
        Err(error) => return response::error(request, env, &error.message, 502, "GITHUB_API_ERROR"),
    };
    let existing_binding = db::first(&database, "SELECT installation_id, repo_full_name FROM game_repo_bindings WHERE game_id = ?", &[json!(game_id)]).await?;
    if let Some(existing_binding) = existing_binding {
        let existing_installation = existing_binding.get("installation_id").and_then(Value::as_i64);
        let same_repository = db::string(&existing_binding, "repo_full_name")
            .map(|value| value.eq_ignore_ascii_case(&repository))
            .unwrap_or(false);
        if existing_installation != Some(installation) || !same_repository {
            return response::error(request, env, "This game is already locked to a different GitHub repository", 409, "REPOSITORY_LOCKED");
        }
    }
    let now = js_sys::Date::now() as i64;
    db::run(&database, "INSERT INTO game_repo_bindings (game_id, installation_id, repo_full_name, default_branch, sync_token_hash, sync_method, sync_status, sandbox_url, build_dir, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 'github_action', 'outdated', ?, ?, ?, ?) ON CONFLICT(game_id) DO UPDATE SET installation_id = excluded.installation_id, repo_full_name = excluded.repo_full_name, default_branch = excluded.default_branch, sync_token_hash = excluded.sync_token_hash, sync_method = excluded.sync_method, sync_status = excluded.sync_status, sandbox_url = excluded.sandbox_url, build_dir = excluded.build_dir, updated_at = excluded.updated_at", &[json!(game_id), json!(installation), json!(repository.clone()), json!(branch.clone()), json!(format!("oidc-only:{game_id}:{now}")), json!(format!("/sandbox/{game_id}")), json!(build_dir), json!(now)]).await?;
    response::json(request, env, &json!({ "success": true, "message": "Repository successfully linked!", "binding": { "game_id": game_id, "repository": repository, "branch": branch, "sandbox_url": format!("/sandbox/{game_id}"), "deployment_auth": "github_actions_oidc" } }), 200)
}

async fn unlink_repo(game_id: &str, request: &Request, env: &Env) -> Result<Response> {
    let claims = match creator(request, env) { Ok(value) => value, Err(error) if error.to_string() == "UNAUTHORIZED" => return response::error(request, env, "Authentication required", 401, "UNAUTHORIZED"), Err(_) => return response::error(request, env, "Creator access required", 403, "FORBIDDEN") };
    if !owns_game(game_id, &claims, env).await? { return response::error(request, env, "You do not have access to this game", 403, "FORBIDDEN"); }
    let database = db::database(env)?;
    db::run(&database, "DELETE FROM game_repo_bindings WHERE game_id = ?", &[json!(game_id)]).await?;
    response::json(request, env, &json!({ "success": true, "message": format!("Repository unlinked from game {game_id}") }), 200)
}

async fn sync_status(game_id: &str, request: &Request, env: &Env) -> Result<Response> {
    let claims = match creator(request, env) { Ok(value) => value, Err(error) if error.to_string() == "UNAUTHORIZED" => return response::error(request, env, "Authentication required", 401, "UNAUTHORIZED"), Err(_) => return response::error(request, env, "Creator access required", 403, "FORBIDDEN") };
    if !owns_game(game_id, &claims, env).await? { return response::error(request, env, "You do not have access to this game", 403, "FORBIDDEN"); }
    let database = db::database(env)?;
    let published = db::first(&database, "SELECT d.* FROM deployment_records d JOIN game_release_pointers p ON p.active_deployment_id = d.id WHERE p.game_id = ? AND d.status = 'published'", &[json!(game_id)]).await?;
    let latest = db::first(&database, "SELECT id, commit_sha, commit_message, status, created_at FROM deployment_records WHERE game_id = ? ORDER BY created_at DESC LIMIT 1", &[json!(game_id)]).await?;
    let source = published.as_ref().or(latest.as_ref());
    response::json(request, env, &json!({ "success": true, "game_id": game_id, "is_synced": published.is_some(), "deployment_id": source.and_then(|row| db::string(row, "id")), "status": source.and_then(|row| db::string(row, "status")).unwrap_or_else(|| "not_deployed".to_string()), "last_synced_at": source.and_then(|row| row.get("published_at")), "latest_commit": source.and_then(|row| db::string(row, "commit_sha")), "commit_message": source.and_then(|row| db::string(row, "commit_message")), "sandbox_url": format!("/sandbox/{game_id}"), "message": if published.is_some() { "GitHub & RandSeed Sandbox are currently in sync" } else { "No published deployment" } }), 200)
}

async fn webhook(request: &mut Request, env: &Env) -> Result<Response> {
    let raw = request.text().await?;
    let signature = request.headers().get("X-Hub-Signature-256").ok().flatten().unwrap_or_default();
    let secret = env.secret("GITHUB_WEBHOOK_SECRET").map(|value| value.to_string()).or_else(|_| env.var("GITHUB_WEBHOOK_SECRET").map(|value| value.to_string())).unwrap_or_default();
    let mut mac = HmacSha256::new_from_slice(secret.as_bytes()).map_err(|_| worker::Error::from("invalid webhook secret"))?;
    mac.update(raw.as_bytes());
    let expected = format!("sha256={}", hex::encode(mac.finalize().into_bytes()));
    if secret.is_empty() || signature != expected { return response::error(request, env, "Invalid webhook signature", 401, "INVALID_SIGNATURE"); }
    let payload: Value = serde_json::from_str(&raw).map_err(|_| worker::Error::from("invalid JSON payload"))?;
    let event = request.headers().get("X-GitHub-Event").ok().flatten().unwrap_or_else(|| "ping".to_string());
    let delivery = request.headers().get("X-GitHub-Delivery").ok().flatten().unwrap_or_else(|| format!("synthetic_{}", uuid::Uuid::new_v4()));
    let database = db::database(env)?;
    if let Some(previous) = db::first(&database, "SELECT deployment_id FROM deployment_events WHERE delivery_id = ?", &[json!(delivery.clone())]).await? { return response::json(request, env, &json!({ "received": true, "event": event, "duplicate": true, "deployment_id": previous.get("deployment_id") }), 200); }
    let deployment_id = if event == "push" {
        let deployment_id = create_pending(&database, &payload, &delivery).await?;
        if let Some(deployment_id) = deployment_id.as_deref() {
            let deployment = db::first(&database, "SELECT * FROM deployment_records WHERE id = ?", &[json!(deployment_id)]).await?;
            if let Some(deployment) = deployment {
                let installation_id = db::integer(&deployment, "installation_id");
                let dispatch = dispatch_workflow(env, installation_id, &db::string(&deployment, "repository").unwrap_or_default(), &db::string(&deployment, "branch").unwrap_or_default(), deployment_id, &db::string(&deployment, "commit_sha").unwrap_or_default(), &db::string(&deployment, "game_id").unwrap_or_default()).await;
                match dispatch {
                    Ok(()) => { db::run(&database, "UPDATE deployment_records SET status = 'queued' WHERE id = ? AND status = 'pending'", &[json!(deployment_id)]).await?; }
                    Err(_error) => { db::run(&database, "UPDATE deployment_records SET status = 'failed', error_code = 'WORKFLOW_DISPATCH_FAILED', error_message = 'GitHub workflow dispatch failed', finished_at = ? WHERE id = ? AND status = 'pending'", &[json!(js_sys::Date::now() as i64), json!(deployment_id)]).await?; }
                }
            }
        }
        deployment_id
    } else if event == "workflow_job" || event == "workflow_run" {
        advance_workflow(&database, &payload, &event).await?
    } else { None };
    db::run(&database, "INSERT INTO deployment_events (delivery_id, deployment_id, event_name, payload_sha256, created_at) VALUES (?, ?, ?, ?, ?)", &[json!(delivery), json!(deployment_id), json!(event.clone()), json!(format!("{}", hex::encode(Sha256::digest(raw.as_bytes())))), json!(js_sys::Date::now() as i64)]).await?;
    response::json(request, env, &json!({ "received": true, "event": event, "deployment_id": deployment_id, "status": if deployment_id.is_some() { "pending" } else { "ignored" } }), if deployment_id.is_some() { 202 } else { 200 })
}

async fn create_pending(database: &worker::d1::D1Database, payload: &Value, delivery: &str) -> Result<Option<String>> {
    let repository = payload.pointer("/repository/full_name").and_then(Value::as_str).unwrap_or_default();
    let branch = payload.get("ref").and_then(Value::as_str).unwrap_or_default().strip_prefix("refs/heads/").unwrap_or_default();
    let sha = payload.pointer("/head_commit/id").and_then(Value::as_str).or_else(|| payload.get("after").and_then(Value::as_str)).unwrap_or_default();
    if repository.is_empty() || branch.is_empty() || sha.len() != 40 { return Ok(None); }
    let binding = db::first(database, "SELECT b.*, i.owner_principal FROM game_repo_bindings b JOIN github_installations i ON i.installation_id = b.installation_id WHERE b.repo_full_name = ? AND b.default_branch = ?", &[json!(repository), json!(branch)]).await?;
    let Some(binding) = binding else { return Ok(None); };
    let game_id = db::string(&binding, "game_id").unwrap_or_default();
    if let Some(row) = db::first(database, "SELECT id FROM deployment_records WHERE game_id = ? AND commit_sha = ?", &[json!(game_id.clone()), json!(sha)]).await? { return Ok(db::string(&row, "id")); }
    let id = format!("dep_{}", uuid::Uuid::new_v4().simple());
    let now = js_sys::Date::now() as i64;
    db::run(database, "UPDATE deployment_records SET status = 'superseded', error_code = 'NEWER_COMMIT', finished_at = ? WHERE game_id = ? AND status IN ('pending', 'queued', 'building', 'build_succeeded', 'uploading')", &[json!(now), json!(game_id.clone())]).await?;
    db::run(database, "INSERT INTO deployment_records (id, tenant_id, game_id, repository, installation_id, branch, build_dir, commit_sha, commit_message, github_delivery_id, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)", &[json!(id.clone()), json!(db::string(&binding, "owner_principal").unwrap_or_default()), json!(game_id), json!(repository), binding.get("installation_id").cloned().unwrap_or(Value::Null), json!(branch), json!(db::string(&binding, "build_dir").unwrap_or_else(|| "dist".to_string())), json!(sha), payload.pointer("/head_commit/message").cloned().unwrap_or(Value::Null), json!(delivery), json!(now)]).await?;
    Ok(Some(id))
}

async fn advance_workflow(database: &worker::d1::D1Database, payload: &Value, event: &str) -> Result<Option<String>> {
    let workflow = payload.get(if event == "workflow_job" { "workflow_job" } else { "workflow_run" }).unwrap_or(&Value::Null);
    let repository = payload.pointer("/repository/full_name").and_then(Value::as_str).unwrap_or_default();
    let commit_sha = workflow.get("head_sha").and_then(Value::as_str).unwrap_or_default();
    if repository.is_empty() || commit_sha.is_empty() { return Ok(None); }
    let run_id = workflow.get("run_id").or_else(|| workflow.get("id")).and_then(Value::as_i64).map(|value| value.to_string()).unwrap_or_default();
    let deployment = db::first(database, "SELECT * FROM deployment_records WHERE repository = ? AND commit_sha = ? AND (? = '' OR github_run_id = ? OR github_run_id IS NULL) ORDER BY created_at DESC LIMIT 1", &[json!(repository), json!(commit_sha), json!(run_id.clone()), json!(run_id.clone())]).await?;
    let Some(deployment) = deployment else { return Ok(None); };
    if let Some(existing_run_id) = db::string(&deployment, "github_run_id") { if !run_id.is_empty() && existing_run_id != run_id { return Ok(None); } }
    let action = workflow.get("status").and_then(Value::as_str).or_else(|| payload.get("action").and_then(Value::as_str));
    let conclusion = workflow.get("conclusion").and_then(Value::as_str);
    let status = if event == "workflow_run" && conclusion == Some("success") { Some("build_succeeded") } else if let Some(conclusion) = conclusion.filter(|value| *value != "success") { Some(if conclusion == "cancelled" { "cancelled" } else { "failed" }) } else if matches!(action, Some("queued") | Some("in_progress")) { Some("building") } else { None };
    let attempt = workflow.get("run_attempt").and_then(Value::as_i64);
    let current_status = db::string(&deployment, "status").unwrap_or_else(|| "pending".to_string());
    if let Some(next_status) = status.as_deref() { if !transition_allowed(&current_status, next_status) { return Ok(Some(db::string(&deployment, "id").unwrap_or_default())); } }
    let next_status = status.map(ToOwned::to_owned).unwrap_or_else(|| current_status.clone());
    db::run(database, "UPDATE deployment_records SET status = ?, started_at = COALESCE(started_at, ?), github_run_id = COALESCE(NULLIF(?, ''), github_run_id), workflow_run_attempt = COALESCE(?, workflow_run_attempt) WHERE id = ? AND status = ?", &[json!(next_status), json!(js_sys::Date::now() as i64), json!(run_id), json!(attempt), deployment.get("id").cloned().unwrap_or(Value::Null), json!(current_status)]).await?;
    Ok(db::string(&deployment, "id"))
}

fn transition_allowed(current: &str, next: &str) -> bool {
    if current == next { return true; }
    match current {
        "pending" => matches!(next, "queued" | "failed" | "cancelled" | "superseded"),
        "queued" => matches!(next, "building" | "build_succeeded" | "failed" | "cancelled" | "superseded"),
        "building" => matches!(next, "build_succeeded" | "failed" | "cancelled" | "superseded"),
        "build_succeeded" => matches!(next, "uploading" | "failed" | "cancelled" | "superseded"),
        "uploading" => matches!(next, "verifying" | "failed" | "cancelled" | "superseded"),
        "verifying" => matches!(next, "ready" | "failed" | "cancelled" | "superseded"),
        "ready" => matches!(next, "publishing" | "failed" | "cancelled" | "superseded"),
        "publishing" => matches!(next, "published" | "failed" | "cancelled" | "superseded"),
        _ => false,
    }
}