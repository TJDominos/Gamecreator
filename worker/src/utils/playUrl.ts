import type { Env } from "../types";

export function gamePublicUrl(
  _env?: Pick<Env, "MAIN_SITE_URL" | "SANDBOX_BASE_URL">,
  gameId: string = "game",
): string {
  return `https://randseed.org/${safeSegment(gameId)}`;
}

export function privateReleaseUrl(
  _env?: Pick<Env, "MAIN_SITE_URL" | "SANDBOX_BASE_URL">,
  gameId: string = "game",
  token: string = "",
): string {
  return `https://randseed.org/private/${safeSegment(gameId)}?token=${encodeURIComponent(token)}`;
}

export function gameBaseUrl(
  env: Pick<Env, "MAIN_SITE_URL" | "SANDBOX_BASE_URL">,
  gameId: string,
): string {
  return gamePublicUrl(env, gameId);
}

function safeSegment(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 63) || "game";
}