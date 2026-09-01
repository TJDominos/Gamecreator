import type { Env } from "../types";

export function getCorsHeaders(request?: Request, env?: Env): HeadersInit {
  const allowedOrigins = env?.CORS_ORIGINS
    ? env.CORS_ORIGINS.split(",").map((s) => s.trim())
    : [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://test.randseed.org",
        "https://randseed.org",
      ];

  const origin = request?.headers.get("Origin") || "";
  const allowOrigin = allowedOrigins.includes(origin) || origin.endsWith(".randseed.org")
    ? origin
    : allowedOrigins[0] || "*";

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
    "Access-Control-Allow-Credentials": "true",
  };
}

export function jsonResponse<T>(
  data: T,
  status: number = 200,
  request?: Request,
  env?: Env,
): Response {
  const headers = new Headers(getCorsHeaders(request, env));
  headers.set("Content-Type", "application/json; charset=utf-8");

  return new Response(JSON.stringify(data), {
    status,
    headers,
  });
}

export function errorResponse(
  message: string,
  status: number = 400,
  code?: string | number,
  request?: Request,
  env?: Env,
): Response {
  return jsonResponse(
    {
      success: false,
      code: code ?? status,
      error: message,
      message,
    },
    status,
    request,
    env,
  );
}

export function handleOptionsRequest(request: Request, env: Env): Response {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(request, env),
  });
}
