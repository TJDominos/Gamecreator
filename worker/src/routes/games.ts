import type {
  Env,
  GameReleasePointerRow,
  GameRepoBindingRow,
  GameRow,
} from "../types";
import { getAuthenticatedUser } from "../middleware/auth";
import { errorResponse, jsonResponse } from "../utils/response";

export async function handleGameRoutes(
  request: Request,
  env: Env,
): Promise<Response | null> {
  const url = new URL(request.url);
  const pathname = url.pathname;
  const method = request.method;

  // 1. Media Serve Route: /api/media/*
  if (method === "GET" && pathname.startsWith("/api/media/")) {
    const key = decodeURIComponent(pathname.replace("/api/media/", ""));
    return handleServeMedia(key, request, env);
  }

  // 2. Games Collection: /api/games
  if (pathname === "/api/games") {
    if (method === "GET") {
      return handleListGames(request, env);
    }
    if (method === "POST") {
      return handleCreateGame(request, env);
    }
  }

  // 3. Single Game Operations: /api/games/:gameId/...
  const gameMatch = pathname.match(/^\/api\/games\/([^/]+)(\/.*)?$/);
  if (gameMatch) {
    const gameId = decodeURIComponent(gameMatch[1]);
    const subPath = gameMatch[2] || "";

    // Upload media: /api/games/:gameId/media-upload
    if (method === "POST" && subPath === "/media-upload") {
      return handleUploadMedia(gameId, request, env);
    }

    if (method === "GET" && subPath === "") {
      return handleGetGame(gameId, request, env);
    }

    if (method === "PUT" && subPath === "") {
      return handleUpdateGame(gameId, request, env);
    }

    if (method === "DELETE" && subPath === "") {
      return handleDeleteGame(gameId, request, env);
    }
  }

  return null;
}

/**
 * List all games for the authenticated creator with release pointers and repo info joined
 */
async function handleListGames(request: Request, env: Env): Promise<Response> {
  const user = await getAuthenticatedUser(request, env);
  if (!user) {
    return errorResponse("Authentication required", 401, "UNAUTHORIZED", request, env);
  }
  if (user.role !== "creator") {
    return errorResponse("Creator access required", 403, "FORBIDDEN", request, env);
  }
  const creatorPrincipal = user.principal_id;

  try {
    if (!env.DB) {
      return jsonResponse({ success: true, games: [] }, 200, request, env);
    }

    const gamesResult = await env.DB.prepare(
      `SELECT * FROM games WHERE creator_principal = ? ORDER BY created_at DESC`,
    ).bind(creatorPrincipal).all<GameRow>();

    const rows = gamesResult.results || [];

    // Augment with release pointers and repo bindings
    const games = await Promise.all(
      rows.map(async (row) => {
        const pointer = await env.DB.prepare(
          `SELECT version, active_deployment_id FROM game_release_pointers WHERE game_id = ?`,
        ).bind(row.id).first<GameReleasePointerRow>();

        const binding = await env.DB.prepare(
          `SELECT * FROM game_repo_bindings WHERE game_id = ?`,
        ).bind(row.id).first<GameRepoBindingRow>();

        // Version is strictly bound to release pointers / deployments
        const version = pointer && pointer.version ? `v${pointer.version}` : (row.version || "---");

        return {
          id: row.id,
          name: row.name,
          status: row.status,
          version,
          displayVersion: row.display_version || "",
          players: row.players || "---",
          visitors: row.visitors || "---",
          revenue: row.revenue || "---",
          availableBalance: row.available_balance || "---",
          escrowedBalance: row.escrowed_balance || "---",
          createdAt: row.created_at,
          profile: {
            description: row.description || "",
            coverImage: row.cover_image || "",
            animationUrl: row.animation_url || "",
            displayVersion: row.display_version || "",
          },
          repoInfo: binding
            ? {
                repository: binding.repo_full_name,
                branch: binding.default_branch,
                lastCommitSha: binding.last_synced_commit || "---",
                lastCommitMessage: binding.last_commit_message || "---",
                lastSyncedAt: binding.last_synced_at
                  ? new Date(binding.last_synced_at).toISOString()
                  : "---",
                isSynced: binding.sync_status === "synced",
                syncMethod: binding.sync_method,
                sandboxUrl: binding.sandbox_url,
              }
            : undefined,
        };
      }),
    );

    return jsonResponse({ success: true, games }, 200, request, env);
  } catch (err) {
    return errorResponse(
      err instanceof Error ? err.message : "Failed to list games",
      500,
      "DB_ERROR",
      request,
      env,
    );
  }
}

/**
 * Get single game details
 */
async function handleGetGame(gameId: string, request: Request, env: Env): Promise<Response> {
  const access = await authorizeGame(gameId, request, env);
  if (!access.ok) return access.response;

  try {
    if (!env.DB) {
      return errorResponse("Database not available", 503, "DB_UNAVAILABLE", request, env);
    }

    const row = await env.DB.prepare(
      `SELECT * FROM games WHERE id = ?`,
    ).bind(gameId).first<GameRow>();

    if (!row) {
      return errorResponse("Game not found", 404, "NOT_FOUND", request, env);
    }

    const pointer = await env.DB.prepare(
      `SELECT version, active_deployment_id FROM game_release_pointers WHERE game_id = ?`,
    ).bind(gameId).first<GameReleasePointerRow>();

    const binding = await env.DB.prepare(
      `SELECT * FROM game_repo_bindings WHERE game_id = ?`,
    ).bind(gameId).first<GameRepoBindingRow>();

    const version = pointer && pointer.version ? `v${pointer.version}` : (row.version || "---");

    const game = {
      id: row.id,
      name: row.name,
      status: row.status,
      version,
      displayVersion: row.display_version || "",
      players: row.players || "---",
      visitors: row.visitors || "---",
      revenue: row.revenue || "---",
      availableBalance: row.available_balance || "---",
      escrowedBalance: row.escrowed_balance || "---",
      createdAt: row.created_at,
      profile: {
        description: row.description || "",
        coverImage: row.cover_image || "",
        animationUrl: row.animation_url || "",
        displayVersion: row.display_version || "",
      },
      repoInfo: binding
        ? {
            repository: binding.repo_full_name,
            branch: binding.default_branch,
            lastCommitSha: binding.last_synced_commit || "---",
            lastCommitMessage: binding.last_commit_message || "---",
            lastSyncedAt: binding.last_synced_at
              ? new Date(binding.last_synced_at).toISOString()
              : "---",
            isSynced: binding.sync_status === "synced",
            syncMethod: binding.sync_method,
            sandboxUrl: binding.sandbox_url,
          }
        : undefined,
    };

    return jsonResponse({ success: true, game }, 200, request, env);
  } catch (err) {
    return errorResponse(
      err instanceof Error ? err.message : "Failed to get game",
      500,
      "DB_ERROR",
      request,
      env,
    );
  }
}

/**
 * Creates a new draft game with auto-incremented default name if needed
 */
async function handleCreateGame(request: Request, env: Env): Promise<Response> {
  const user = await getAuthenticatedUser(request, env);
  if (!user) return errorResponse("Authentication required", 401, "UNAUTHORIZED", request, env);
  if (user.role !== "creator") {
    return errorResponse("Creator access required", 403, "FORBIDDEN", request, env);
  }
  const creatorPrincipal = user.principal_id;

  const body = (await request.json().catch(() => ({}))) as {
    name?: string;
    id?: string;
  };

  try {
    if (!env.DB) {
      return errorResponse("Database not available", 503, "DB_UNAVAILABLE", request, env);
    }

    let gameName = body.name?.trim();

    // Auto-generate name if not provided: new game, new game 2, etc.
    if (!gameName) {
      const existing = await env.DB.prepare(
        `SELECT name FROM games WHERE creator_principal = ?`,
      ).bind(creatorPrincipal).all<{ name: string }>();

      const names = new Set((existing.results || []).map((r) => r.name.trim().toLowerCase()));

      if (!names.has("new game")) {
        gameName = "new game";
      } else {
        let maxNum = 1;
        for (const n of names) {
          const m = n.match(/^new\s*game\s*(\d+)$/i);
          if (m) {
            const num = parseInt(m[1], 10);
            if (num > maxNum) maxNum = num;
          }
        }
        gameName = `new game${maxNum + 1}`;
      }
    }

    const id = body.id || `g_${crypto.randomUUID().replace(/-/g, "")}`;
    const now = Date.now();

    await env.DB.prepare(
      `INSERT INTO games (
        id, creator_principal, name, status, version, visitors, players, revenue, available_balance, escrowed_balance, created_at, updated_at
      ) VALUES (?, ?, ?, 'DRAFT', '---', '---', '---', '---', '---', '---', ?, ?)`,
    ).bind(id, creatorPrincipal, gameName, now, now).run();

    const createdGame = {
      id,
      name: gameName,
      status: "DRAFT",
      version: "---",
      visitors: "---",
      players: "---",
      revenue: "---",
      availableBalance: "---",
      escrowedBalance: "---",
      createdAt: now,
      profile: {
        description: "",
        coverImage: "",
        animationUrl: "",
      },
    };

    return jsonResponse({ success: true, game: createdGame }, 201, request, env);
  } catch (err) {
    return errorResponse(
      err instanceof Error ? err.message : "Failed to create game",
      500,
      "DB_ERROR",
      request,
      env,
    );
  }
}

/**
 * Updates game fields (excluding version, which is bound to deployment publishing)
 */
async function handleUpdateGame(gameId: string, request: Request, env: Env): Promise<Response> {
  const access = await authorizeGame(gameId, request, env);
  if (!access.ok) return access.response;

  const body = (await request.json().catch(() => null)) as {
    name?: string;
    status?: string;
    displayVersion?: string;
    profile?: {
      description?: string;
      coverImage?: string;
      animationUrl?: string;
      displayVersion?: string;
    };
  } | null;

  if (!body) {
    return errorResponse("Missing update payload", 400, "MISSING_PAYLOAD", request, env);
  }

  try {
    if (!env.DB) {
      return errorResponse("Database not available", 503, "DB_UNAVAILABLE", request, env);
    }

    const now = Date.now();
    const existing = await env.DB.prepare(`SELECT * FROM games WHERE id = ?`).bind(gameId).first<GameRow>();
    if (!existing) {
      return errorResponse("Game not found", 404, "NOT_FOUND", request, env);
    }

    const name = body.name?.trim() || existing.name;
    const status = body.status || existing.status;
    const displayVersion = body.displayVersion !== undefined 
      ? body.displayVersion 
      : (body.profile?.displayVersion !== undefined ? body.profile.displayVersion : (existing.display_version || ""));
    const description = body.profile?.description !== undefined ? body.profile.description : existing.description;
    const coverImage = body.profile?.coverImage !== undefined ? body.profile.coverImage : existing.cover_image;
    const animationUrl = body.profile?.animationUrl !== undefined ? body.profile.animationUrl : existing.animation_url;

    // Persist to database including display_version
    try {
      await env.DB.prepare(
        `UPDATE games
         SET name = ?, status = ?, display_version = ?, description = ?, cover_image = ?, animation_url = ?, updated_at = ?
         WHERE id = ?`,
      ).bind(name, status, displayVersion, description, coverImage, animationUrl, now, gameId).run();
    } catch {
      // Fallback if display_version column is not yet present in existing D1 migration
      await env.DB.prepare(
        `UPDATE games
         SET name = ?, status = ?, description = ?, cover_image = ?, animation_url = ?, updated_at = ?
         WHERE id = ?`,
      ).bind(name, status, description, coverImage, animationUrl, now, gameId).run();
    }

    return jsonResponse({ success: true, message: "Game updated successfully" }, 200, request, env);
  } catch (err) {
    return errorResponse(
      err instanceof Error ? err.message : "Failed to update game",
      500,
      "DB_ERROR",
      request,
      env,
    );
  }
}

/**
 * Deletes a game and its bindings
 */
async function handleDeleteGame(gameId: string, request: Request, env: Env): Promise<Response> {
  const access = await authorizeGame(gameId, request, env);
  if (!access.ok) return access.response;

  try {
    if (!env.DB) {
      return errorResponse("Database not available", 503, "DB_UNAVAILABLE", request, env);
    }

    await env.DB.prepare(`DELETE FROM games WHERE id = ?`).bind(gameId).run();
    await env.DB.prepare(`DELETE FROM game_repo_bindings WHERE game_id = ?`).bind(gameId).run();
    await env.DB.prepare(`DELETE FROM game_release_pointers WHERE game_id = ?`).bind(gameId).run();

    return jsonResponse({ success: true, message: `Game ${gameId} deleted` }, 200, request, env);
  } catch (err) {
    return errorResponse(
      err instanceof Error ? err.message : "Failed to delete game",
      500,
      "DB_ERROR",
      request,
      env,
    );
  }
}

/**
 * Production media upload handler for Cover Image (<=1MB) and Animation (<=10MB, MP4)
 */
async function handleUploadMedia(gameId: string, request: Request, env: Env): Promise<Response> {
  const access = await authorizeGame(gameId, request, env);
  if (!access.ok) return access.response;

  const contentType = request.headers.get("content-type") || "";

  try {
    let fileBuffer: ArrayBuffer;
    let mimeType = "";
    let mediaType = "cover";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      mediaType = (formData.get("type") as string) || "cover";

      if (!file) {
        return errorResponse("No file uploaded", 400, "MISSING_FILE", request, env);
      }

      fileBuffer = await file.arrayBuffer();
      mimeType = file.type || "application/octet-stream";
    } else {
      // Direct binary upload with headers
      mediaType = request.headers.get("x-media-type") || "cover";
      mimeType = contentType;
      fileBuffer = await request.arrayBuffer();
    }

    // Size limit verification
    const isAnimation = mediaType === "animation";
    const maxBytes = isAnimation ? 10 * 1024 * 1024 : 1 * 1024 * 1024;

    if (fileBuffer.byteLength > maxBytes) {
      const limitMb = isAnimation ? "10 MB" : "1 MB";
      return errorResponse(
        `File size exceeds the allowed limit of ${limitMb}.`,
        413,
        "PAYLOAD_TOO_LARGE",
        request,
        env,
      );
    }

    // Format verification
    if (isAnimation) {
      if (!mimeType.includes("mp4") && !mimeType.includes("video")) {
        return errorResponse("Only MP4 videos are allowed for game animations.", 400, "INVALID_FORMAT", request, env);
      }
    } else {
      if (!mimeType.startsWith("image/")) {
        return errorResponse("Only images (PNG, JPEG, WebP, GIF) are allowed for cover images.", 400, "INVALID_FORMAT", request, env);
      }
    }

    const ext = isAnimation ? "mp4" : (mimeType.split("/")[1]?.replace("+xml", "") || "png");
    const filename = `${mediaType}_${crypto.randomUUID()}.${ext}`;
    const key = `games/${gameId}/media/${filename}`;

    // Store in Cloudflare R2 bucket if configured
    if (env.ARTIFACTS) {
      await env.ARTIFACTS.put(key, fileBuffer, {
        httpMetadata: {
          contentType: mimeType,
          cacheControl: "public, max-age=31536000, immutable",
        },
      });

      const publicUrl = `/api/media/${encodeURIComponent(key)}`;
      return jsonResponse(
        {
          success: true,
          url: publicUrl,
          key,
          size: fileBuffer.byteLength,
        },
        200,
        request,
        env,
      );
    }

    // Fallback: If R2 is not configured, generate DataURL for resilient preview
    const uint8 = new Uint8Array(fileBuffer);
    let binary = "";
    const len = uint8.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(uint8[i]);
    }
    const base64 = btoa(binary);
    const dataUrl = `data:${mimeType};base64,${base64}`;

    return jsonResponse(
      {
        success: true,
        url: dataUrl,
        key,
        size: fileBuffer.byteLength,
        note: "Stored via inline fallback (R2 bucket not bound in current environment)",
      },
      200,
      request,
      env,
    );
  } catch (err) {
    return errorResponse(
      err instanceof Error ? err.message : "Failed to upload media",
      500,
      "UPLOAD_ERROR",
      request,
      env,
    );
  }
}

/**
 * Serves media from R2 bucket
 */
async function handleServeMedia(key: string, request: Request, env: Env): Promise<Response> {
  if (!env.ARTIFACTS) {
    return errorResponse("Artifact storage not available", 503, "STORAGE_UNAVAILABLE", request, env);
  }

  try {
    const match = key.match(/^games\/([^/]+)\/media\/(?:cover|animation)_[^/]+\.[a-z0-9]+$/i);
    if (!match) return errorResponse("Invalid media key", 400, "INVALID_MEDIA_KEY", request, env);
    const game = await env.DB.prepare(`SELECT id FROM games WHERE id = ?`).bind(match[1]).first<{ id: string }>();
    if (!game) return errorResponse("Media not found", 404, "NOT_FOUND", request, env);

    const object = await env.ARTIFACTS.get(key);
    if (!object) {
      return errorResponse("Media not found", 404, "NOT_FOUND", request, env);
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag);
    headers.set("Cache-Control", "public, max-age=31536000, immutable");

    return new Response(object.body, {
      headers,
    });
  } catch (err) {
    return errorResponse(
      err instanceof Error ? err.message : "Failed to retrieve media",
      500,
      "MEDIA_ERROR",
      request,
      env,
    );
  }
}

async function authorizeGame(
  gameId: string,
  request: Request,
  env: Env,
): Promise<{ ok: true } | { ok: false; response: Response }> {
  const user = await getAuthenticatedUser(request, env);
  if (!user) {
    return { ok: false, response: errorResponse("Authentication required", 401, "UNAUTHORIZED", request, env) };
  }
  if (user.role !== "creator") {
    return { ok: false, response: errorResponse("Creator access required", 403, "FORBIDDEN", request, env) };
  }

  const game = await env.DB.prepare(
    `SELECT id FROM games WHERE id = ? AND creator_principal = ?`,
  ).bind(gameId, user.principal_id).first<{ id: string }>();
  if (!game) {
    return { ok: false, response: errorResponse("You do not have access to this game", 403, "FORBIDDEN", request, env) };
  }
  return { ok: true };
}
