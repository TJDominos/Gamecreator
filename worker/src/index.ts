/// <reference types="@cloudflare/workers-types" />

import type { Env } from "./types";
import { errorResponse, handleOptionsRequest, jsonResponse } from "./utils/response";
import { handleAuthRoutes } from "./routes/auth";
import { handleOrganizationRoutes } from "./routes/organizations";
import { handleGitHubRoutes } from "./routes/github";

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

      // 2. Dispatch to modular route handlers
      const authRes = await handleAuthRoutes(request, env);
      if (authRes) return authRes;

      const orgRes = await handleOrganizationRoutes(request, env);
      if (orgRes) return orgRes;

      const ghRes = await handleGitHubRoutes(request, env);
      if (ghRes) return ghRes;

      // 3. Fallback to Frontend static assets (Vite React SPA)
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
