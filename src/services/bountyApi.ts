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
  is_subscribed?: boolean | number;
  examples?: Array<{
    id: string;
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
    title: example.title || "Game example",
    thumbnail: example.thumbnail || "",
    url: example.url || "#",
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
    state: raw.state,
    category: raw.category,
    prizePool: Number(raw.prize_pool || 0),
    currency: raw.currency,
    tags: parseTags(raw.tags),
    subscriptions: Number(raw.subscriptions || 0),
    onlineGames: Number(raw.online_games || 0),
    deadline: raw.deadline || "",
    battleEnd: raw.battle_end || undefined,
    videoUrl: raw.video_url || undefined,
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
