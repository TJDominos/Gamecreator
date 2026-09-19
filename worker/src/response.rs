use serde_json::{json, Value};
use worker::{Env, Headers, Method, Request, Response, Result};

fn allowed_origin(request: &Request, env: &Env) -> String {
    let origin = request.headers().get("Origin").ok().flatten().unwrap_or_default();
    let configured = env
        .var("CORS_ORIGINS")
        .map(|value| value.to_string())
        .unwrap_or_else(|_| "http://localhost:3000,http://127.0.0.1:3000,https://devcreator.randseed.org,https://creator.randseed.org".to_string());
    if configured.split(',').map(str::trim).any(|item| item == origin)
        || (origin.ends_with(".randseed.org") && !origin.is_empty())
    {
        origin
    } else {
        configured.split(',').next().unwrap_or("*").trim().to_string()
    }
}

fn cors(request: &Request, env: &Env) -> Result<Headers> {
    let mut headers = Headers::new();
    headers.set("Access-Control-Allow-Origin", &allowed_origin(request, env))?;
    headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")?;
    headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")?;
    headers.set("Access-Control-Allow-Credentials", "true")?;
    Ok(headers)
}

pub fn json(request: &Request, env: &Env, value: &Value, status: u16) -> Result<Response> {
    let mut response = Response::from_json(value)?.with_status(status);
    let headers = cors(request, env)?;
    for (key, value) in headers.entries() {
        response.headers_mut().set(&key, &value)?;
    }
    Ok(response)
}

pub fn error(request: &Request, env: &Env, message: &str, status: u16, code: &str) -> Result<Response> {
    json(request, env, &json!({
        "success": false,
        "code": code,
        "error": message,
        "message": message
    }), status)
}

pub fn html(body: &str) -> Result<Response> {
    let mut response = Response::from_html(body)?;
    response.headers_mut().set("Cache-Control", "no-store, no-cache, must-revalidate")?;
    Ok(response)
}

pub fn options(request: &Request, env: &Env) -> Result<Response> {
    let mut response = Response::empty()?.with_status(204);
    let headers = cors(request, env)?;
    for (key, value) in headers.entries() {
        response.headers_mut().set(&key, &value)?;
    }
    Ok(response)
}

pub fn is_json_method(request: &Request) -> bool {
    matches!(request.method(), Method::Post | Method::Put | Method::Delete)
}