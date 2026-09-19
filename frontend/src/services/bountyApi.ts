import { request } from "./apiClient";
import type { Bounty, BountyState, Category, Creator, GameExample, PublishedGame } from "../pages/dashboard/bounties/bountyData";

interface RawBounty {
  id: string;
  title: string;
  description: string;
  full_description?: string | null;
  state: BountyState;
  category: Category;
  prize_pool: number;
  currency: "WLT" | "USD";
  tags?: string | string[] | null;
  subscriptions?: number;
  online_games?: number;
  deadline?: string | null;
  battle_end?: string | null;
  video_url?: string | null;
  max_participants?: number | null;
  release_date?: string | null;
  settlement_rules?: string | null;
  is_subscribed?: boolean | number;
  examples?: Array<{
    id: string;
    type?: string | null;
    title?: string | null;
    thumbnail?: string | null;
    url?: string | null;
  }>;
  participants?: Array<{
    id: string;
    name: string;
    avatar: string;
  }>;
  published_games?: RawPublishedGame[];
  winners?: RawPublishedGame[];
  total_score?: number;
  my_game_name?: string | null;
  my_game_score?: number | null;
}

interface RawPublishedGame {
  id: string;
  gameId?: string;
  creator: Creator;
  gameName: string;
  prize?: string | null;
  uu?: number | null;
  reviewScore?: number | null;
  performanceScore?: number | null;
  isWinner?: boolean | number;
}

function parseTags(tags: RawBounty["tags"]): string[] {
  if (Array.isArray(tags)) return tags;
  if (!tags) return [];
  try {
    const parsed = JSON.parse(tags);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return tags.split(",").map((tag) => tag.trim()).filter(Boolean);
  }
}

function mapExample(example: NonNullable<RawBounty["examples"]>[number]): GameExample {
  return {
    id: example.id,
    type: example.type || "web",
    title: example.title || "Game example",
    thumbnail: example.thumbnail || "",
    url: example.url || "",
  };
}

function mapPublishedGame(game: RawPublishedGame): PublishedGame {
  return {
    id: game.id,
    gameId: game.gameId,
    creator: game.creator,
    gameName: game.gameName,
    prize: game.prize || undefined,
    uu: game.uu ?? undefined,
    reviewScore: game.reviewScore ?? undefined,
    performanceScore: game.performanceScore ?? undefined,
  };
}

export function mapBounty(raw: RawBounty): Bounty {
  return {
    id: raw.id,
    title: raw.title,
    description: raw.description,
    fullDescription: raw.full_description || undefined,
    state: String(raw.state || "DRAFT").trim().toUpperCase() as BountyState,
    category: raw.category,
    prizePool: Number(raw.prize_pool || 0),
    currency: raw.currency,
    tags: parseTags(raw.tags),
    subscriptions: Number(raw.subscriptions || 0),
    onlineGames: Number(raw.online_games || 0),
    deadline: raw.deadline || "",
    battleEnd: raw.battle_end || undefined,
    videoUrl: raw.video_url || undefined,
    maxParticipants: raw.max_participants ?? undefined,
    releaseDate: raw.release_date || undefined,
    settlementRules: raw.settlement_rules || undefined,
    isSubscribed: Boolean(raw.is_subscribed),
    examples: raw.examples?.map(mapExample),
    participants: raw.participants,
    publishedGames: raw.published_games?.map(mapPublishedGame),
    winners: raw.winners?.map(mapPublishedGame),
    totalScore: raw.total_score,
    myGameName: raw.my_game_name || undefined,
    myGameScore: raw.my_game_score ?? undefined,
  };
}

export const bountyApi = {
  async uploadMedia(file: File): Promise<{ url: string }> {
    const token = localStorage.getItem("randseed_custom_jwt");
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch("/api/admin/bounties/media", {
      method: "PUT",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: formData,
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.success === false || !payload.url) {
      throw new Error(payload.error || payload.message || `Upload failed with status ${response.status}`);
    }
    return { url: payload.url };
  },

  async list(): Promise<Bounty[]> {
    const response = await request<{ success: boolean; bounties: RawBounty[] }>("/api/bounties");
    return (response.bounties || []).map(mapBounty);
  },

  async get(id: string): Promise<Bounty> {
    const response = await request<{ success: boolean; bounty: RawBounty }>(`/api/bounties/${encodeURIComponent(id)}`);
    return mapBounty(response.bounty);
  },

  async participate(id: string): Promise<void> {
    await request(`/api/bounties/${encodeURIComponent(id)}/participate`, { method: "POST" });
  },

  async leave(id: string): Promise<void> {
    await request(`/api/bounties/${encodeURIComponent(id)}/participate`, { method: "DELETE" });
  },
};
