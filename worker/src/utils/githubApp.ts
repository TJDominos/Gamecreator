import type { Env } from "../types";
import { signRs256Jwt } from "./crypto";

const GITHUB_API = "https://api.github.com";

function githubHeaders(token: string): HeadersInit {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "User-Agent": "RandSeed-Gamecreator-Worker",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

async function createAppJwt(env: Env): Promise<string> {
  if (!env.GITHUB_APP_ID || !env.GITHUB_APP_PRIVATE_KEY) {
    throw new Error("GitHub App credentials are not configured");
  }

  const now = Math.floor(Date.now() / 1000);
  return signRs256Jwt(
    {
      iat: now - 60,
      exp: now +  nueveSeconds(),
      iss: env.GITHUB_APP_ID,
    },
    env.GITHUB_APP_PRIVATE_KEY.replace(/\\n/g, "\n"),
  );
}

function nueveSeconds(): number {
  return 9 * 60;
}

export async function createInstallationToken(
  env: Env,
  installationId: number,
): Promise<string> {
  const appJwt = await createAppJwt(env);
  const response = await fetch(`${GITHUB_API}/app/installations/${installationId}/access_tokens`, {
    method: "POST",
    headers: githubHeaders(appJwt),
  });

  if (!response.ok) {
    throw new Error(`GitHub installation token request failed (${response.status})`);
  }

  const data = await response.json() as { token?: string };
  if (!data.token) throw new Error("GitHub did not return an installation token");
  return data.token;
}

export async function dispatchDeploymentWorkflow(
  env: Env,
  input: {
    installationId: number;
    repository: string;
    branch: string;
    deploymentId: string;
    commitSha: string;
    gameId: string;
  },
): Promise<void> {
  const workflow = env.GITHUB_ACTION_WORKFLOW || "randseed-deploy.yml";
  const token = await createInstallationToken(env, input.installationId);
  const response = await fetch(
    `${GITHUB_API}/repos/${input.repository}/actions/workflows/${encodeURIComponent(workflow)}/dispatches`,
    {
      method: "POST",
      headers: githubHeaders(token),
      body: JSON.stringify({
        ref: input.branch,
        inputs: {
          deployment_id: input.deploymentId,
          commit_sha: input.commitSha,
          game_id: input.gameId,
        },
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`GitHub workflow dispatch failed (${response.status})`);
  }
}