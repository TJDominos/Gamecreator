import { request } from "./apiClient";
import type { Game } from "../pages/dashboard/games/gameData";

export interface CreateGamePayload {
  id?: string;
  name?: string;
}

export interface UpdateGamePayload {
  name?: string;
  shortName?: string;
  status?: string;
  displayVersion?: string;
  profile?: {
    description?: string;
    coverImage?: string;
    animationUrl?: string;
    savedAt?: string;
    displayVersion?: string;
  };
}

export interface UploadMediaResponse {
  success: boolean;
  url: string;
  key?: string;
  size?: number;
  error?: string;
}

export const gameApi = {
  /**
   * Fetches all games for the authenticated creator from backend API
   */
  async getGames(): Promise<Game[]> {
    const res = await request<{ success: boolean; games: Game[] }>("/api/games", {
      method: "GET",
    });
    return res.games || [];
  },

  /**
   * Fetches a single game by ID from backend API
   */
  async getGame(id: string): Promise<Game> {
    const res = await request<{ success: boolean; game: Game }>(
      `/api/games/${encodeURIComponent(id)}`,
      { method: "GET" },
    );
    return res.game;
  },

  /**
   * Persists a new game draft to the backend API
   */
  async createGame(payload?: CreateGamePayload): Promise<Game> {
    const res = await request<{ success: boolean; game: Game }>("/api/games", {
      method: "POST",
      body: JSON.stringify(payload || {}),
    });
    return res.game;
  },

  /**
   * Updates game metadata or profile in backend API
   */
  async updateGame(id: string, payload: UpdateGamePayload): Promise<boolean> {
    const res = await request<{ success: boolean; message?: string }>(
      `/api/games/${encodeURIComponent(id)}`,
      {
        method: "PUT",
        body: JSON.stringify(payload),
      },
    );
    return !!res.success;
  },

  /**
   * Deletes a game permanently from backend API
   */
  async deleteGame(id: string): Promise<boolean> {
    const res = await request<{ success: boolean }>(
      `/api/games/${encodeURIComponent(id)}`,
      { method: "DELETE" },
    );
    return !!res.success;
  },

  /**
   * Production-ready media upload for Cover Image (<=1MB) and Game Animation (<=10MB MP4)
   */
  async uploadMedia(
    gameId: string,
    file: File,
    type: "cover" | "animation",
  ): Promise<UploadMediaResponse> {
    // Client-side guard rails before upload
    if (type === "cover" && file.size > 1 * 1024 * 1024) {
      throw new Error(`Cover image (${(file.size / (1024 * 1024)).toFixed(2)} MB) exceeds 1 MB limit.`);
    }
    if (type === "animation" && file.size > 10 * 1024 * 1024) {
      throw new Error(`Animation video (${(file.size / (1024 * 1024)).toFixed(2)} MB) exceeds 10 MB limit.`);
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);

    const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, "") || "";
    const token = localStorage.getItem("randseed_custom_jwt");

    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${baseUrl}/api/games/${encodeURIComponent(gameId)}/media-upload`, {
      method: "POST",
      headers,
      body: formData,
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || errJson.message || `Upload failed with status ${res.status}`);
    }

    return (await res.json()) as UploadMediaResponse;
  },
};
