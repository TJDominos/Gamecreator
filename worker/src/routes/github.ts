import type {
  DeploymentRecordRow,
  Env,
  GameDeploymentRow,
  GameRepoBindingRow,
  GithubInstallationRow,
} from "../types";
import { getAuthenticatedUser } from "../middleware/auth";
import { sha256Hex, signJwt, verifyGitHubWebhookSignature, verifyJwt } from "../utils/crypto";
import { dispatchDeploymentWorkflow } from "../utils/githubApp";
import { gameBaseUrl } from "../utils/playUrl";
import { errorResponse, jsonResponse } from "../utils/response";

export async function handleGitHubRoutes(
  request: Request,
  env: Env,
): Promise<Response | null> {
  const url = new URL(request.url);
  const { pathname } = url;
  const method = request.method;

  // 1. GitHub App Installation initiation
  if (method === "GET" && pathname === "/api/github/install") {
    return handleGitHubInstall(request, env);
  }

  // 2. GitHub App Post-Installation Callback
  if (method === "GET" && pathname === "/api/github/callback") {
    return handleGitHubCallback(request, env);
  }

  // 3. GitHub Webhook Receiver
  if (method === "POST" && pathname === "/api/webhooks/github") {
    return handleGitHubWebhook(request, env);
  }

  // 4. Sandbox Deployment API (Called by GitHub Action or CLI)
  if (method === "POST" && pathname === "/api/sandbox/deploy") {
    return handleSandboxDeploy(request, env);
  }

  // 5. Game Repository Binding Operations (/api/games/:gameId/repo/...)
  const repoMatch = pathname.match(/^\/api\/games\/([^/]+)\/repo(\/.*)?$/);
  if (repoMatch) {
    const gameId = decodeURIComponent(repoMatch[1]);
    const subPath = repoMatch[2] || "";

    if (method === "GET" && subPath === "") {
      return handleGetGameRepo(gameId, request, env);
    }
    if (method === "POST" && subPath === "/link") {
      return handleLinkGameRepo(gameId, request, env);
    }
    if (method === "POST" && subPath === "/unlink") {
      return handleUnlinkGameRepo(gameId, request, env);
    }
  }

  // 6. Game Sync Status Check (/api/games/:gameId/sync-status)
  const syncMatch = pathname.match(/^\/api\/games\/([^/]+)\/sync-status$/);
  if (method === "GET" && syncMatch) {
    const gameId = decodeURIComponent(syncMatch[1]);
    return handleCheckSyncStatus(gameId, request, env);
  }

  return null;
}

/**
 * Initiates GitHub App installation by generating the official installation URL
 */
async function handleGitHubInstall(request: Request, env: Env): Promise<Response> {
  const user = await getAuthenticatedUser(request, env);
  if (!user) return errorResponse("Authentication required", 401, "UNAUTHORIZED", request, env);
  const appSlug = env.GITHUB_APP_SLUG || "RDcreatordev";
  const state = await signJwt(
    {
      principal_id: user.principal_id,
      role: user.role,
      email: user.email,
      is_email_verified: user.is_email_verified,
    },
    env.JWT_SECRET,
    10 * 60,
  );
  const installUrl = `https://github.com/apps/${appSlug}/installations/new?state=${encodeURIComponent(state)}`;

  return jsonResponse(
    {
      success: true,
      app_slug: appSlug,
      install_url: installUrl,
    },
    200,
    request,
    env,
  );
}

/**
 * Handles callback from GitHub after installation
 */
async function handleGitHubCallback(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const installationIdStr = url.searchParams.get("installation_id");
  const setupAction = url.searchParams.get("setup_action");
  const state = url.searchParams.get("state") || "";

  if (!installationIdStr) {
    return errorResponse("Missing installation_id in callback", 400, "MISSING_PARAM", request, env);
  }

  const installationId = parseInt(installationIdStr, 10);
  const statePayload = await verifyJwt(state, env.JWT_SECRET);
  if (!statePayload) return errorResponse("Invalid or expired installation state", 400, "INVALID_STATE", request, env);
  const now = Date.now();

  try {
    if (env.DB) {
      // Save or update installation record
      const id = `gh_inst_${installationId}`;
      const ownerPrincipal = statePayload.principal_id;

      await env.DB.prepare(
        `INSERT INTO github_installations (id, installation_id, account_login, account_type, owner_principal, permissions, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(installation_id) DO UPDATE SET
           updated_at = excluded.updated_at`,
      )
        .bind(
          id,
          installationId,
          "Authorized-User",
          "User",
          ownerPrincipal,
          JSON.stringify({ setup_action: setupAction }),
          now,
          now,
        )
        .run();
    }

    // Redirect user back to dashboard or return JSON
    const redirectTarget = `${env.MAIN_SITE_URL || ""}/dashboard/games?github_installed=true&installation_id=${installationId}`;
    return new Response(null, {
      status: 302,
      headers: {
        Location: redirectTarget,
      },
    });
  } catch (err) {
    return errorResponse(
      err instanceof Error ? err.message : "Failed to record installation",
      500,
      "DB_ERROR",
      request,
      env,
    );
  }
}

/**
 * Fetches repository info and sync status for a game
 */
async function handleGetGameRepo(gameId: string, request: Request, env: Env): Promise<Response> {
  const user = await getAuthenticatedUser(request, env);
  if (!user) return errorResponse("Authentication required", 401, "UNAUTHORIZED", request, env);

  try {
    if (env.DB) {
      const binding = await env.DB.prepare(
        `SELECT * FROM game_repo_bindings WHERE game_id = ?`,
      )
        .bind(gameId)
        .first<GameRepoBindingRow>();

      if (binding) {
        const owner = await env.DB.prepare(
          `SELECT owner_principal FROM github_installations WHERE installation_id = ?`,
        ).bind(binding.installation_id).first<{ owner_principal: string }>();
        if (!owner || (owner.owner_principal !== user.principal_id && user.role !== "admin")) {
          return errorResponse("You do not have access to this game", 403, "FORBIDDEN", request, env);
        }
        return jsonResponse(
          {
            success: true,
            repo_info: {
              repository: binding.repo_full_name,
              branch: binding.default_branch,
              lastCommitSha: binding.last_synced_commit || "init",
              lastCommitMessage: binding.last_commit_message || "Ready for deployments",
              lastSyncedAt: binding.last_synced_at ? new Date(binding.last_synced_at).toISOString() : "Never",
              isSynced: binding.sync_status === "synced",
              syncMethod: binding.sync_method,
              sandboxUrl: gameBaseUrl(env, gameId),
            },
          },
          200,
          request,
          env,
        );
      }
    }

    return errorResponse("No GitHub repository is connected to this game", 404, "NOT_FOUND", request, env);
  } catch (err) {
    return errorResponse(
      err instanceof Error ? err.message : "Failed to retrieve game repo info",
      500,
      "DB_ERROR",
      request,
      env,
    );
  }
}

/**
 * Links a repository to a game and generates an automated deploy API token
 */
async function handleLinkGameRepo(gameId: string, request: Request, env: Env): Promise<Response> {
  const user = await getAuthenticatedUser(request, env);
  if (!user) return errorResponse("Authentication required", 401, "UNAUTHORIZED", request, env);
  const ownerPrincipal = user.principal_id;

  const body = (await request.json().catch(() => null)) as {
    repository?: string;
    branch?: string;
    installation_id?: number;
    build_dir?: string;
  } | null;

  if (!body || !body.repository) {
    return errorResponse("Missing required 'repository' parameter (owner/repo)", 400, "MISSING_PARAM", request, env);
  }

  const repository = body.repository.trim();
  const branch = (body.branch || "main").trim();
  const installationId = body.installation_id;
  const buildDir = normalizeBuildDir((body.build_dir || "dist").trim().replace(/^\/+|\/+$/g, ""));
  const now = Date.now();

  if (!/^[^/\s]+\/[^/\s]+$/.test(repository) || !/^[A-Za-z0-9._/-]+$/.test(branch) || !buildDir) {
    return errorResponse("Repository, branch, or build directory is invalid", 400, "INVALID_REPOSITORY", request, env);
  }

  if (!installationId) {
    return errorResponse("Missing required 'installation_id' parameter", 400, "MISSING_INSTALLATION_ID", request, env);
  }
  const installation = await env.DB.prepare(
    `SELECT installation_id FROM github_installations WHERE installation_id = ? AND owner_principal = ?`,
  ).bind(installationId, ownerPrincipal).first<{ installation_id: number }>();
  if (!installation) return errorResponse("GitHub installation is not owned by the authenticated creator", 403, "FORBIDDEN", request, env);

  const tokenHash = await sha256Hex(`oidc-only:${crypto.randomUUID()}`);
  const sandboxUrl = gameBaseUrl(env, gameId);

  try {
    if (env.DB) {
      await env.DB.prepare(
        `INSERT INTO game_repo_bindings (
           game_id, installation_id, repo_full_name, default_branch, sync_token_hash,
           sync_method, sync_status, last_synced_commit, last_commit_message,
           last_synced_at, sandbox_url, build_dir, created_at, updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(game_id) DO UPDATE SET
           repo_full_name = excluded.repo_full_name,
           default_branch = excluded.default_branch,
           sync_token_hash = excluded.sync_token_hash,
           build_dir = excluded.build_dir,
           updated_at = excluded.updated_at`,
      )
        .bind(
          gameId,
          installationId,
          repository,
          branch,
          tokenHash,
          "github_action",
          "synced",
          "init-head",
          "Linked via RandSeed Developer Portal",
          now,
          sandboxUrl,
          buildDir,
          now,
          now,
        )
        .run();
    }

    return jsonResponse(
      {
        success: true,
        message: "Repository successfully linked!",
        binding: {
          game_id: gameId,
          repository,
          branch,
          sandbox_url: sandboxUrl,
          deployment_auth: "github_actions_oidc",
        },
      },
      200,
      request,
      env,
    );
  } catch (err) {
    return errorResponse(
      err instanceof Error ? err.message : "Failed to link repository",
      500,
      "DB_ERROR",
      request,
      env,
    );
  }
}

/**
 * Disconnects/unlinks a repository from a game
 */
async function handleUnlinkGameRepo(gameId: string, request: Request, env: Env): Promise<Response> {
  const user = await getAuthenticatedUser(request, env);
  if (!user) return errorResponse("Authentication required", 401, "UNAUTHORIZED", request, env);
  const binding = await env.DB.prepare(
    `SELECT i.owner_principal FROM game_repo_bindings b
     JOIN github_installations i ON i.installation_id = b.installation_id
     WHERE b.game_id = ?`,
  ).bind(gameId).first<{ owner_principal: string }>();
  if (!binding || (binding.owner_principal !== user.principal_id && user.role !== "admin")) {
    return errorResponse("You do not have access to this game", 403, "FORBIDDEN", request, env);
  }
  try {
    if (env.DB) {
      await env.DB.prepare(`DELETE FROM game_repo_bindings WHERE game_id = ?`)
        .bind(gameId)
        .run();
    }

    return jsonResponse(
      {
        success: true,
        message: `Repository unlinked from game ${gameId}`,
      },
      200,
      request,
      env,
    );
  } catch (err) {
    return errorResponse(
      err instanceof Error ? err.message : "Failed to unlink repository",
      500,
      "DB_ERROR",
      request,
      env,
    );
  }
}

/**
 * Live verification check of GitHub sync status
 */
async function handleCheckSyncStatus(gameId: string, request: Request, env: Env): Promise<Response> {
  const deployment = await env.DB.prepare(
    `SELECT d.* FROM deployment_records d
     JOIN game_release_pointers p ON p.active_deployment_id = d.id
     WHERE p.game_id = ? AND d.status = 'published'`,
  ).bind(gameId).first<DeploymentRecordRow>();
  const latest = await env.DB.prepare(
    `SELECT id, commit_sha, commit_message, status, created_at
     FROM deployment_records WHERE game_id = ? ORDER BY created_at DESC LIMIT 1`,
  ).bind(gameId).first<{ id: string; commit_sha: string; commit_message: string | null; status: string; created_at: number }>();

  return jsonResponse({
    success: true,
    game_id: gameId,
    is_synced: deployment?.status === "published",
    deployment_id: deployment?.id || latest?.id || null,
    status: deployment?.status || latest?.status || "not_deployed",
    last_synced_at: deployment?.published_at ? new Date(deployment.published_at).toISOString() : null,
    latest_commit: deployment?.commit_sha || latest?.commit_sha || null,
    commit_message: deployment?.commit_message || latest?.commit_message || null,
    sandbox_url: gameBaseUrl(env, gameId),
    message: deployment ? "GitHub & RandSeed Sandbox are currently in sync" : "No published deployment",
  }, 200, request, env);
}

/**
 * Handles incoming GitHub Webhooks with HMAC verification
 */
async function handleGitHubWebhook(request: Request, env: Env): Promise<Response> {
  const signature = request.headers.get("X-Hub-Signature-256");
  const event = request.headers.get("X-GitHub-Event") || "ping";
  const deliveryId = request.headers.get("X-GitHub-Delivery") || "";
  const rawBody = await request.text();

  // 1. Verify HMAC SHA-256 signature
  const isValid = await verifyGitHubWebhookSignature(rawBody, signature, env.GITHUB_WEBHOOK_SECRET);
  if (!isValid) {
    return errorResponse("Invalid webhook signature", 401, "INVALID_SIGNATURE", request, env);
  }

  let payload: Record<string, any>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return errorResponse("Invalid JSON payload", 400, "BAD_JSON", request, env);
  }

  const now = Date.now();
  const eventId = deliveryId || `synthetic_${await sha256Hex(rawBody)}`;
  const existingEvent = await env.DB.prepare(
    `SELECT deployment_id FROM deployment_events WHERE delivery_id = ?`,
  ).bind(eventId).first<{ deployment_id: string | null }>();
  if (existingEvent) {
    return jsonResponse({ received: true, event, duplicate: true, deployment_id: existingEvent.deployment_id }, 200, request, env);
  }

  let deployment: DeploymentRecordRow | null = null;
  if (event === "push") {
    deployment = await createPendingDeployment(payload, eventId, request, env);
    if (deployment) {
      try {
        await dispatchDeploymentWorkflow(env, {
          installationId: deployment.installation_id,
          repository: deployment.repository,
          branch: deployment.branch,
          deploymentId: deployment.id,
          commitSha: deployment.commit_sha,
          gameId: deployment.game_id,
        });
        await env.DB.prepare(
          `UPDATE deployment_records SET status = 'queued' WHERE id = ? AND status = 'pending'`,
        ).bind(deployment.id).run();
      } catch (error) {
        await env.DB.prepare(
          `UPDATE deployment_records SET status = 'failed', error_code = 'WORKFLOW_DISPATCH_FAILED', error_message = ?, finished_at = ?
           WHERE id = ? AND status = 'pending'`,
        ).bind(error instanceof Error ? error.message : "Workflow dispatch failed", now, deployment.id).run();
      }
    }
  } else if (event === "workflow_job" || event === "workflow_run") {
    deployment = await advanceWorkflowDeployment(payload, event, env);
  }

  await env.DB.prepare(
    `INSERT INTO deployment_events (delivery_id, deployment_id, event_name, payload_sha256, created_at)
     VALUES (?, ?, ?, ?, ?)`,
  ).bind(eventId, deployment?.id || null, event, await sha256Hex(rawBody), now).run();

  return jsonResponse({
    received: true,
    event,
    deployment_id: deployment?.id || null,
    status: deployment ? (await getDeploymentStatus(deployment.id, env)) : "ignored",
  }, deployment ? 202 : 200, request, env);
}

async function createPendingDeployment(
  payload: Record<string, any>,
  deliveryId: string,
  request: Request,
  env: Env,
): Promise<DeploymentRecordRow | null> {
  const repository = payload.repository?.full_name;
  const branch = String(payload.ref || "").replace(/^refs\/heads\//, "");
  const commitSha = payload.head_commit?.id || payload.after;
  if (!repository || !branch || !/^[a-f0-9]{40}$/i.test(commitSha || "")) return null;

  const binding = await env.DB.prepare(
    `SELECT b.*, i.owner_principal FROM game_repo_bindings b
     JOIN github_installations i ON i.installation_id = b.installation_id
     WHERE b.repo_full_name = ? AND b.default_branch = ?`,
  ).bind(repository, branch).first<GameRepoBindingRow & { owner_principal: string }>();
  if (!binding) return null;

  const existing = await env.DB.prepare(
    `SELECT * FROM deployment_records WHERE game_id = ? AND commit_sha = ?`,
  ).bind(binding.game_id, commitSha).first<DeploymentRecordRow>();
  if (existing) return existing;

  const now = Date.now();
  const deploymentId = `dep_${crypto.randomUUID().replace(/-/g, "")}`;
  await env.DB.batch([
    env.DB.prepare(
      `UPDATE deployment_records
       SET status = 'superseded', error_code = 'NEWER_COMMIT', error_message = 'Superseded by a newer push', finished_at = ?
       WHERE game_id = ? AND status IN ('pending', 'queued', 'building', 'uploading')`,
    ).bind(now, binding.game_id),
    env.DB.prepare(
      `INSERT INTO deployment_records
      (id, tenant_id, game_id, repository, installation_id, branch, build_dir, commit_sha, commit_message, github_delivery_id, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
    ).bind(
      deploymentId,
      binding.owner_principal,
      binding.game_id,
      repository,
      binding.installation_id,
      branch,
      binding.build_dir,
      commitSha,
      payload.head_commit?.message || null,
      deliveryId,
      now,
    ),
  ]);
  const deployment = await env.DB.prepare(`SELECT * FROM deployment_records WHERE id = ?`)
    .bind(deploymentId).first<DeploymentRecordRow>();
  if (!deployment) throw new Error(`Failed to create deployment for ${request.url}`);
  return deployment;
}

async function advanceWorkflowDeployment(
  payload: Record<string, any>,
  event: string,
  env: Env,
): Promise<DeploymentRecordRow | null> {
  const workflow = event === "workflow_job" ? payload.workflow_job : payload.workflow_run;
  const repository = payload.repository?.full_name;
  const commitSha = workflow?.head_sha;
  if (!repository || !commitSha) return null;
  const deployment = await env.DB.prepare(
    `SELECT * FROM deployment_records WHERE repository = ? AND commit_sha = ? ORDER BY created_at DESC LIMIT 1`,
  ).bind(repository, commitSha).first<DeploymentRecordRow>();
  if (!deployment) return null;

  const action = workflow?.status || payload.action;
  const conclusion = workflow?.conclusion;
  let status: string | null = null;
  if (conclusion && conclusion !== "success") status = conclusion === "cancelled" ? "cancelled" : "failed";
  else if (action === "queued" || action === "in_progress") status = "building";
  if (status) {
    await env.DB.prepare(
      `UPDATE deployment_records SET status = ?, started_at = COALESCE(started_at, ?), github_run_id = ?, workflow_run_attempt = ?
       WHERE id = ? AND status IN ('pending', 'queued', 'building')`,
    ).bind(
      status,
      Date.now(),
      String(workflow?.run_id || workflow?.id || "") || null,
      Number(workflow?.run_attempt) || null,
      deployment.id,
    ).run();
  }
  return deployment;
}

async function getDeploymentStatus(deploymentId: string, env: Env): Promise<string> {
  const result = await env.DB.prepare(`SELECT status FROM deployment_records WHERE id = ?`)
    .bind(deploymentId).first<{ status: string }>();
  return result?.status || "unknown";
}

function normalizeBuildDir(value: string): string | null {
  if (
    value.length > 128 ||
    value.includes("\\") ||
    value.startsWith("/") ||
    value.split("/").some((part) => !part || part === "." || part === "..")
  ) {
    return null;
  }
  return value;
}

/**
 * Handles deployment push from the GitHub Action sandbox-deploy-action
 */
async function handleSandboxDeploy(request: Request, env: Env): Promise<Response> {
  return errorResponse(
    "Legacy deployment tokens are disabled; use GitHub Actions OIDC and the deployment upload API",
    410,
    "LEGACY_DEPLOY_DISABLED",
    request,
    env,
  );
}
