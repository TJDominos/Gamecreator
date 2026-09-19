import { useSyncExternalStore } from "react";
import type { Game } from "../pages/dashboard/games/gameData";

const STORAGE_KEY = "randseed_creator_games";
const GAMES_UPDATED_EVENT = "randseed_games_updated";

let cachedGames: Game[] | null = null;
const listeners = new Set<() => void>();

function readCachedGames(): Game[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((game): game is Game => Boolean(game && typeof game === "object" && "id" in game))
      : [];
  } catch (error) {
    console.error("Failed to load stored games", error);
    return [];
  }
}

function notify(): void {
  listeners.forEach((listener) => listener());
}

export const gamesStore = {
  getSnapshot(): Game[] {
    if (cachedGames === null) cachedGames = readCachedGames();
    return cachedGames;
  },
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

export const gamesSelectors = {
  all(state: Game[]): Game[] {
    return state;
  },
  byId(state: Game[], id: string): Game | undefined {
    return state.find((game) => game.id === id);
  },
};

export const gamesActions = {
  replace(games: Game[]): void {
    cachedGames = games;
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(games));
        window.dispatchEvent(new CustomEvent(GAMES_UPDATED_EVENT, { detail: games }));
      } catch (error) {
        console.error("Failed to save stored games", error);
      }
    }
    notify();
  },
};

export function useGamesStore(): Game[] {
  return useSyncExternalStore(gamesStore.subscribe, gamesStore.getSnapshot, gamesStore.getSnapshot);
}