/// <reference types="@cloudflare/workers-types" />

import type { Env } from "./types";
import { errorResponse, handleOptionsRequest, jsonResponse } from "./utils/response";
import { handleAuthRoutes } from "./routes/auth";
import { handleOrganizationRoutes } from "./routes/organizations";

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

      // 2. Dispatch to modular route handlers (SSO & Developer Organizations only)
      const authRes = await handleAuthRoutes(request, env);
      if (authRes) return authRes;

      const orgRes = await handleOrganizationRoutes(request, env);
      if (orgRes) return orgRes;

      // 3. Fallback 404
      return errorResponse(`Route not found: ${request.method} ${url.pathname}`, 404, "NOT_FOUND", request, env);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Internal Server Error";
      return errorResponse(message, 500, "INTERNAL_ERROR", request, env);
    }
  },
} satisfies ExportedHandler<Env>;
