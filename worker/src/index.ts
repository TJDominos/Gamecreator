/// <reference types="@cloudflare/workers-types" />

import type { Env } from "./types";
import { errorResponse, handleOptionsRequest, jsonResponse } from "./utils/response";
import { handleAuthRoutes } from "./routes/auth";
import { handleOrganizationRoutes } from "./routes/organizations";
import { handleGitHubRoutes } from "./routes/github";
import { handleDeploymentRoutes } from "./routes/deployments";
import { handleGameRoutes } from "./routes/games";
import { handleAdminRoutes } from "./routes/admin";
import { handleBountyPageRequest, handleBountyRoutes } from "./routes/bounties";

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    // 1. Handle CORS preflight
    if (request.method === "OPTIONS") {
      return handleOptionsRequest(request, env);
    }

    try {
      const url = new URL(request.url);

      if (url.pathname === "/sandbox" || url.pathname.startsWith("/sandbox/")) {
        return new Response("Game content is served from the play domain", { status: 404 });
      }

      // Health check endpoint
      if (url.pathname === "/api/health" || url.pathname === "/health") {
        return jsonResponse(
          {
            status: "ok",
            service: "randseed-gamecreator-worker",
            time: new Date().toISOString(),
          },
          200,
          request,
          env,
        );
      }

      const bountyPageRes = await handleBountyPageRequest(request, env);
      if (bountyPageRes) return bountyPageRes;

      // 2. Dispatch to modular route handlers
      const bountyRes = await handleBountyRoutes(request, env);
      if (bountyRes) return bountyRes;

      const adminRes = await handleAdminRoutes(request, env);
      if (adminRes) return adminRes;

      const authRes = await handleAuthRoutes(request, env);
      if (authRes) return authRes;

      const orgRes = await handleOrganizationRoutes(request, env);
      if (orgRes) return orgRes;

      const deploymentRes = await handleDeploymentRoutes(request, env);
      if (deploymentRes) return deploymentRes;

      const ghRes = await handleGitHubRoutes(request, env);
      if (ghRes) return ghRes;

      const gameRes = await handleGameRoutes(request, env);
      if (gameRes) return gameRes;

      // 3. Fallback to Creator Portal static assets (Vite React SPA)
      if (
        env.ASSETS &&
        (request.method === "GET" || request.method === "HEAD") &&
        !(url.pathname === "/api" || url.pathname.startsWith("/api/"))
      ) {
        return await env.ASSETS.fetch(request);
      }

      // 4. Fallback 404 for unmatched API routes
      return errorResponse(`Route not found: ${request.method} ${url.pathname}`, 404, "NOT_FOUND", request, env);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Internal Server Error";
      return errorResponse(message, 500, "INTERNAL_ERROR", request, env);
    }
  },
} satisfies ExportedHandler<Env>;
