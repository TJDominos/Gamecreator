/// <reference types="@cloudflare/workers-types" />

import type { PlayEnv } from "./types";
import { handlePlayRequest } from "./routes/play";

export default {
  async fetch(request: Request, env: PlayEnv, ctx: ExecutionContext): Promise<Response> {
    if (!["GET", "HEAD"].includes(request.method)) {
      return new Response("Method not allowed", {
        status: 405,
        headers: { Allow: "GET, HEAD" },
      });
    }

    const response = await handlePlayRequest(request, env, ctx);
    return response || new Response("Game not found", { status: 404 });
  },
} satisfies ExportedHandler<PlayEnv>;
