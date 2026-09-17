import type { Env } from "../types";
import { errorResponse, jsonResponse } from "../utils/response";
import { getAuthenticatedUser } from "../middleware/auth";

export async function handleBountyRoutes(request: Request, env: Env): Promise<Response | null> {
  const url = new URL(request.url);

  // Admin routes
  if (url.pathname === "/api/admin/bounties" && request.method === "GET") {
    return handleAdminListBounties(request, env);
  }
  if (url.pathname === "/api/admin/bounties" && request.method === "POST") {
    return handleCreateBounty(request, env);
  }
  if (url.pathname === "/api/admin/bounties/media" && request.method === "PUT") {
    return handleUploadMedia(request, env);
  }
  if (url.pathname.startsWith("/api/admin/bounties/") && request.method === "PUT") {
    return handleUpdateBounty(request, env);
  }
  if (url.pathname.startsWith("/api/admin/bounties/") && request.method === "DELETE") {
    return handleDeleteBounty(request, env);
  }

  // Public/Creator routes
  if (url.pathname === "/api/bounties" && request.method === "GET") {
    return handleListBounties(request, env);
  }
  if (url.pathname.startsWith("/api/bounties/") && request.method === "GET") {
    return handleGetBounty(request, env);
  }
  if (url.pathname.startsWith("/api/bounties/") && url.pathname.endsWith("/participate") && request.method === "POST") {
    return handleParticipate(request, env);
  }
  if (url.pathname.startsWith("/api/bounties/") && url.pathname.endsWith("/participate") && request.method === "DELETE") {
    return handleLeaveBounty(request, env);
  }
  
  return null;
}

// Generate an ID for new bounties
const generateId = () => `bty_${crypto.randomUUID().replace(/-/g, "").slice(0, 18)}`;

const nullableText = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value : null;

async function handleAdminListBounties(request: Request, env: Env): Promise<Response> {
  const authUser = await getAuthenticatedUser(request, env);
  if (!authUser || authUser.role !== "admin") {
    return errorResponse("Admin access required", 403, "FORBIDDEN", request, env);
  }

  try {
    const { results: bounties } = await env.DB.prepare(`
      SELECT * FROM bounties ORDER BY created_at DESC
    `).all();

    // Attach participants and published games for the admin management view.
    for (const b of bounties) {
      Object.assign(b, await attachBountyDetails(b, env, authUser.principal_id));
    }

    return jsonResponse({ success: true, bounties }, 200, request, env);
  } catch (err: any) {
    return errorResponse(err.message, 500, "DB_ERROR", request, env);
  }
}

async function handleCreateBounty(request: Request, env: Env): Promise<Response> {
  const authUser = await getAuthenticatedUser(request, env);
  if (!authUser || authUser.role !== "admin") {
    return errorResponse("Admin access required", 403, "FORBIDDEN", request, env);
  }

  try {
    const body: any = await request.json();
    const id = generateId();
    const now = Date.now();
    const description = body.shortDesc ?? body.description ?? "";
    const fullDescription = nullableText(body.fullDesc ?? body.fullDescription);
    const prizePool = body.poolAmount ?? body.prizePool ?? 0;
    const maxParticipants = body.maxParticipants ?? body.max_participants ?? 100;
    const deadline = nullableText(body.participationEndDate ?? body.deadline);
    const releaseDate = nullableText(body.releaseDate ?? body.release_date);
    const battleEnd = nullableText(body.distributionDate ?? body.battleEnd);
    const videoUrl = nullableText(body.videoUrl ?? body.thumbnailUrl);
    const settlementRules = body.settlementRules ?? body.settlement_rules ?? "Default Distribution Algorithm";

    await env.DB.prepare(`
      INSERT INTO bounties (
        id, title, description, full_description, state, category, 
        prize_pool, currency, tags, max_participants, deadline, release_date,
        battle_end, video_url, settlement_rules, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, body.title ?? "", description, fullDescription,
      body.state ?? 'OPEN', body.category ?? "", prizePool, body.currency ?? "WLT",
      JSON.stringify(body.tags ?? []), maxParticipants, deadline, releaseDate,
      battleEnd, videoUrl, settlementRules, now, now
    ).run();

    // Insert examples if any
    if (body.examples && Array.isArray(body.examples)) {
      for (const ex of body.examples) {
        await env.DB.prepare(`
          INSERT INTO bounty_examples (id, bounty_id, type, title, thumbnail, url)
          VALUES (?, ?, ?, ?, ?, ?)
        `).bind(
          generateId(),
          id,
          ex.type ?? "web",
          nullableText(ex.title ?? ex.name),
          nullableText(ex.thumbnail ?? ex.thumbnailUrl),
          nullableText(ex.url),
        ).run();
      }
    }

    return jsonResponse({ success: true, id }, 200, request, env);
  } catch (err: any) {
    return errorResponse(err.message, 500, "DB_ERROR", request, env);
  }
}

async function handleUpdateBounty(request: Request, env: Env): Promise<Response> {
  const authUser = await getAuthenticatedUser(request, env);
  if (!authUser || authUser.role !== "admin") {
    return errorResponse("Admin access required", 403, "FORBIDDEN", request, env);
  }

  try {
    const url = new URL(request.url);
    const parts = url.pathname.split('/');
    const id = parts[parts.length - 1];
    
    const body: any = await request.json();
    const now = Date.now();
    const description = body.shortDesc ?? body.description ?? "";
    const fullDescription = nullableText(body.fullDesc ?? body.fullDescription);
    const prizePool = body.poolAmount ?? body.prizePool ?? 0;
    const maxParticipants = body.maxParticipants ?? body.max_participants ?? 100;
    const deadline = nullableText(body.participationEndDate ?? body.deadline);
    const releaseDate = nullableText(body.releaseDate ?? body.release_date);
    const battleEnd = nullableText(body.distributionDate ?? body.battleEnd);
    const videoUrl = nullableText(body.videoUrl ?? body.thumbnailUrl);
    const settlementRules = body.settlementRules ?? body.settlement_rules ?? "Default Distribution Algorithm";

    await env.DB.prepare(`
      UPDATE bounties SET 
        title = ?, description = ?, full_description = ?, state = COALESCE(?, state), category = ?,
        prize_pool = ?, currency = ?, tags = ?, max_participants = ?, deadline = ?, release_date = ?,
        battle_end = ?, video_url = ?, settlement_rules = ?,
        updated_at = ?
      WHERE id = ?
    `).bind(
      body.title ?? "", description, fullDescription,
      body.state ?? null, body.category ?? "", prizePool, body.currency ?? "WLT",
      JSON.stringify(body.tags ?? []), maxParticipants, deadline, releaseDate,
      battleEnd, videoUrl, settlementRules, now, id
    ).run();

    // Recreate examples (naive approach: delete and insert)
    await env.DB.prepare(`DELETE FROM bounty_examples WHERE bounty_id = ?`).bind(id).run();
    if (body.examples && Array.isArray(body.examples)) {
      for (const ex of body.examples) {
        await env.DB.prepare(`
          INSERT INTO bounty_examples (id, bounty_id, type, title, thumbnail, url)
          VALUES (?, ?, ?, ?, ?, ?)
        `).bind(
          generateId(),
          id,
          ex.type ?? "web",
          nullableText(ex.title ?? ex.name),
          nullableText(ex.thumbnail ?? ex.thumbnailUrl),
          nullableText(ex.url),
        ).run();
      }
    }

    return jsonResponse({ success: true }, 200, request, env);
  } catch (err: any) {
    return errorResponse(err.message, 500, "DB_ERROR", request, env);
  }
}

async function handleDeleteBounty(request: Request, env: Env): Promise<Response> {
  const authUser = await getAuthenticatedUser(request, env);
  if (!authUser || authUser.role !== "admin") {
    return errorResponse("Admin access required", 403, "FORBIDDEN", request, env);
  }

  try {
    const url = new URL(request.url);
    const parts = url.pathname.split('/');
    const id = parts[parts.length - 1];
    
    await env.DB.prepare(`DELETE FROM bounties WHERE id = ?`).bind(id).run();
    
    return jsonResponse({ success: true }, 200, request, env);
  } catch (err: any) {
    return errorResponse(err.message, 500, "DB_ERROR", request, env);
  }
}

async function handleListBounties(request: Request, env: Env): Promise<Response> {
  try {
    const authUser = await getAuthenticatedUser(request, env);
    const { results: bounties } = await env.DB.prepare(`
      SELECT b.*,
        (SELECT COUNT(*) FROM bounty_participants p WHERE p.bounty_id = b.id) AS subscriptions,
        (SELECT COUNT(*) FROM bounty_published_games g WHERE g.bounty_id = b.id) AS online_games,
        CASE WHEN ? IS NULL THEN 0 ELSE EXISTS(
          SELECT 1 FROM bounty_participants p2
          WHERE p2.bounty_id = b.id AND p2.principal_id = ?
        ) END AS is_subscribed
      FROM bounties b
      WHERE b.state != 'DRAFT'
      ORDER BY b.created_at DESC
    `).bind(authUser?.principal_id ?? null, authUser?.principal_id ?? null).all();

    for (const b of bounties) {
      const { results: examples } = await env.DB.prepare(`
        SELECT * FROM bounty_examples WHERE bounty_id = ?
      `).bind(b.id).all();
      b.examples = examples;
    }

    return jsonResponse({ success: true, bounties }, 200, request, env);
  } catch (err: any) {
    return errorResponse(err.message, 500, "DB_ERROR", request, env);
  }
}

async function getBountyRow(request: Request, env: Env, bountyId: string): Promise<any | null> {
  const authUser = await getAuthenticatedUser(request, env);
  return env.DB.prepare(`
    SELECT b.*,
      (SELECT COUNT(*) FROM bounty_participants p WHERE p.bounty_id = b.id) AS subscriptions,
      (SELECT COUNT(*) FROM bounty_published_games g WHERE g.bounty_id = b.id) AS online_games,
      (SELECT COALESCE(SUM(g.performance_score), 0) FROM bounty_published_games g WHERE g.bounty_id = b.id) AS total_score,
      CASE WHEN ? IS NULL THEN 0 ELSE EXISTS(
        SELECT 1 FROM bounty_participants p2
        WHERE p2.bounty_id = b.id AND p2.principal_id = ?
      ) END AS is_subscribed
    FROM bounties b
    WHERE b.id = ?
  `).bind(authUser?.principal_id ?? null, authUser?.principal_id ?? null, bountyId).first();
}

async function attachBountyDetails(
  bounty: any,
  env: Env,
  principalId?: string,
): Promise<any> {
  const { results: examples } = await env.DB.prepare(
    "SELECT id, type, title, thumbnail, url FROM bounty_examples WHERE bounty_id = ? ORDER BY id",
  ).bind(bounty.id).all();

  const { results: participants } = await env.DB.prepare(`
    SELECT p.principal_id, p.joined_at, u.email
    FROM bounty_participants p
    LEFT JOIN users u ON u.principal_id = p.principal_id
    WHERE p.bounty_id = ?
    ORDER BY p.joined_at ASC
  `).bind(bounty.id).all<any>();

  const { results: publishedGames } = await env.DB.prepare(`
    SELECT p.id, p.game_id, p.principal_id, p.prize, p.uu, p.review_score, p.performance_score,
      p.is_winner, p.game_id AS game_name, u.email
    FROM bounty_published_games p
    LEFT JOIN users u ON u.principal_id = p.principal_id
    WHERE p.bounty_id = ?
    ORDER BY p.performance_score DESC, p.published_at ASC
  `).bind(bounty.id).all<any>();

  const mappedGames = publishedGames.map((game) => ({
    id: game.id,
    gameId: game.game_id,
    creator: {
      id: game.principal_id,
      name: game.email || game.principal_id,
      avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(game.principal_id)}`,
    },
    gameName: game.game_name || "Published game",
    prize: game.prize,
    uu: game.uu,
    reviewScore: game.review_score,
    performanceScore: game.performance_score,
    isWinner: Boolean(game.is_winner),
  }));

  const userGame = principalId
    ? mappedGames.find((game) => game.creator.id === principalId)
    : undefined;

  return {
    ...bounty,
    examples,
    participants: participants.map((participant: any) => ({
      id: participant.principal_id,
      name: participant.email || participant.principal_id,
      avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(participant.principal_id)}`,
      joinedAt: participant.joined_at,
    })),
    published_games: mappedGames.filter((game) => !game.isWinner),
    winners: mappedGames.filter((game) => game.isWinner),
    my_game_name: userGame?.gameName,
    my_game_score: userGame?.performanceScore,
  };
}

async function handleGetBounty(request: Request, env: Env): Promise<Response> {
  const parts = new URL(request.url).pathname.split("/");
  const bountyId = parts[3];
  if (!bountyId || bountyId === "participate") {
    return errorResponse("Bounty not found", 404, "NOT_FOUND", request, env);
  }

  try {
    const authUser = await getAuthenticatedUser(request, env);
    const bounty = await getBountyRow(request, env, bountyId);
    if (!bounty) return errorResponse("Bounty not found", 404, "NOT_FOUND", request, env);
    if (bounty.state === "DRAFT") return errorResponse("Bounty not found", 404, "NOT_FOUND", request, env);
    return jsonResponse(
      { success: true, bounty: await attachBountyDetails(bounty, env, authUser?.principal_id) },
      200,
      request,
      env,
    );
  } catch (err: any) {
    return errorResponse(err.message, 500, "DB_ERROR", request, env);
  }
}

async function handleParticipate(request: Request, env: Env): Promise<Response> {
  const authUser = await getAuthenticatedUser(request, env);
  if (!authUser) {
    return errorResponse("Authentication required", 401, "UNAUTHORIZED", request, env);
  }

  try {
    const url = new URL(request.url);
    const parts = url.pathname.split('/');
    const bountyId = parts[3]; // /api/bounties/:id/participate
    
    const bounty = await env.DB.prepare("SELECT state FROM bounties WHERE id = ?")
      .bind(bountyId)
      .first<{ state: string }>();
    if (!bounty) return errorResponse("Bounty not found", 404, "NOT_FOUND", request, env);
    if (bounty.state !== "OPEN") {
      return errorResponse("This bounty is not accepting new subscriptions", 409, "SUBSCRIPTION_LOCKED", request, env);
    }

    await env.DB.prepare(`
      INSERT INTO bounty_participants (bounty_id, principal_id, joined_at)
      VALUES (?, ?, ?)
      ON CONFLICT DO NOTHING
    `).bind(bountyId, authUser.principal_id, Date.now()).run();

    return jsonResponse({ success: true }, 200, request, env);
  } catch (err: any) {
    return errorResponse(err.message, 500, "DB_ERROR", request, env);
  }
}

async function handleLeaveBounty(request: Request, env: Env): Promise<Response> {
  const authUser = await getAuthenticatedUser(request, env);
  if (!authUser) {
    return errorResponse("Authentication required", 401, "UNAUTHORIZED", request, env);
  }

  try {
    const parts = new URL(request.url).pathname.split("/");
    const bountyId = parts[3];
    const bounty = await env.DB.prepare("SELECT state FROM bounties WHERE id = ?")
      .bind(bountyId)
      .first<{ state: string }>();
    if (!bounty) return errorResponse("Bounty not found", 404, "NOT_FOUND", request, env);
    if (bounty.state !== "OPEN" && bounty.state !== "RUNNING") {
      return errorResponse("Unsubscription is locked for this bounty", 409, "SUBSCRIPTION_LOCKED", request, env);
    }

    await env.DB.prepare(
      "DELETE FROM bounty_participants WHERE bounty_id = ? AND principal_id = ?",
    ).bind(bountyId, authUser.principal_id).run();
    return jsonResponse({ success: true }, 200, request, env);
  } catch (err: any) {
    return errorResponse(err.message, 500, "DB_ERROR", request, env);
  }
}


async function handleUploadMedia(request: Request, env: Env): Promise<Response> {
  const authUser = await getAuthenticatedUser(request, env);
  if (!authUser || authUser.role !== "admin") {
    return errorResponse("Admin access required", 403, "FORBIDDEN", request, env);
  }

  const contentType = request.headers.get("content-type") || "";

  try {
    let fileBuffer: ArrayBuffer;
    let mimeType = "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;

      if (!file) {
        return errorResponse("No file uploaded", 400, "MISSING_FILE", request, env);
      }

      fileBuffer = await file.arrayBuffer();
      mimeType = file.type;
    } else {
      fileBuffer = await request.arrayBuffer();
      mimeType = contentType;
    }

    if (!mimeType.startsWith("image/") && mimeType !== "video/mp4") {
      return errorResponse("Unsupported file type", 400, "INVALID_FILE", request, env);
    }

    if (fileBuffer.byteLength > 10 * 1024 * 1024) { // 10MB limit
      return errorResponse("File too large", 400, "FILE_TOO_LARGE", request, env);
    }

    const fileHash = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", fileBuffer)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
      .substring(0, 16);
    if (!env.ARTIFACTS) {
      return errorResponse("Artifact storage is not configured", 503, "STORAGE_UNAVAILABLE", request, env);
    }

    const ext = mimeType === "video/mp4" ? "mp4" : mimeType.split("/")[1]?.replace("+xml", "") || "png";
    const objectKey = `bounties/media_${fileHash}.${ext}`;

    await env.ARTIFACTS.put(objectKey, fileBuffer, {
      httpMetadata: { contentType: mimeType },
    });

    const publicUrl = `/api/media/${encodeURIComponent(objectKey)}`;

    return jsonResponse({ success: true, url: publicUrl }, 200, request, env);
  } catch (err: any) {
    return errorResponse(err.message, 500, "UPLOAD_FAILED", request, env);
  }
}
