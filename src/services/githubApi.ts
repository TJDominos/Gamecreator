import { request } from "./apiClient";
import type { GameRepoInfo } from "../pages/dashboard/games/gameData";

export interface GitHubInstallInfo {
  success: boolean;
  app_slug: string;
  install_url: string;
}

export interface GameRepoResponse {
  success: boolean;
  repo_info?: GameRepoInfo;
  error?: string;
}

export interface LinkGameRepoPayload {
  repository: string;
  branch?: string;
  build_dir?: string;
  installation_id?: number;
}

export interface LinkGameRepoResponse {
  success: boolean;
  message?: string;
  binding?: {
    game_id: string;
    repository: string;
    branch: string;
    sandbox_url: string;
    deployment_auth?: "github_actions_oidc";
  };
  error?: string;
}

export interface DeploymentRecord {
  id: string;
  game_id: string;
  repository: string;
  branch: string;
  commit_sha: string;
  commit_message: string | null;
  status: string;
  live_url: string | null;
  error_message: string | null;
  created_at: number;
  published_at: number | null;
  finished_at: number | null;
}

export interface DeploymentListResponse {
  success: boolean;
  deployments?: DeploymentRecord[];
  error?: string;
}

export interface PrivateReleaseResponse {
  success: boolean;
  release_id?: string;
  deployment_id?: string;
  expires_at?: string | null;
  url?: string;
  revoked?: boolean;
  error?: string;
}

export interface SyncStatusResponse {
  success: boolean;
  game_id?: string;
  is_synced: boolean;
  last_synced_at?: string;
  latest_commit?: string;
  commit_message?: string;
  sandbox_url?: string;
  message?: string;
}

export const githubApi = {
  /**
   * Retrieves GitHub App install link for RDcreatordev
   */
  async getInstallInfo(gameId?: string): Promise<GitHubInstallInfo> {
    try {
      const res = await request<GitHubInstallInfo>("/api/github/install");
      if (res && res.install_url) {
        return res;
      }
    } catch {
      // Fallback
    }
    const slug = "RDcreatordev";
    return {
      success: true,
      app_slug: slug,
      install_url: `https://github.com/apps/${slug}/installations/new?state=${encodeURIComponent(gameId || "creator_dev")}`,
    };
  },

  /**
   * Fetches the current connected repository information for a game
   */
  async getGameRepo(gameId: string): Promise<GameRepoResponse> {
    return request<GameRepoResponse>(`/api/games/${encodeURIComponent(gameId)}/repo`, {
      method: "GET",
    });
  },

  /**
   * Links a GitHub repository to a game using RDcreatordev GitHub App
   */
  async linkGameRepo(
    gameId: string,
    payload: LinkGameRepoPayload,
  ): Promise<LinkGameRepoResponse> {
    return request<LinkGameRepoResponse>(`/api/games/${encodeURIComponent(gameId)}/repo/link`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  /**
   * Disconnects/unlinks a repository from a game
   */
  async unlinkGameRepo(gameId: string): Promise<{ success: boolean; message?: string }> {
    return request<{ success: boolean; message?: string }>(
      `/api/games/${encodeURIComponent(gameId)}/repo/unlink`,
      {
        method: "POST",
      },
    );
  },

  /**
   * Performs a live sync check between the game and GitHub
   */
  async checkSyncStatus(gameId: string): Promise<SyncStatusResponse> {
    return request<SyncStatusResponse>(
      `/api/games/${encodeURIComponent(gameId)}/sync-status`,
      {
        method: "GET",
      },
    );
  },

  async listDeployments(gameId: string): Promise<DeploymentListResponse> {
    return request<DeploymentListResponse>(
      `/api/games/${encodeURIComponent(gameId)}/deployments`,
      { method: "GET" },
    );
  },

  async createPrivateRelease(
    gameId: string,
    deploymentId: string,
    expiresInDays: number | null,
  ): Promise<PrivateReleaseResponse> {
    return request<PrivateReleaseResponse>(
      `/api/games/${encodeURIComponent(gameId)}/private-releases`,
      {
        method: "POST",
        body: JSON.stringify({ deployment_id: deploymentId, expires_in_days: expiresInDays }),
      },
    );
  },

  async revokePrivateRelease(gameId: string, releaseId: string): Promise<PrivateReleaseResponse> {
    return request<PrivateReleaseResponse>(
      `/api/games/${encodeURIComponent(gameId)}/private-releases/${encodeURIComponent(releaseId)}`,
      { method: "DELETE" },
    );
  },
};
