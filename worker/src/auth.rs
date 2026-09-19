use base64::{engine::general_purpose::URL_SAFE_NO_PAD, Engine};
use candid::{CandidType, Decode, Encode};
use hmac::{Hmac, Mac};
use ic_agent::{export::Principal, Agent};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use sha2::Sha256;
use worker::{js_sys, Env, Method, Request, Result, Response};

use crate::{db, response};

type HmacSha256 = Hmac<Sha256>;

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Claims {
    pub principal_id: String,
    pub role: String,
    #[serde(default)]
    pub roles: Vec<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub game_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub email: Option<String>,
    #[serde(default)]
    pub is_email_verified: bool,
    pub iat: i64,
    pub exp: i64,
}

pub fn secret(env: &Env) -> Result<String> {
    env.secret("JWT_SECRET")
        .map(|value| value.to_string())
        .or_else(|_| env.var("JWT_SECRET").map(|value| value.to_string()))
}

pub fn sign(mut claims: Claims, secret: &str, ttl_seconds: i64) -> Result<String> {
    let now = js_sys::Date::now() as i64 / 1000;
    claims.iat = now;
    claims.exp = now + ttl_seconds;
    let header = URL_SAFE_NO_PAD.encode(br#"{"alg":"HS256","typ":"JWT"}"#);
    let payload = URL_SAFE_NO_PAD.encode(serde_json::to_vec(&claims)?);
    let message = format!("{header}.{payload}");
    let mut mac = HmacSha256::new_from_slice(secret.as_bytes()).map_err(|_| worker::Error::from("invalid JWT secret"))?;
    mac.update(message.as_bytes());
    Ok(format!("{message}.{}", URL_SAFE_NO_PAD.encode(mac.finalize().into_bytes())))
}

pub fn verify(token: &str, secret: &str) -> Option<Claims> {
    let mut parts = token.split('.');
    let header = parts.next()?;
    let payload = parts.next()?;
    let signature = URL_SAFE_NO_PAD.decode(parts.next()?).ok()?;
    let message = format!("{header}.{payload}");
    let mut mac = HmacSha256::new_from_slice(secret.as_bytes()).ok()?;
    mac.update(message.as_bytes());
    mac.verify_slice(&signature).ok()?;
    let claims: Claims = serde_json::from_slice(&URL_SAFE_NO_PAD.decode(payload).ok()?).ok()?;
    let now = js_sys::Date::now() as i64 / 1000;
    (claims.exp > now && !claims.principal_id.trim().is_empty()).then_some(claims)
}

pub fn roles(role: &str, configured: &[String]) -> Vec<String> {
    let mut result: Vec<String> = configured
        .iter()
        .filter(|item| matches!(item.as_str(), "player" | "creator" | "admin"))
        .cloned()
        .collect();
    if !result.iter().any(|item| item == role) {
        result.push(role.to_string());
    }
    result.sort();
    result.dedup();
    result
}

pub fn user(request: &Request, env: &Env) -> Option<Claims> {
    let header = request.headers().get("Authorization").ok().flatten()?;
    let token = header.strip_prefix("Bearer ")?.trim();
    verify(token, &secret(env).ok()?)
}

pub fn has_role(claims: &Claims, required: &str) -> bool {
    claims.roles.iter().any(|role| role == "admin" || role == required || (role == "creator" && required == "player"))
        || claims.role == "admin"
        || claims.role == required
}

fn role_from_row(row: &Value) -> (String, Vec<String>) {
    let role = db::string(row, "role").unwrap_or_else(|| "player".to_string());
    let configured = db::string(row, "roles")
        .and_then(|raw| serde_json::from_str::<Vec<String>>(&raw).ok())
        .unwrap_or_default();
    (role.clone(), roles(&role, &configured))
}

pub async fn route(request: &mut Request, env: &Env) -> Result<Option<Response>> {
    let path = request.path();
    match (request.method(), path.as_str()) {
        (Method::Get, "/api/auth/me") => Ok(Some(me(request, env).await?)),
        (Method::Post, "/api/auth/become-creator") => Ok(Some(become_creator(request, env).await?)),
        (Method::Post, "/api/auth/sso") | (Method::Post, "/verifyRandseedSSO") => Ok(Some(sso(request, env).await?)),
        (Method::Put, "/api/auth/profile") => Ok(Some(update_profile(request, env).await?)),
        _ => Ok(None),
    }
}

#[derive(Clone, Debug, CandidType, Deserialize)]
struct SsoAuthorizationCode {
    code: String,
    principal_id: String,
    email: Option<String>,
    is_email_verified: bool,
    audience: String,
    redirect_uri: String,
    expires_at_ms: i128,
    code_challenge: String,
}

#[derive(Clone, Debug, CandidType, Deserialize)]
struct UserProfile {
    ic_account_id: String,
    principal_id: String,
    user_name: String,
    logo: String,
    bio: Option<String>,
    country: Option<String>,
    registration_time: Option<i128>,
    last_play_time: Option<i128>,
    last_login_time: Option<i128>,
    risk_level: Option<u64>,
    achievements: Vec<String>,
    withdrawal_addresses: Vec<String>,
    user_sub_account: Vec<String>,
    email: Option<String>,
    badges: Vec<String>,
}

async fn ic_agent(env: &Env) -> Result<(Agent, Principal)> {
    let canister = env.var("WL_USER_CANISTER_ID").map(|value| value.to_string()).map_err(|_| worker::Error::from("WL user canister is not configured"))?;
    let principal = Principal::from_text(canister).map_err(|_| worker::Error::from("invalid WL user canister"))?;
    let host = env.var("IC_GATEWAY_URL").map(|value| value.to_string()).unwrap_or_else(|_| "https://ic0.app".to_string());
    let agent = Agent::builder().with_url(host).build().map_err(|error| worker::Error::from(error.to_string()))?;
    Ok((agent, principal))
}

async fn redeem_sso(env: &Env, code: &str, redirect_uri: &str, verifier: &str) -> Result<Option<SsoAuthorizationCode>> {
    let (agent, canister) = ic_agent(env).await?;
    let args = Encode!(&code.to_string(), &"gamecreator".to_string(), &redirect_uri.to_string(), &verifier.to_string()).map_err(|error| worker::Error::from(error.to_string()))?;
    let bytes = agent.update(&canister, "redeem_sso_authorization_code").with_arg(args).call_and_wait().await.map_err(|error| worker::Error::from(error.to_string()))?;
    Decode!(&bytes, Option<SsoAuthorizationCode>).map_err(|error| worker::Error::from(error.to_string()))
}

async fn profile(env: &Env, principal_id: &str) -> Option<UserProfile> {
    let (agent, canister) = ic_agent(env).await.ok()?;
    let args = Encode!(&principal_id.to_string()).ok()?;
    let bytes = agent.query(&canister, "query_user_by_principal_id").with_arg(args).call().await.ok()?;
    Decode!(&bytes, Option<UserProfile>).ok()?.or(None)
}

async fn sso(request: &mut Request, env: &Env) -> Result<Response> {
    let body = request.json::<Value>().await.unwrap_or_else(|_| json!({}));
    let code = body.get("sso_code").and_then(Value::as_str).unwrap_or_default().trim().to_string();
    let redirect_uri = body.get("redirect_uri").and_then(Value::as_str).unwrap_or_default().to_string();
    let verifier = body.get("code_verifier").and_then(Value::as_str).unwrap_or_default().to_string();
    if code.is_empty() || redirect_uri.is_empty() || verifier.is_empty() { return response::error(request, env, "Missing sso_code parameter", 400, "MISSING_SSO_CODE"); }
    let main_site = env.var("MAIN_SITE_URL").map(|value| value.to_string()).unwrap_or_default();
    if !main_site.is_empty() && !redirect_uri.starts_with(&main_site) { return response::error(request, env, "Invalid SSO redirect URI", 401, "INVALID_REDIRECT_URI"); }
    let Some(authorization) = redeem_sso(env, &code, &redirect_uri, &verifier).await? else { return response::error(request, env, "Invalid or expired SSO authorization code", 401, "INVALID_SSO_CODE"); };
    let principal_id = authorization.principal_id.clone();
    let email = authorization.email.clone();
    let avatar = profile(env, &principal_id).await.map(|value| value.logo).filter(|value| !value.trim().is_empty());
    let database = db::database(env)?;
    let now = js_sys::Date::now() as i64;
    let admin_emails = env.var("ADMIN_EMAILS").map(|value| value.to_string()).unwrap_or_default();
    let configured_admin = email.as_deref().map(|value| admin_emails.split(',').any(|item| item.trim().eq_ignore_ascii_case(value))).unwrap_or(false);
    let existing = db::first(&database, "SELECT * FROM users WHERE principal_id = ?", &[json!(principal_id.clone())]).await?;
    let mut user_roles = existing.as_ref().map(|row| role_from_row(row).1).unwrap_or_else(|| vec![if configured_admin { "admin".to_string() } else { "player".to_string() }]);
    if configured_admin && !user_roles.iter().any(|role| role == "admin") { user_roles.push("admin".to_string()); }
    let role = if user_roles.iter().any(|item| item == "admin") { "admin" } else if user_roles.iter().any(|item| item == "creator") { "creator" } else { "player" };
    db::run(&database, "INSERT INTO users (principal_id, role, roles, email, avatar_url, email_verified, last_login_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(principal_id) DO UPDATE SET role = excluded.role, roles = excluded.roles, email = COALESCE(excluded.email, users.email), avatar_url = COALESCE(excluded.avatar_url, users.avatar_url), email_verified = excluded.email_verified, last_login_at = excluded.last_login_at, updated_at = excluded.updated_at", &[json!(principal_id.clone()), json!(role), json!(serde_json::to_string(&user_roles)?), json!(email.clone()), json!(avatar.clone()), json!(if authorization.is_email_verified { 1 } else { 0 }), json!(now), json!(now), json!(now)]).await?;
    let organization = db::first(&database, "SELECT * FROM developer_organizations WHERE owner_principal = ?", &[json!(principal_id.clone())]).await?;
    let token = sign(Claims { principal_id: principal_id.clone(), role: role.to_string(), roles: user_roles.clone(), game_id: None, email: email.clone(), is_email_verified: authorization.is_email_verified, iat: 0, exp: 0 }, &secret(env)?, 60 * 60 * 24 * 7)?;
    response::json(request, env, &json!({ "success": true, "token": token, "customToken": token, "uid": principal_id.clone(), "user": { "principal_id": principal_id, "role": role, "roles": user_roles, "email": email, "avatarUrl": avatar, "isEmailVerified": authorization.is_email_verified, "lastPortalLoginAt": now }, "organization": organization }), 200)
}

async fn update_profile(request: &mut Request, env: &Env) -> Result<Response> {
    let Some(claims) = user(request, env) else { return response::error(request, env, "Unauthorized", 401, "UNAUTHORIZED"); };
    let body = request.json::<Value>().await.unwrap_or_else(|_| json!({}));
    let database = db::database(env)?;
    if db::first(&database, "SELECT principal_id FROM users WHERE principal_id = ?", &[json!(claims.principal_id.clone())]).await?.is_none() { return response::error(request, env, "User not found", 404, "USER_NOT_FOUND"); }
    let current = db::first(&database, "SELECT withdrawal_updated_at FROM users WHERE principal_id = ?", &[json!(claims.principal_id.clone())]).await?;
    let withdrawal = body.get("withdrawal_token").is_some() || body.get("withdrawal_network").is_some() || body.get("withdrawal_address").is_some();
    if withdrawal && current.as_ref().and_then(|row| row.get("withdrawal_updated_at")).and_then(Value::as_i64).is_some_and(|value| js_sys::Date::now() as i64 - value < 30 * 24 * 60 * 60 * 1000) { return response::error(request, env, "Withdrawal details can only be updated once every 30 days", 429, "WITHDRAWAL_UPDATE_LIMIT"); }
    let now = js_sys::Date::now() as i64;
    db::run(&database, "UPDATE users SET email = COALESCE(?, email), tos_accepted_version = COALESCE(?, tos_accepted_version), kyc_status = COALESCE(?, kyc_status), creator_org_name = COALESCE(?, creator_org_name), withdrawal_token = COALESCE(?, withdrawal_token), withdrawal_network = COALESCE(?, withdrawal_network), withdrawal_address = COALESCE(?, withdrawal_address), withdrawal_updated_at = CASE WHEN ? = 1 THEN ? ELSE withdrawal_updated_at END, updated_at = ? WHERE principal_id = ?", &[body.get("email").cloned().unwrap_or(Value::Null), body.get("tos_accepted_version").cloned().unwrap_or(Value::Null), body.get("kyc_status").cloned().unwrap_or(Value::Null), body.get("creator_org_name").cloned().unwrap_or(Value::Null), body.get("withdrawal_token").cloned().unwrap_or(Value::Null), body.get("withdrawal_network").cloned().unwrap_or(Value::Null), body.get("withdrawal_address").cloned().unwrap_or(Value::Null), json!(if withdrawal { 1 } else { 0 }), json!(now), json!(now), json!(claims.principal_id)]).await?;
    response::json(request, env, &json!({ "success": true, "message": "Profile updated successfully" }), 200)
}

async fn me(request: &Request, env: &Env) -> Result<Response> {
    let Some(claims) = user(request, env) else {
        return response::error(request, env, "Unauthorized", 401, "UNAUTHORIZED");
    };
    let row = db::first(&db::database(env)?, "SELECT * FROM users WHERE principal_id = ?", &[json!(claims.principal_id)]).await?;
    let Some(row) = row else {
        return response::error(request, env, "User not found", 404, "USER_NOT_FOUND");
    };
    let (role, user_roles) = role_from_row(&row);
    let organization = db::first(&db::database(env)?, "SELECT * FROM developer_organizations WHERE owner_principal = ?", &[json!(claims.principal_id)]).await?;
    let token = sign(Claims { principal_id: claims.principal_id.clone(), role: role.clone(), roles: user_roles.clone(), game_id: None, email: db::string(&row, "email"), is_email_verified: db::integer(&row, "email_verified") == 1, iat: 0, exp: 0 }, &secret(env)?, 60 * 60 * 24 * 7)?;
    response::json(request, env, &json!({
        "success": true,
        "token": token,
        "user": {
            "principal_id": claims.principal_id,
            "role": role,
            "roles": user_roles,
            "email": db::string(&row, "email"),
            "avatarUrl": db::string(&row, "avatar_url"),
            "isEmailVerified": db::integer(&row, "email_verified") == 1,
            "tosAcceptedVersion": db::string(&row, "tos_accepted_version"),
            "kycStatus": db::string(&row, "kyc_status"),
            "creatorOrgName": db::string(&row, "creator_org_name"),
            "lastLoginAt": row.get("last_login_at"),
            "createdAt": row.get("created_at")
        },
        "organization": organization
    }), 200)
}

async fn become_creator(request: &Request, env: &Env) -> Result<Response> {
    let Some(claims) = user(request, env) else {
        return response::error(request, env, "Unauthorized", 401, "UNAUTHORIZED");
    };
    let database = db::database(env)?;
    let row = db::first(&database, "SELECT role, roles, email, email_verified FROM users WHERE principal_id = ?", &[json!(claims.principal_id.clone())]).await?;
    let Some(row) = row else {
        return response::error(request, env, "User not found", 404, "USER_NOT_FOUND");
    };
    let (_, mut user_roles) = role_from_row(&row);
    if !user_roles.iter().any(|role| role == "creator") { user_roles.push("creator".to_string()); }
    let primary = if user_roles.iter().any(|role| role == "admin") { "admin" } else { "creator" };
    db::run(&database, "UPDATE users SET role = ?, roles = ?, updated_at = ? WHERE principal_id = ?", &[json!(primary), json!(serde_json::to_string(&user_roles)?), json!(js_sys::Date::now() as i64), json!(claims.principal_id.clone())]).await?;
    let token = sign(Claims { principal_id: claims.principal_id, role: primary.to_string(), roles: user_roles.clone(), game_id: None, email: db::string(&row, "email"), is_email_verified: db::integer(&row, "email_verified") == 1, iat: 0, exp: 0 }, &secret(env)?, 60 * 60 * 24 * 7)?;
    response::json(request, env, &json!({ "success": true, "role": primary, "roles": user_roles, "token": token }), 200)
}

#[cfg(test)]
mod tests {
    use super::{has_role, roles, Claims};

    #[test]
    fn role_normalization_preserves_creator_access() {
        let claims = Claims {
            principal_id: "principal-1".to_string(),
            role: "creator".to_string(),
            roles: vec!["creator".to_string()],
            game_id: None,
            email: None,
            is_email_verified: true,
            iat: 0,
            exp: 0,
        };
        assert!(has_role(&claims, "creator"));
        assert!(!has_role(&claims, "admin"));
        assert_eq!(roles("creator", &["creator".to_string(), "invalid".to_string(), "creator".to_string()]), vec!["creator"]);
    }
}