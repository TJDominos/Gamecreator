mod db;
mod play;
#[cfg(not(feature = "play"))]
mod auth;
#[cfg(not(feature = "play"))]
mod admin;
#[cfg(not(feature = "play"))]
mod bounties;
#[cfg(not(feature = "play"))]
mod deployments;
#[cfg(not(feature = "play"))]
mod games;
#[cfg(not(feature = "play"))]
mod github;
#[cfg(not(feature = "play"))]
mod organizations;
#[cfg(not(feature = "play"))]
mod response;

use serde_json::json;
use worker::*;

#[event(fetch)]
#[cfg(feature = "play")]
pub async fn main(request: Request, env: Env, _ctx: Context) -> Result<Response> {
    if request.path() == "/health" || request.path() == "/api/health" {
        return Response::from_json(&json!({
            "status": "ok",
            "service": "randseed-gamecreator-play-rust"
        }));
    }
    if !matches!(request.method(), Method::Get | Method::Head) {
        let mut response = Response::error("Method not allowed", 405)?;
        response.headers_mut().set("Allow", "GET, HEAD")?;
        return Ok(response);
    }
    match play::route(&request, &env).await {
        Ok(Some(response)) => Ok(response),
        Ok(None) => Ok(Response::error("Game not found", 404)?),
        Err(_) => Ok(Response::error("Internal server error", 500)?),
    }
}

#[event(fetch)]
#[cfg(not(feature = "play"))]
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
        _ => match dispatch(&mut request, &env).await {
            Ok(response) => Ok(response),
            Err(_) => response::error(&request, &env, "Internal server error", 500, "INTERNAL_ERROR"),
        },
    }
}

#[cfg(not(feature = "play"))]
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
