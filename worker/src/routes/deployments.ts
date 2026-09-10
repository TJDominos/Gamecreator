import type {
  DeploymentManifest,
  DeploymentManifestFile,
  DeploymentRecordRow,
  DeploymentUploadFileRow,
  DeploymentUploadSessionRow,
  Env,
  GameReleasePointerRow,
} from "../types";
import { getAuthenticatedUser } from "../middleware/auth";
import { verifyGithubActionsOidc } from "../middleware/githubOidc";
import { sha256Hex, sha256HexBytes } from "../utils/crypto";
import { gameBaseUrl, privateReleaseUrl } from "../utils/playUrl";
import { errorResponse, jsonResponse } from "../utils/response";

const MAX_MANIFEST_FILES = 5000;
const DEFAULT_MAX_ARTIFACT_BYTES = 25 * 1024 * 1024;

export async function handleDeploymentRoutes(
  request: Request,
  env: Env,
): Promise<Response | null> {
  const url = new URL(request.url);
  const pathname = url.pathname;

  const artifactMatch = pathname.match(/^\/api\/deployments\/([^/]+)\/artifact(?:\/(.*))?$/);
  if (artifactMatch && request.method === "PUT") {
    return handleArtifactUpload(
      decodeURIComponent(artifactMatch[1]),
      decodeURIComponent(artifactMatch[2] || ""),
      request,
      env,
    );
  }

  const deploymentMatch = pathname.match(/^\/api\/deployments\/([^/]+)(\/.*)?$/);
  if (deploymentMatch) {
    const deploymentId = decodeURIComponent(deploymentMatch[1]);
    const subPath = deploymentMatch[2] || "";
    if (request.method === "POST" && subPath === "/upload-session") {
      return handleCreateUploadSession(deploymentId, request, env);
    }
    if (request.method === "POST" && subPath === "/upload-complete") {
      return handleCompleteUpload(deploymentId, request, env);
    }
    if (request.method === "GET" && subPath === "") {
      return handleGetDeployment(deploymentId, request, env);
    }
    if (request.method === "GET" && subPath === "/events") {
      return handleGetDeploymentEvents(deploymentId, request, env);
    }
  }

  const privateReleaseMatch = pathname.match(/^\/api\/games\/([^/]+)\/private-releases(?:\/([^/]+))?$/);
  if (privateReleaseMatch) {
    const gameId = decodeURIComponent(privateReleaseMatch[1]);
    const releaseId = privateReleaseMatch[2] ? decodeURIComponent(privateReleaseMatch[2]) : null;
    if (request.method === "POST" && !releaseId) {
      return handleCreatePrivateRelease(gameId, request, env);
    }
    if (request.method === "DELETE" && releaseId) {
      return handleRevokePrivateRelease(gameId, releaseId, request, env);
    }
  }

  const gameDeploymentsMatch = pathname.match(/^\/api\/games\/([^/]+)\/deployments(?:\/([^/]+))?$/);
  if (gameDeploymentsMatch && request.method === "GET") {
    const gameId = decodeURIComponent(gameDeploymentsMatch[1]);
    const deploymentId = gameDeploymentsMatch[2]
      ? decodeURIComponent(gameDeploymentsMatch[2])
      : null;
    return deploymentId
      ? handleGetGameDeployment(gameId, deploymentId, request, env)
      : handleListGameDeployments(gameId, request, env);
  }

  return null;
}

async function handleCreateUploadSession(
  deploymentId: string,
  request: Request,
  env: Env,
): Promise<Response> {
  if (!env.ARTIFACTS) return errorResponse("Artifact storage is not configured", 503, "R2_NOT_CONFIGURED", request, env);
  const deployment = await getDeployment(deploymentId, env);
  if (!deployment) return errorResponse("Deployment not found", 404, "NOT_FOUND", request, env);

  const body = await request.json().catch(() => null) as {
    commit_sha?: string;
    workflow?: string;
    manifest?: unknown;
  } | null;
  const manifest = parseManifest(body?.manifest, deploymentId, deployment.commit_sha, deployment.build_dir);
  if (!manifest) return errorResponse("Invalid deployment manifest", 400, "INVALID_MANIFEST", request, env);
  if (manifest.total_bytes > getMaxArtifactBytes(env)) {
    return errorResponse("Artifact exceeds the configured size limit", 413, "ARTIFACT_TOO_LARGE", request, env);
  }

  const oidcToken = getBearerToken(request);
  if (!oidcToken) return errorResponse("GitHub OIDC token is required", 401, "OIDC_REQUIRED", request, env);
  try {
    await verifyGithubActionsOidc(oidcToken, env, {
      repository: deployment.repository,
      commitSha: deployment.commit_sha,
      branch: deployment.branch,
      workflow: env.GITHUB_ACTION_WORKFLOW || "randseed-deploy.yml",
    });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : "Invalid GitHub OIDC token", 401, "INVALID_OIDC", request, env);
  }

  if (!["pending", "queued", "building", "uploading"].includes(deployment.status)) {
    return errorResponse("Deployment is not accepting an artifact", 409, "INVALID_DEPLOYMENT_STATE", request, env);
  }

  const now = Date.now();
  const sessionId = `ups_${crypto.randomUUID().replace(/-/g, "")}`;
  const uploadToken = `rs_upload_${crypto.randomUUID().replace(/-/g, "")}`;
  const objectPrefix = `tenants/${safeSegment(deployment.tenant_id)}/games/${safeSegment(deployment.game_id)}/releases/${safeSegment(deployment.commit_sha)}`;
  const tokenHash = await sha256Hex(uploadToken);
  const existingSession = await env.DB.prepare(
    `SELECT * FROM deployment_upload_sessions WHERE deployment_id = ? AND completed_at IS NULL`,
  ).bind(deploymentId).first<DeploymentUploadSessionRow>();
  if (existingSession) {
    return errorResponse("An upload session already exists for this deployment", 409, "UPLOAD_SESSION_EXISTS", request, env);
  }

  const statements = [
    env.DB.prepare(
      `INSERT INTO deployment_upload_sessions
       (id, deployment_id, token_hash, object_prefix, expected_manifest_json, expected_files, expected_bytes, expires_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(
      sessionId,
      deploymentId,
      tokenHash,
      objectPrefix,
      JSON.stringify(manifest),
      manifest.files.length,
      manifest.total_bytes,
      now + 15 * 60 * 1000,
      now,
    ),
    env.DB.prepare(
      `UPDATE deployment_records
       SET status = 'uploading', upload_session_id = ?, artifact_prefix = ?, started_at = COALESCE(started_at, ?)
       WHERE id = ? AND status IN ('pending', 'queued', 'building', 'uploading')`,
    ).bind(sessionId, objectPrefix, now, deploymentId),
  ];
  for (const file of manifest.files) {
    statements.push(env.DB.prepare(
      `INSERT INTO deployment_upload_files
       (session_id, path, expected_sha256, expected_size, object_key)
       VALUES (?, ?, ?, ?, ?)`,
    ).bind(sessionId, file.path, file.sha256, file.size, `${objectPrefix}/${file.path}`));
  }
  await env.DB.batch(statements);

  return jsonResponse({
    success: true,
    deployment_id: deploymentId,
    upload_session_id: sessionId,
    upload_token: uploadToken,
    expires_at: new Date(now + 15 * 60 * 1000).toISOString(),
    upload_base_url: `${new URL(request.url).origin}/api/deployments/${encodeURIComponent(deploymentId)}/artifact`,
  }, 201, request, env);
}

async function handleCreatePrivateRelease(gameId: string, request: Request, env: Env): Promise<Response> {
  const access = await authorizeGameAccess(gameId, request, env);
  if (!access.ok) return access.response;

  const body = await request.json().catch(() => null) as { deployment_id?: string; expires_in_days?: number | null } | null;
  if (!body?.deployment_id) return errorResponse("A deployment_id is required", 400, "MISSING_DEPLOYMENT_ID", request, env);

  const deployment = await env.DB.prepare(
    `SELECT * FROM deployment_records WHERE id = ? AND game_id = ? AND status = 'published'`,
  ).bind(body.deployment_id, gameId).first<DeploymentRecordRow>();
  if (!deployment) return errorResponse("Only a published deployment can be shared", 409, "DEPLOYMENT_NOT_PUBLISHED", request, env);

  const user = await getAuthenticatedUser(request, env);
  if (!user) return errorResponse("Authentication required", 401, "UNAUTHORIZED", request, env);
  const days = body.expires_in_days === null ? null : Number(body.expires_in_days ?? 7);
  if (days !== null && (!Number.isInteger(days) || days < 1 || days > 30)) {
    return errorResponse("Private release expiry must be between 1 and 30 days", 400, "INVALID_EXPIRY", request, env);
  }

  const token = `rs_private_${crypto.randomUUID().replace(/-/g, "")}`;
  const releaseId = `pr_${crypto.randomUUID().replace(/-/g, "")}`;
  const now = Date.now();
  const expiresAt = days === null ? null : now + days * 24 * 60 * 60 * 1000;
  await env.DB.prepare(
    `INSERT INTO private_releases
     (id, tenant_id, game_id, deployment_id, token_hash, expires_at, created_by, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).bind(
    releaseId,
    deployment.tenant_id,
    gameId,
    deployment.id,
    await sha256Hex(token),
    expiresAt,
    user.principal_id,
    now,
  ).run();

  return jsonResponse({
    success: true,
    release_id: releaseId,
    deployment_id: deployment.id,
    expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
    url: privateReleaseUrl(env, gameId, token),
  }, 201, request, env);
}

async function handleRevokePrivateRelease(
  gameId: string,
  releaseId: string,
  request: Request,
  env: Env,
): Promise<Response> {
  const access = await authorizeGameAccess(gameId, request, env);
  if (!access.ok) return access.response;
  const result = await env.DB.prepare(
    `UPDATE private_releases SET revoked_at = ?
     WHERE id = ? AND game_id = ? AND revoked_at IS NULL`,
  ).bind(Date.now(), releaseId, gameId).run();
  if (!result.meta.changes) return errorResponse("Private release not found", 404, "NOT_FOUND", request, env);
  return jsonResponse({ success: true, release_id: releaseId, revoked: true }, 200, request, env);
}

async function handleArtifactUpload(
  deploymentId: string,
  filePath: string,
  request: Request,
  env: Env,
): Promise<Response> {
  if (!env.ARTIFACTS) return errorResponse("Artifact storage is not configured", 503, "R2_NOT_CONFIGURED", request, env);
  const token = getBearerToken(request);
  const path = normalizeFilePath(filePath);
  if (!token || !path) return errorResponse("Upload token and file path are required", 401, "UPLOAD_AUTH_REQUIRED", request, env);

  const session = await env.DB.prepare(
    `SELECT s.* FROM deployment_upload_sessions s
     JOIN deployment_records d ON d.id = s.deployment_id
     WHERE s.deployment_id = ? AND s.token_hash = ? AND s.completed_at IS NULL
       AND s.expires_at > ? AND d.status = 'uploading'`,
  ).bind(deploymentId, await sha256Hex(token), Date.now()).first<DeploymentUploadSessionRow>();
  if (!session) return errorResponse("Upload session is invalid or expired", 401, "INVALID_UPLOAD_TOKEN", request, env);

  const file = await env.DB.prepare(
    `SELECT * FROM deployment_upload_files WHERE session_id = ? AND path = ?`,
  ).bind(session.id, path).first<DeploymentUploadFileRow>();
  if (!file) return errorResponse("File is not part of the deployment manifest", 403, "FILE_NOT_DECLARED", request, env);
  const contentLength = Number(request.headers.get("Content-Length"));
  if (!Number.isSafeInteger(contentLength) || contentLength !== file.expected_size) {
    return errorResponse("Uploaded file size does not match the manifest", 400, "SIZE_MISMATCH", request, env);
  }

  try {
    await env.ARTIFACTS.put(file.object_key, request.body, {
      sha256: hexToBytes(file.expected_sha256),
      httpMetadata: { contentType: contentTypeForPath(path) },
      customMetadata: { deployment_id: deploymentId, upload_session_id: session.id },
    });
    await env.DB.prepare(
      `UPDATE deployment_upload_files SET uploaded_at = ? WHERE session_id = ? AND path = ? AND uploaded_at IS NULL`,
    ).bind(Date.now(), session.id, path).run();
    return jsonResponse({ success: true, path }, 200, request, env);
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : "Artifact upload failed", 400, "UPLOAD_FAILED", request, env);
  }
}

async function handleCompleteUpload(
  deploymentId: string,
  request: Request,
  env: Env,
): Promise<Response> {
  if (!env.ARTIFACTS) return errorResponse("Artifact storage is not configured", 503, "R2_NOT_CONFIGURED", request, env);
  const deployment = await getDeployment(deploymentId, env);
  if (!deployment) return errorResponse("Deployment not found", 404, "NOT_FOUND", request, env);
  const body = await request.json().catch(() => null) as { manifest?: unknown; workflow?: string } | null;
  const manifest = parseManifest(body?.manifest, deploymentId, deployment.commit_sha, deployment.build_dir);
  const oidcToken = getBearerToken(request);
  if (!manifest || !oidcToken) return errorResponse("Manifest and GitHub OIDC token are required", 400, "INVALID_COMPLETION", request, env);
  try {
    await verifyGithubActionsOidc(oidcToken, env, {
      repository: deployment.repository,
      commitSha: deployment.commit_sha,
      branch: deployment.branch,
      workflow: env.GITHUB_ACTION_WORKFLOW || "randseed-deploy.yml",
    });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : "Invalid GitHub OIDC token", 401, "INVALID_OIDC", request, env);
  }

  const session = await env.DB.prepare(
    `SELECT * FROM deployment_upload_sessions WHERE deployment_id = ? AND completed_at IS NULL`,
  ).bind(deploymentId).first<DeploymentUploadSessionRow>();
  if (!session || Date.now() > session.expires_at) return errorResponse("Upload session is invalid or expired", 409, "INVALID_UPLOAD_SESSION", request, env);
  const expectedManifest = parseManifest(
    JSON.parse(session.expected_manifest_json),
    deploymentId,
    deployment.commit_sha,
    deployment.build_dir,
  );
  if (!expectedManifest || JSON.stringify(expectedManifest) !== JSON.stringify(manifest)) {
    return errorResponse("Completion manifest does not match the authorized manifest", 400, "MANIFEST_MISMATCH", request, env);
  }

  const files = await env.DB.prepare(
    `SELECT * FROM deployment_upload_files WHERE session_id = ?`,
  ).bind(session.id).all<DeploymentUploadFileRow>();
  if (files.results.length !== manifest.files.length || files.results.some((file) => !file.uploaded_at)) {
    return errorResponse("Not all manifest files have been uploaded", 409, "FILES_MISSING", request, env);
  }

  for (const file of files.results) {
    const object = await env.ARTIFACTS.head(file.object_key);
    if (!object || object.size !== file.expected_size) {
      return errorResponse(`Artifact verification failed for ${file.path}`, 400, "ARTIFACT_VERIFICATION_FAILED", request, env);
    }
    const actualChecksum = object.checksums.sha256
      ? arrayBufferToHex(object.checksums.sha256)
      : await hashR2Object(env, file.object_key);
    if (actualChecksum !== file.expected_sha256) {
      return errorResponse(`Artifact checksum mismatch for ${file.path}`, 400, "CHECKSUM_MISMATCH", request, env);
    }
  }

  const now = Date.now();
  const manifestChecksum = await sha256Hex(JSON.stringify(manifest));
  const verified = await env.DB.prepare(
    `UPDATE deployment_records SET status = 'publishing', artifact_sha256 = ?, artifact_size = ?, uploaded_at = ?
     WHERE id = ? AND status = 'uploading'`,
  ).bind(manifestChecksum, manifest.total_bytes, now, deploymentId).run();
  if (!verified.meta.changes) return errorResponse("Deployment is no longer publishable", 409, "DEPLOYMENT_RACE", request, env);

  const newer = await env.DB.prepare(
    `SELECT id FROM deployment_records
     WHERE game_id = ? AND created_at > ? AND status NOT IN ('failed', 'cancelled', 'superseded')
     LIMIT 1`,
  ).bind(deployment.game_id, deployment.created_at).first<{ id: string }>();
  if (newer) {
    await markDeploymentFailedOrSuperseded(deploymentId, "superseded", "NEWER_DEPLOYMENT", "A newer deployment exists", env);
    return errorResponse("A newer deployment has superseded this build", 409, "SUPERSEDED", request, env);
  }

  const published = await publishDeployment(deployment, session, manifestChecksum, now, env);
  if (!published) return errorResponse("Deployment lost the publish race", 409, "PUBLISH_RACE", request, env);
  await env.DB.prepare(`UPDATE deployment_upload_sessions SET completed_at = ? WHERE id = ? AND completed_at IS NULL`)
    .bind(now, session.id).run();

  return jsonResponse({
    success: true,
    deployment_id: deploymentId,
    status: "published",
    live_url: gameBaseUrl(env, deployment.game_id),
  }, 200, request, env);
}

async function publishDeployment(
  deployment: DeploymentRecordRow,
  session: DeploymentUploadSessionRow,
  manifestChecksum: string,
  now: number,
  env: Env,
): Promise<boolean> {
  const current = await env.DB.prepare(`SELECT * FROM game_release_pointers WHERE game_id = ?`)
    .bind(deployment.game_id).first<GameReleasePointerRow>();
  let previous = current;
  if (!current) {
    const inserted = await env.DB.prepare(
      `INSERT OR IGNORE INTO game_release_pointers (game_id, active_deployment_id, artifact_prefix, version, updated_at)
       VALUES (?, ?, ?, 1, ?)`,
    ).bind(deployment.game_id, deployment.id, session.object_prefix, now).run();
    if (!inserted.meta.changes) {
      previous = await env.DB.prepare(`SELECT * FROM game_release_pointers WHERE game_id = ?`)
        .bind(deployment.game_id).first<GameReleasePointerRow>();
      if (!previous) return false;
      const active = await env.DB.prepare(`SELECT created_at FROM deployment_records WHERE id = ?`)
        .bind(previous.active_deployment_id).first<{ created_at: number }>();
      if (active && active.created_at >= deployment.created_at) return false;
      const result = await env.DB.prepare(
        `UPDATE game_release_pointers
         SET active_deployment_id = ?, artifact_prefix = ?, version = version + 1, updated_at = ?
         WHERE game_id = ? AND version = ? AND active_deployment_id = ?`,
      ).bind(deployment.id, session.object_prefix, now, deployment.game_id, previous.version, previous.active_deployment_id).run();
      if (!result.meta.changes) return false;
    }
  } else {
    const active = await env.DB.prepare(`SELECT created_at FROM deployment_records WHERE id = ?`)
      .bind(current.active_deployment_id).first<{ created_at: number }>();
    if (active && active.created_at >= deployment.created_at) return false;
    const result = await env.DB.prepare(
      `UPDATE game_release_pointers
       SET active_deployment_id = ?, artifact_prefix = ?, version = version + 1, updated_at = ?
       WHERE game_id = ? AND version = ? AND active_deployment_id = ?`,
    ).bind(deployment.id, session.object_prefix, now, deployment.game_id, current.version, current.active_deployment_id).run();
    if (!result.meta.changes) return false;
  }

  const updated = await env.DB.prepare(
    `UPDATE deployment_records SET status = 'published', published_at = ?, finished_at = ?, live_url = ?, artifact_sha256 = ?
     WHERE id = ? AND status = 'publishing' AND commit_sha = ?
       AND EXISTS (
         SELECT 1 FROM game_release_pointers
         WHERE game_id = ? AND active_deployment_id = ?
       )`,
  ).bind(
    now,
    now,
    gameBaseUrl(env, deployment.game_id),
    manifestChecksum,
    deployment.id,
    deployment.commit_sha,
    deployment.game_id,
    deployment.id,
  ).run();
  if (!updated.meta.changes) {
    if (previous) {
      await env.DB.prepare(
        `UPDATE game_release_pointers
         SET active_deployment_id = ?, artifact_prefix = ?, version = ?, updated_at = ?
         WHERE game_id = ? AND active_deployment_id = ? AND version = ?`,
      ).bind(
        previous.active_deployment_id,
        previous.artifact_prefix,
        previous.version,
        previous.updated_at,
        deployment.game_id,
        deployment.id,
        previous.version + 1,
      ).run();
    } else {
      await env.DB.prepare(`DELETE FROM game_release_pointers WHERE game_id = ? AND active_deployment_id = ?`)
        .bind(deployment.game_id, deployment.id).run();
    }
    return false;
  }
  await env.DB.prepare(
    `UPDATE game_repo_bindings
     SET last_synced_commit = ?, last_commit_message = ?, last_synced_at = ?, sync_status = 'synced', updated_at = ?
     WHERE game_id = ?`,
  ).bind(deployment.commit_sha, deployment.commit_message || "", now, now, deployment.game_id).run();
  return true;
}

async function handleListGameDeployments(gameId: string, request: Request, env: Env): Promise<Response> {
  const access = await authorizeGameAccess(gameId, request, env);
  if (!access.ok) return access.response;
  const result = await env.DB.prepare(
    `SELECT * FROM deployment_records WHERE game_id = ? ORDER BY created_at DESC LIMIT 100`,
  ).bind(gameId).all<DeploymentRecordRow>();
  return jsonResponse({ success: true, deployments: result.results }, 200, request, env);
}

async function handleGetGameDeployment(gameId: string, deploymentId: string, request: Request, env: Env): Promise<Response> {
  const access = await authorizeGameAccess(gameId, request, env);
  if (!access.ok) return access.response;
  const deployment = await env.DB.prepare(
    `SELECT * FROM deployment_records WHERE game_id = ? AND id = ?`,
  ).bind(gameId, deploymentId).first<DeploymentRecordRow>();
  if (!deployment) return errorResponse("Deployment not found", 404, "NOT_FOUND", request, env);
  return jsonResponse({ success: true, deployment }, 200, request, env);
}

async function handleGetDeployment(deploymentId: string, request: Request, env: Env): Promise<Response> {
  const deployment = await getDeployment(deploymentId, env);
  if (!deployment) return errorResponse("Deployment not found", 404, "NOT_FOUND", request, env);
  const access = await authorizeGameAccess(deployment.game_id, request, env);
  if (!access.ok) return access.response;
  return jsonResponse({ success: true, deployment }, 200, request, env);
}

async function handleGetDeploymentEvents(deploymentId: string, request: Request, env: Env): Promise<Response> {
  const deployment = await getDeployment(deploymentId, env);
  if (!deployment) return errorResponse("Deployment not found", 404, "NOT_FOUND", request, env);
  const access = await authorizeGameAccess(deployment.game_id, request, env);
  if (!access.ok) return access.response;
  const events = await env.DB.prepare(
    `SELECT delivery_id, event_name, payload_sha256, created_at FROM deployment_events WHERE deployment_id = ? ORDER BY created_at ASC`,
  ).bind(deploymentId).all();
  return jsonResponse({ success: true, events: events.results }, 200, request, env);
}

async function authorizeGameAccess(gameId: string, request: Request, env: Env): Promise<{ ok: true } | { ok: false; response: Response }> {
  const user = await getAuthenticatedUser(request, env);
  if (!user) return { ok: false, response: errorResponse("Authentication required", 401, "UNAUTHORIZED", request, env) };
  const binding = await env.DB.prepare(
    `SELECT i.owner_principal FROM game_repo_bindings b
     JOIN github_installations i ON i.installation_id = b.installation_id
     WHERE b.game_id = ?`,
  ).bind(gameId).first<{ owner_principal: string }>();
  if (!binding || (binding.owner_principal !== user.principal_id && user.role !== "admin")) {
    return { ok: false, response: errorResponse("You do not have access to this game", 403, "FORBIDDEN", request, env) };
  }
  return { ok: true };
}

async function getDeployment(deploymentId: string, env: Env): Promise<DeploymentRecordRow | null> {
  return env.DB.prepare(`SELECT * FROM deployment_records WHERE id = ?`).bind(deploymentId).first<DeploymentRecordRow>();
}

function getBearerToken(request: Request): string | null {
  const value = request.headers.get("Authorization");
  return value?.startsWith("Bearer ") ? value.slice(7).trim() || null : null;
}

function parseManifest(value: unknown, deploymentId: string, commitSha: string, buildDir: string): DeploymentManifest | null {
  if (!value || typeof value !== "object") return null;
  const body = value as Partial<DeploymentManifest>;
  if (body.deployment_id !== deploymentId || body.commit_sha !== commitSha || body.root !== buildDir || !Array.isArray(body.files)) return null;
  if (body.files.length === 0 || body.files.length > MAX_MANIFEST_FILES || !Number.isSafeInteger(body.total_bytes) || body.total_bytes < 0) return null;
  const paths = new Set<string>();
  const files: DeploymentManifestFile[] = [];
  for (const entry of body.files) {
    if (!entry || typeof entry !== "object") return null;
    const file = entry as Partial<DeploymentManifestFile>;
    const path = normalizeFilePath(file.path || "");
    if (!path || paths.has(path) || !/^[a-f0-9]{64}$/.test(file.sha256 || "") || !Number.isSafeInteger(file.size) || (file.size || 0) < 0) return null;
    paths.add(path);
    files.push({ path, sha256: file.sha256!, size: file.size! });
  }
  const total = files.reduce((sum, file) => sum + file.size, 0);
  if (total !== body.total_bytes) return null;
  return { deployment_id: deploymentId, commit_sha: commitSha, root: buildDir, files, total_bytes: total };
}

function normalizeFilePath(path: string): string | null {
  if (!path || path.includes("\\") || path.startsWith("/") || path.split("/").some((part) => !part || part === "." || part === "..")) return null;
  return path.length <= 512 ? path : null;
}

function safeSegment(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 120) || "unknown";
}

function getMaxArtifactBytes(env: Env): number {
  const configured = Number(env.MAX_ARTIFACT_BYTES);
  return Number.isSafeInteger(configured) && configured > 0 ? configured : DEFAULT_MAX_ARTIFACT_BYTES;
}

function hexToBytes(hex: string): ArrayBuffer {
  const bytes = new Uint8Array(hex.length / 2);
  for (let index = 0; index < bytes.length; index += 1) bytes[index] = parseInt(hex.slice(index * 2, index * 2 + 2), 16);
  return bytes.buffer;
}

function arrayBufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function hashR2Object(env: Env, key: string): Promise<string> {
  const object = await env.ARTIFACTS!.get(key);
  if (!object) throw new Error("Artifact disappeared during verification");
  return sha256HexBytes(await object.arrayBuffer());
}

function contentTypeForPath(path: string): string {
  const extension = path.split(".").pop()?.toLowerCase();
  return ({
    html: "text/html; charset=utf-8",
    css: "text/css; charset=utf-8",
    js: "text/javascript; charset=utf-8",
    json: "application/json; charset=utf-8",
    svg: "image/svg+xml",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    webp: "image/webp",
    ico: "image/x-icon",
    woff: "font/woff",
    woff2: "font/woff2",
  } as Record<string, string>)[extension || ""] || "application/octet-stream";
}

async function markDeploymentFailedOrSuperseded(
  deploymentId: string,
  status: "failed" | "superseded",
  code: string,
  message: string,
  env: Env,
): Promise<void> {
  await env.DB.prepare(
    `UPDATE deployment_records SET status = ?, error_code = ?, error_message = ?, finished_at = ?
     WHERE id = ? AND status NOT IN ('published', 'failed', 'cancelled', 'superseded')`,
  ).bind(status, code, message, Date.now(), deploymentId).run();
}