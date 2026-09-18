import type { Env } from "../types";
import { signRs256Jwt } from "./crypto";

const GITHUB_API = "https://api.github.com";

export interface GitHubInstallationInfo {
  id: number;
  account?: {
    login?: string;
    type?: string;
  };
  permissions?: Record<string, string>;
}

export interface GitHubRepositoryInfo {
  full_name: string;
  default_branch: string;
  branch: string;
  private: boolean;
  commit_sha: string;
  commit_message: string | null;
}

export interface WorkflowPullRequestResult {
  number: number;
  html_url: string;
  branch: string;
}

class GitHubApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = "GitHubApiError";
  }
}

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

async function githubJson<T>(url: string, token: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      ...githubHeaders(token),
      ...(init?.headers || {}),
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub API request failed (${response.status})`);
  }

  return response.json() as Promise<T>;
}

async function githubApiRequest<T>(url: string, token: string, init: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      ...githubHeaders(token),
      ...(init.headers || {}),
    },
  });
  if (!response.ok) {
    throw new GitHubApiError(response.status, `GitHub API request failed (${response.status})`);
  }
  return response.json() as Promise<T>;
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

export async function getInstallationInfo(
  env: Env,
  installationId: number,
): Promise<GitHubInstallationInfo> {
  const appJwt = await createAppJwt(env);
  return githubJson<GitHubInstallationInfo>(
    `${GITHUB_API}/app/installations/${installationId}`,
    appJwt,
  );
}

export async function getInstallationRepository(
  env: Env,
  installationId: number,
  repository: string,
  branch?: string,
): Promise<GitHubRepositoryInfo> {
  const token = await createInstallationToken(env, installationId);
  const repositoryPath = repository.split("/").map(encodeURIComponent).join("/");
  const repo = await githubJson<{
    full_name: string;
    default_branch: string;
    private: boolean;
  }>(`${GITHUB_API}/repos/${repositoryPath}`, token);
  const resolvedBranch = branch || repo.default_branch;
  const commit = await githubJson<{
    sha: string;
    commit?: { message?: string };
  }>(`${GITHUB_API}/repos/${repositoryPath}/commits/${encodeURIComponent(resolvedBranch)}`, token);

  return {
    full_name: repo.full_name,
    default_branch: repo.default_branch,
    branch: resolvedBranch,
    private: repo.private,
    commit_sha: commit.sha,
    commit_message: commit.commit?.message?.split("\n", 1)[0] || null,
  };
}

export async function createWorkflowPullRequest(
  env: Env,
  input: {
    installationId: number;
    repository: string;
    baseBranch: string;
    workflowContent: string;
  },
): Promise<WorkflowPullRequestResult> {
  const token = await createInstallationToken(env, input.installationId);
  const repositoryPath = input.repository.split("/").map(encodeURIComponent).join("/");
  const baseRef = await githubJson<{ object?: { sha?: string } }>(
    `${GITHUB_API}/repos/${repositoryPath}/git/ref/heads/${encodeURIComponent(input.baseBranch)}`,
    token,
  );
  const baseSha = baseRef.object?.sha;
  if (!baseSha) throw new Error("GitHub did not return the base branch commit");

  const workflowPath = ".github/workflows/randseed-deploy.yml";
  const existing = await fetch(
    `${GITHUB_API}/repos/${repositoryPath}/contents/${workflowPath}?ref=${encodeURIComponent(input.baseBranch)}`,
    { headers: githubHeaders(token) },
  );
  if (existing.ok) {
    throw new GitHubApiError(409, "The RandSeed workflow already exists in this repository");
  }
  if (existing.status !== 404) {
    throw new GitHubApiError(existing.status, `GitHub workflow check failed (${existing.status})`);
  }

  const branch = `randseed/add-workflow-${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
  try {
    await githubApiRequest(
      `${GITHUB_API}/repos/${repositoryPath}/git/refs`,
      token,
      {
        method: "POST",
        body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: baseSha }),
      },
    );

    await githubApiRequest(
      `${GITHUB_API}/repos/${repositoryPath}/contents/${workflowPath}`,
      token,
      {
        method: "PUT",
        body: JSON.stringify({
          message: "Add RandSeed deployment workflow",
          content: btoa(input.workflowContent),
          branch,
        }),
      },
    );

    const pullRequest = await githubApiRequest<{ number: number; html_url: string }>(
      `${GITHUB_API}/repos/${repositoryPath}/pulls`,
      token,
      {
        method: "POST",
        body: JSON.stringify({
          title: "Add RandSeed deployment workflow",
          head: branch,
          base: input.baseBranch,
          body: "This PR adds the RandSeed Creator Action workflow. Review the build directory and permissions before merging.",
        }),
      },
    );
    return { number: pullRequest.number, html_url: pullRequest.html_url, branch };
  } catch (error) {
    try {
      await fetch(`${GITHUB_API}/repos/${repositoryPath}/git/refs/heads/${encodeURIComponent(branch)}`, {
        method: "DELETE",
        headers: githubHeaders(token),
      });
    } catch {
      // Keep the original GitHub API failure as the response.
    }
    throw error;
  }
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