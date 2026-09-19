mod auth;
mod admin;
mod bounties;
mod db;
mod deployments;
mod games;
mod github;
mod organizations;
mod play;
mod response;

use serde_json::json;
use worker::*;

#[event(fetch)]
pub async fn main(mut request: Request, env: Env, _ctx: Context) -> Result<Response> {
    if request.method() == Method::Options {
        return response::options(&request, &env);
    }

    let path = request.path();
    match (request.method(), path.as_str()) {
        (Method::Get, "/health") | (Method::Get, "/api/health") => {
            response::json(&request, &env, &json!({
                "status": "ok",
                "service": "randseed-gamecreator-worker-rust"
            }), 200)
        }
        _ => dispatch(&mut request, &env).await,
    }
}

async fn dispatch(request: &mut Request, env: &Env) -> Result<Response> {
    let path = request.path();

    if let Some(result) = auth::route(request, env).await? {
        return Ok(result);
    }
    if let Some(result) = admin::route(request, env).await? {
        return Ok(result);
    }
    if let Some(result) = bounties::route(request, env).await? {
        return Ok(result);
    }
    if let Some(result) = organizations::route(request, env).await? {
        return Ok(result);
    }
    if let Some(result) = games::route(request, env).await? {
        return Ok(result);
    }
    if let Some(result) = github::route(request, env).await? {
        return Ok(result);
    }
    if let Some(result) = deployments::route(request, env).await? {
        return Ok(result);
    }
    if let Some(result) = play::route(request, env).await? {
        return Ok(result);
    }

    let mut response = response::error(
        request,
        env,
        &format!("Route not found: {} {path}", request.method()),
        404,
        "NOT_FOUND",
    )?;
    response.headers_mut().set("Cache-Control", "no-store")?;
    Ok(response)
}
