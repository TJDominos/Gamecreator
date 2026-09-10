import type { Env } from "../types";
import { base64UrlDecodeBytes } from "../utils/crypto";

const GITHUB_OIDC_ISSUER = "https://token.actions.githubusercontent.com";
const GITHUB_JWKS_URL = `${GITHUB_OIDC_ISSUER}/.well-known/jwks`;
let jwksCache: { expiresAt: number; keys: JsonWebKey[] } | null = null;

interface GithubOidcClaims {
  iss: string;
  aud: string | string[];
  repository?: string;
  ref?: string;
  sha?: string;
  workflow?: string;
  workflow_ref?: string;
  job_workflow_ref?: string;
  run_id?: string;
  run_attempt?: string;
  exp?: number;
  nbf?: number;
}

function parseJwt(token: string): { header: Record<string, unknown>; claims: GithubOidcClaims; signature: Uint8Array; signed: string } {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Invalid OIDC token");
  return {
    header: JSON.parse(new TextDecoder().decode(base64UrlDecodeBytes(parts[0]))) as Record<string, unknown>,
    claims: JSON.parse(new TextDecoder().decode(base64UrlDecodeBytes(parts[1]))) as GithubOidcClaims,
    signature: base64UrlDecodeBytes(parts[2]),
    signed: `${parts[0]}.${parts[1]}`,
  };
}

async function getJwks(): Promise<JsonWebKey[]> {
  if (jwksCache && jwksCache.expiresAt > Date.now()) return jwksCache.keys;
  const response = await fetch(GITHUB_JWKS_URL, {
    headers: { Accept: "application/json", "User-Agent": "RandSeed-Gamecreator-Worker" },
  });
  if (!response.ok) throw new Error("Unable to fetch GitHub OIDC keys");
  const data = await response.json() as { keys?: JsonWebKey[] };
  jwksCache = { expiresAt: Date.now() + 10 * 60 * 1000, keys: data.keys || [] };
  return jwksCache.keys;
}

function audienceMatches(actual: string | string[], expected: string): boolean {
  return Array.isArray(actual) ? actual.includes(expected) : actual === expected;
}

export async function verifyGithubActionsOidc(
  token: string,
  env: Env,
  expected: { repository: string; commitSha: string; branch: string; workflow: string },
): Promise<GithubOidcClaims> {
  const parsed = parseJwt(token);
  if (parsed.header.alg !== "RS256" || typeof parsed.header.kid !== "string") {
    throw new Error("Unsupported GitHub OIDC token");
  }

  const claims = parsed.claims;
  const now = Math.floor(Date.now() / 1000);
  const audience = env.GITHUB_OIDC_AUDIENCE || "randseed-gamecreator";
  if (claims.iss !== GITHUB_OIDC_ISSUER || !audienceMatches(claims.aud, audience)) {
    throw new Error("GitHub OIDC issuer or audience mismatch");
  }
  if (!claims.exp || claims.exp <= now || (claims.nbf && claims.nbf > now + 30)) {
    throw new Error("GitHub OIDC token is expired or not active");
  }
  if (
    claims.repository !== expected.repository ||
    claims.sha !== expected.commitSha ||
    claims.ref !== `refs/heads/${expected.branch}`
  ) {
    throw new Error("GitHub OIDC repository or commit mismatch");
  }
  const workflowSuffix = `/.github/workflows/${expected.workflow}@refs/heads/${expected.branch}`;
  if (
    claims.workflow !== expected.workflow &&
    !claims.workflow_ref?.endsWith(workflowSuffix) &&
    !claims.job_workflow_ref?.endsWith(workflowSuffix)
  ) {
    throw new Error("GitHub OIDC workflow mismatch");
  }

  const jwk = (await getJwks()).find((key) => key.kid === parsed.header.kid);
  if (!jwk) throw new Error("GitHub OIDC signing key not found");
  const key = await crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"],
  );
  const valid = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    key,
    parsed.signature,
    new TextEncoder().encode(parsed.signed),
  );
  if (!valid) throw new Error("Invalid GitHub OIDC signature");
  return claims;
}