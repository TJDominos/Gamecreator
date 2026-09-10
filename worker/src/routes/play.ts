/// <reference types="@cloudflare/workers-types" />

import type { PlayEnv } from "../types";
import { sha256Hex } from "../utils/crypto";

interface StaticTarget {
  gameId: string;
  path: string;
  privateToken?: string;
}

interface PointerCacheEntry {
  prefix: string;
  expiresAt: number;
}

const sandboxPointerCache = new Map<string, PointerCacheEntry>();
const privateReleaseCache = new Map<string, PointerCacheEntry>();
const POINTER_CACHE_TTL_MS = 25_000; // 25s in-memory cache to eliminate D1 per-asset load bottle-neck

const MIME_TYPES: Record<string, string> = {
  wasm: "application/wasm",
  data: "application/octet-stream",
  unityweb: "application/octet-stream",
  pck: "application/octet-stream",
  js: "application/javascript; charset=utf-8",
  mjs: "application/javascript; charset=utf-8",
  json: "application/json",
  atlas: "application/json",
  css: "text/css; charset=utf-8",
  html: "text/html; charset=utf-8",
  htm: "text/html; charset=utf-8",
  txt: "text/plain; charset=utf-8",
  svg: "image/svg+xml",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  ico: "image/x-icon",
  mp3: "audio/mpeg",
  ogg: "audio/ogg",
  wav: "audio/wav",
  m4a: "audio/mp4",
  mp4: "video/mp4",
  webm: "video/webm",
  woff: "font/woff",
  woff2: "font/woff2",
  ttf: "font/ttf",
  otf: "font/otf",
  cwasm: "application/wasm",
  symbols: "application/octet-stream",
};

export async function handlePlayRequest(
  request: Request,
  env: PlayEnv,
  ctx?: ExecutionContext,
): Promise<Response | null> {
  const url = new URL(request.url);

  // Health check endpoint
  if (url.pathname === "/health" || url.pathname === "/api/health") {
    return new Response(JSON.stringify({ status: "ok", service: "gamecreator-play" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!env.ARTIFACTS || !["GET", "HEAD"].includes(request.method)) return null;

  // Cloudflare Edge Cache lookup for GET requests
  if (request.method === "GET") {
    const cache = caches.default;
    const cached = await cache.match(request);
    if (cached) return cached;
  }

  const target = resolveStaticTarget(url, env);
  if (!target) return null;

  // Look up release prefix (in-memory cached or D1)
  const prefix = target.privateToken
    ? await resolvePrivateReleasePrefix(target.gameId, target.privateToken, env)
    : await resolveSandboxReleasePrefix(target.gameId, env);

  if (!prefix) return new Response("Game release not found", { status: 404 });

  let objectKey = `${prefix}/${target.path}`;
  let object = request.method === "HEAD"
    ? await env.ARTIFACTS.head(objectKey)
    : await env.ARTIFACTS.get(objectKey);

  let isPrecompressedBr = false;
  // If not found, check if a .br precompressed version was uploaded (e.g. game.wasm.br)
  const acceptEncoding = request.headers.get("Accept-Encoding") || "";
  if (!object && acceptEncoding.includes("br") && !target.path.endsWith(".br")) {
    const brKey = `${objectKey}.br`;
    const brObject = request.method === "HEAD"
      ? await env.ARTIFACTS.head(brKey)
      : await env.ARTIFACTS.get(brKey);
    if (brObject) {
      object = brObject;
      objectKey = brKey;
      isPrecompressedBr = true;
    }
  }

  // SPA fallback: if not found, and target.path is a clean route without dot (e.g. /levels/1), try index.html
  if (!object && target.path !== "index.html" && !target.path.includes(".")) {
    const fallbackKey = `${prefix}/index.html`;
    object = request.method === "HEAD"
      ? await env.ARTIFACTS.head(fallbackKey)
      : await env.ARTIFACTS.get(fallbackKey);
    if (object) {
      target.path = "index.html";
      objectKey = fallbackKey;
    }
  }

  if (!object) return new Response("File not found", { status: 404 });

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("ETag", object.httpEtag);

  // Determine MIME type accurately for WASM, WebGL, Unity, Godot, etc.
  const mimeType = getMimeType(target.path);
  if (mimeType) {
    headers.set("Content-Type", mimeType);
  }

  if (isPrecompressedBr || target.path.endsWith(".br")) {
    headers.set("Content-Encoding", "br");
  } else if (target.path.endsWith(".gz")) {
    headers.set("Content-Encoding", "gzip");
  }

  const isImmutableAsset = target.path !== "index.html";
  headers.set(
    "Cache-Control",
    isImmutableAsset
      ? "public, max-age=31536000, immutable"
      : "no-cache, no-store, must-revalidate",
  );

  applyGameSecurityHeaders(headers, env);

  const response = new Response(
    request.method === "HEAD" ? null : object.body,
    { status: 200, headers },
  );

  // Store in Cloudflare Edge Cache for immutable assets
  if (request.method === "GET" && isImmutableAsset && ctx) {
    ctx.waitUntil(caches.default.put(request, response.clone()));
  }

  return response;
}

function resolveStaticTarget(url: URL, env: PlayEnv): StaticTarget | null {
  const parts = url.pathname.split("/").filter(Boolean);
  if (parts.length === 0) return null;

  const queryToken = url.searchParams.get("token") || undefined;

  // 1. Optional subdomain mapping (if custom domain is mapped in the future)
  const hostname = url.hostname.toLowerCase();
  const playDomain = (env.PLAY_BASE_DOMAIN || "").toLowerCase();
  if (playDomain && hostname.endsWith(`.${playDomain}`)) {
    const gameId = hostname.slice(0, -(playDomain.length + 1));
    if (isSafeGameHostLabel(gameId)) {
      if (parts[0] === "private" && parts[1]) {
        const path = normalizeFilePath(parts.slice(2).join("/") || "index.html");
        return path ? { gameId, path, privateToken: decodeURIComponent(parts[1]) } : null;
      }
      const path = normalizeFilePath(parts.join("/") || "index.html");
      return path ? { gameId, path, privateToken: queryToken } : null;
    }
  }

  // 2. Path-based routing (used on workers.dev or direct paths)
  let gameId: string;
  let subParts: string[];

  if (parts[0] === "sandbox") {
    if (!parts[1]) return null;
    gameId = decodeURIComponent(parts[1]);
    subParts = parts.slice(2);
  } else {
    gameId = decodeURIComponent(parts[0]);
    subParts = parts.slice(1);
  }

  if (!isSafeGameHostLabel(gameId)) return null;

  if (subParts[0] === "private" && subParts[1]) {
    const privateToken = decodeURIComponent(subParts[1]);
    const path = normalizeFilePath(subParts.slice(2).join("/") || "index.html");
    return path ? { gameId, path, privateToken } : null;
  }

  const path = normalizeFilePath(subParts.join("/") || "index.html");
  return path ? { gameId, path, privateToken: queryToken } : null;
}

function isSafeGameHostLabel(value: string): boolean {
  return /^[a-z0-9][a-z0-9_-]{0,62}$/i.test(value);
}

function normalizeFilePath(path: string): string | null {
  if (
    !path ||
    path.includes("\\") ||
    path.startsWith("/") ||
    path.split("/").some((part) => !part || part === "." || part === "..")
  ) {
    return null;
  }
  return path.length <= 512 ? path : null;
}

function getMimeType(path: string): string | null {
  const cleanPath = path.endsWith(".br") || path.endsWith(".gz")
    ? path.slice(0, path.lastIndexOf("."))
    : path;
  const ext = cleanPath.split(".").pop()?.toLowerCase();
  return (ext && MIME_TYPES[ext]) || null;
}

async function resolveSandboxReleasePrefix(gameId: string, env: PlayEnv): Promise<string | null> {
  const now = Date.now();
  const cached = sandboxPointerCache.get(gameId);
  if (cached && cached.expiresAt > now) {
    return cached.prefix;
  }

  const row = await env.DB.prepare(
    `SELECT artifact_prefix FROM game_release_pointers WHERE game_id = ?`,
  ).bind(gameId).first<{ artifact_prefix: string }>();

  if (!row?.artifact_prefix) return null;

  sandboxPointerCache.set(gameId, {
    prefix: row.artifact_prefix,
    expiresAt: now + POINTER_CACHE_TTL_MS,
  });

  return row.artifact_prefix;
}

async function resolvePrivateReleasePrefix(
  gameId: string,
  token: string,
  env: PlayEnv,
): Promise<string | null> {
  const tokenHash = await sha256Hex(token);
  const cacheKey = `${gameId}:${tokenHash}`;
  const now = Date.now();
  const cached = privateReleaseCache.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    return cached.prefix;
  }

  const row = await env.DB.prepare(
    `SELECT d.artifact_prefix
     FROM private_releases r
     JOIN deployment_records d ON d.id = r.deployment_id
     WHERE r.game_id = ? AND r.token_hash = ? AND r.revoked_at IS NULL
       AND (r.expires_at IS NULL OR r.expires_at > ?)
       AND d.status = 'published'`,
  ).bind(gameId, tokenHash, now).first<{ artifact_prefix: string }>();

  if (!row?.artifact_prefix) return null;

  privateReleaseCache.set(cacheKey, {
    prefix: row.artifact_prefix,
    expiresAt: now + POINTER_CACHE_TTL_MS,
  });

  return row.artifact_prefix;
}

function applyGameSecurityHeaders(headers: Headers, env: PlayEnv): void {
  const connectSources = (env.GAME_CSP_CONNECT_SRC || "'self'")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .join(" ");

  // Allow embedding in randseed.org, localhost for development, and devcreator.randseed.org
  headers.set(
    "Content-Security-Policy",
    `default-src 'self' blob: data:; base-uri 'none'; object-src 'none'; frame-ancestors 'self' https://randseed.org https://*.randseed.org https://devcreator.randseed.org http://localhost:* http://127.0.0.1:*; form-action 'none'; script-src 'self' 'unsafe-eval' 'unsafe-inline' 'wasm-unsafe-eval' blob:; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; media-src 'self' data: blob: https:; font-src 'self' data: https:; connect-src 'self' ${connectSources} https: wss:; worker-src 'self' blob:; manifest-src 'self'`,
  );
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "no-referrer-when-downgrade");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), autoplay=(self), fullscreen=(self), gamepad=(self)");
  headers.set("Cross-Origin-Opener-Policy", "same-origin");
  headers.set("Cross-Origin-Embedder-Policy", "credentialless");
  headers.set("Cross-Origin-Resource-Policy", "cross-origin");
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
}
