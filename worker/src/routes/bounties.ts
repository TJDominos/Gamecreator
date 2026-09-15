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
  if (url.pathname.startsWith("/api/admin/bounties/") && request.method === "PUT") {
    return handleUpdateBounty(request, env);
  }
  if (url.pathname.startsWith("/api/admin/bounties/") && request.method === "DELETE") {
    return handleDeleteBounty(request, env);
  }
  if (url.pathname === "/api/admin/bounties/media" && request.method === "PUT") {
    return handleUploadMedia(request, env);
  }

  // Public/Creator routes
  if (url.pathname === "/api/bounties" && request.method === "GET") {
    return handleListBounties(request, env);
  }
  if (url.pathname.startsWith("/api/bounties/") && url.pathname.endsWith("/participate") && request.method === "POST") {
    return handleParticipate(request, env);
  }
  
  return null;
}

// Generate an ID for new bounties
const generateId = () => 'bty_' + Math.random().toString(36).substr(2, 9);

async function handleAdminListBounties(request: Request, env: Env): Promise<Response> {
  const authUser = await getAuthenticatedUser(request, env);
  if (!authUser || authUser.role !== "admin") {
    return errorResponse("Admin access required", 403, "FORBIDDEN", request, env);
  }

  try {
    const { results: bounties } = await env.DB.prepare(`
      SELECT * FROM bounties ORDER BY created_at DESC
    `).all();

    // Fetch examples and attach them
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

async function handleCreateBounty(request: Request, env: Env): Promise<Response> {
  const authUser = await getAuthenticatedUser(request, env);
  if (!authUser || authUser.role !== "admin") {
    return errorResponse("Admin access required", 403, "FORBIDDEN", request, env);
  }

  try {
    const body: any = await request.json();
    const id = generateId();
    const now = Date.now();

    await env.DB.prepare(`
      INSERT INTO bounties (
        id, title, description, full_description, state, category, 
        prize_pool, currency, tags, deadline, battle_end, video_url, 
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, body.title, body.shortDesc || body.description, body.fullDesc || body.fullDescription, 
      body.state || 'OPEN', body.category, body.poolAmount || body.prizePool, body.currency, 
      JSON.stringify(body.tags || []), body.participationEndDate || body.deadline, 
      body.distributionDate || body.battleEnd, body.videoUrl || null, now, now
    ).run();

    // Insert examples if any
    if (body.examples && Array.isArray(body.examples)) {
      for (const ex of body.examples) {
        await env.DB.prepare(`
          INSERT INTO bounty_examples (id, bounty_id, title, thumbnail, url)
          VALUES (?, ?, ?, ?, ?)
        `).bind(generateId(), id, ex.title || ex.name, ex.thumbnail || ex.thumbnailUrl, ex.url).run();
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

    await env.DB.prepare(`
      UPDATE bounties SET 
        title = ?, description = ?, full_description = ?, state = ?, category = ?, 
        prize_pool = ?, currency = ?, tags = ?, deadline = ?, battle_end = ?, video_url = ?, 
        updated_at = ?
      WHERE id = ?
    `).bind(
      body.title, body.shortDesc || body.description, body.fullDesc || body.fullDescription, 
      body.state, body.category, body.poolAmount || body.prizePool, body.currency, 
      JSON.stringify(body.tags || []), body.participationEndDate || body.deadline, 
      body.distributionDate || body.battleEnd, body.videoUrl || null, now, id
    ).run();

    // Recreate examples (naive approach: delete and insert)
    await env.DB.prepare(`DELETE FROM bounty_examples WHERE bounty_id = ?`).bind(id).run();
    if (body.examples && Array.isArray(body.examples)) {
      for (const ex of body.examples) {
        await env.DB.prepare(`
          INSERT INTO bounty_examples (id, bounty_id, title, thumbnail, url)
          VALUES (?, ?, ?, ?, ?)
        `).bind(generateId(), id, ex.title || ex.name, ex.thumbnail || ex.thumbnailUrl, ex.url).run();
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
    const { results: bounties } = await env.DB.prepare(`
      SELECT * FROM bounties ORDER BY created_at DESC
    `).all();

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

async function handleParticipate(request: Request, env: Env): Promise<Response> {
  const authUser = await getAuthenticatedUser(request, env);
  if (!authUser) {
    return errorResponse("Authentication required", 401, "UNAUTHORIZED", request, env);
  }

  try {
    const url = new URL(request.url);
    const parts = url.pathname.split('/');
    const bountyId = parts[3]; // /api/bounties/:id/participate
    
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
    const ext = mimeType === "video/mp4" ? "mp4" : mimeType.split("/")[1] || "png";
    const objectKey = `bounties/media_${fileHash}.${ext}`;

    await env.R2.put(objectKey, fileBuffer, {
      httpMetadata: { contentType: mimeType },
    });

    const publicUrl = env.STORAGE_PUBLIC_URL 
      ? `${env.STORAGE_PUBLIC_URL}/${objectKey}` 
      : `/${objectKey}`;

    return jsonResponse({ success: true, url: publicUrl }, 200, request, env);
  } catch (err: any) {
    return errorResponse(err.message, 500, "UPLOAD_FAILED", request, env);
  }
}
