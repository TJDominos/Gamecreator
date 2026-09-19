import { gameApi } from "../../../services/gameApi";
import { ApiError } from "../../../services/apiClient";
import { gamesActions, gamesStore } from "../../../state/gamesStore";

export type GameStatus =
  | 'DRAFT'
  | 'DEVELOPMENT'
  | 'PRIVATE_TESTING'
  | 'PENDING_REVIEW'
  | 'REJECTED'
  | 'APPROVED'
  | 'PUBLIC_ACTIVE'
  | 'MAINTENANCE'
  | 'ARCHIVED';

export interface GameRepoInfo {
  repository: string;
  branch: string;
  lastCommitSha: string;
  lastCommitMessage: string;
  lastSyncedAt: string;
  isSynced: boolean;
  syncMethod: 'github_action' | 'webhook' | 'manual';
  sandboxUrl: string;
}

export const GAME_CATEGORIES = [
  'Arcade',
  'Card & Board',
  'Casino',
  'Music',
  'Puzzle',
  'Role-Playing',
  'Simulation',
  'Sports',
  'Strategy',
  'Trivia',
  'Word',
] as const;

export type GameCategory = typeof GAME_CATEGORIES[number];
export type AgeRating = 'All Ages' | '18+' | 'NSFW';
export type DeviceSupport = 'PC' | 'Mobile' | 'Responsive';

export interface GameProfile {
  description: string;
  coverImage: string;
  animationUrl?: string;
  savedAt?: string;
  displayVersion?: string;
  category?: GameCategory;
  ageRating?: AgeRating;
  deviceSupport?: DeviceSupport;
}

export interface Game {
  id: string;
  name: string;
  shortName?: string;
  status: GameStatus;
  players: string; // e.g. "1,204" or "---"
  version: string; // e.g. "v1.2.0" or "---"
  publicDeploymentId?: string | null;
  publicVersion?: string | null;
  sandboxDeploymentId?: string | null;
  sandboxVersion?: string | null;
  displayVersion?: string; // Player-facing custom version chosen by creator based on deployment version
  visitors: string; // e.g. "2,500" or "---"
  revenue: string; // e.g. "$342.00" or "---"
  availableBalance: string; // e.g. "$120.00" or "---"
  escrowedBalance: string; // e.g. "$50.00" or "---"
  coverImage?: string;
  profile?: GameProfile;
  repoInfo?: GameRepoInfo;
  createdAt?: number;
}

export const GAMES_UPDATED_EVENT = "randseed_games_updated";

export function getStoredGames(): Game[] {
  return gamesStore.getSnapshot();
}

export function saveStoredGames(games: Game[]): void {
  gamesActions.replace(games);
}

export function getGameById(id: string): Game | undefined {
  const games = getStoredGames();
  return games.find((g) => g.id === id);
}

export function isGameNameUnique(name: string, excludeGameId?: string): boolean {
  const games = getStoredGames();
  const normalized = name.trim().toLowerCase();
  return !games.some(
    (g) => g.id !== excludeGameId && g.name.trim().toLowerCase() === normalized
  );
}

export function getNextNewGameName(): string {
  const games = getStoredGames();
  const existingNames = new Set(games.map((g) => g.name.trim().toLowerCase()));

  // 1. Check if "new game" is available
  if (!existingNames.has("new game")) {
    return "new game";
  }

  // 2. Otherwise find highest number for "new game<N>"
  let maxNumber = 1;
  for (const name of existingNames) {
    const match = name.match(/^new\s*game\s*(\d+)$/i);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxNumber) {
        maxNumber = num;
      }
    }
  }

  return `new game${maxNumber + 1}`;
}

function generateGameId(): string {
  const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  const idLength = 12;
  const bytes = new Uint8Array(idLength);
  let id = "";

  while (id.length < idLength) {
    crypto.getRandomValues(bytes);
    for (const byte of bytes) {
      if (byte >= 248) continue;
      id += alphabet[byte % alphabet.length];
      if (id.length === idLength) break;
    }
  }

  return id;
}

/**
 * Synchronizes local cached games with backend database API
 */
export async function syncGamesWithBackend(): Promise<Game[]> {
  const backendGames = await gameApi.getGames();
  const games = Array.isArray(backendGames) ? backendGames : [];
  const cachedGames = getStoredGames();
  const cachedDrafts = cachedGames.filter((game) => game.status === "DRAFT");
  if (games.length === 0 && cachedDrafts.length > 0) {
    await Promise.all(cachedDrafts.map((game) => ensureGamePersisted(game.id, game.name)));
    const persistedGames = await gameApi.getGames();
    saveStoredGames(persistedGames);
    return persistedGames;
  }
  saveStoredGames(games);
  return games;
}

export async function ensureGamePersisted(gameId: string, gameName: string): Promise<void> {
  try {
    await gameApi.getGame(gameId);
    return;
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 404) {
      throw error;
    }
    await gameApi.createGame({ id: gameId, name: gameName.trim() || "New Game" });
  }
}

/**
 * Creates a new draft game persisted to backend D1 database
 */
/**
 * Creates a new draft game and explicitly awaits backend persistence
 */
export async function createNextNewGameAsync(): Promise<Game> {
  const name = getNextNewGameName();
  const id = generateGameId();
  
  try {
    const backendGame = await gameApi.createGame({ id, name });
    const currentGames = getStoredGames();
    const games = [backendGame, ...currentGames.filter(g => g.id !== backendGame.id)];
    saveStoredGames(games);
    return backendGame;
  } catch (error) {
    throw error instanceof Error ? error : new Error("Unable to create game");
  }
}

/**
 * Updates game profile and metadata, persisting to backend
 */
export async function updateGame(id: string, updates: Partial<Game>): Promise<Game | undefined> {
  const games = getStoredGames();
  const index = games.findIndex((g) => g.id === id);
  if (index === -1) return undefined;

  const current = games[index];
  const updatedGame: Game = {
    ...current,
    ...updates,
    // Deployment version cannot be tampered with manually; it is strictly managed by deployments
    version: current.version,
    displayVersion: updates.displayVersion !== undefined 
      ? updates.displayVersion 
      : (updates.profile?.displayVersion !== undefined ? updates.profile.displayVersion : current.displayVersion),
    profile: updates.profile
      ? {
          description: updates.profile.description ?? current.profile?.description ?? '',
          coverImage: updates.profile.coverImage ?? current.profile?.coverImage ?? '',
          animationUrl: updates.profile.animationUrl ?? current.profile?.animationUrl ?? '',
          savedAt: updates.profile.savedAt ?? new Date().toISOString(),
          displayVersion: updates.profile.displayVersion ?? updates.displayVersion ?? current.profile?.displayVersion ?? current.displayVersion ?? '',
          category: updates.profile.category ?? current.profile?.category,
          ageRating: updates.profile.ageRating ?? current.profile?.ageRating,
          deviceSupport: updates.profile.deviceSupport ?? current.profile?.deviceSupport,
        }
      : current.profile
  };

  await gameApi.updateGame(id, {
    name: updatedGame.name,
    shortName: updatedGame.shortName,
    status: updatedGame.status,
    displayVersion: updatedGame.displayVersion,
    profile: updatedGame.profile,
  });

  games[index] = updatedGame;
  saveStoredGames(games);
  return updatedGame;
}

/**
 * Deletes a game permanently from local cache and backend
 */
export async function deleteGame(id: string): Promise<boolean> {
  const games = getStoredGames();
  const filtered = games.filter((g) => g.id !== id);

  await gameApi.deleteGame(id);
  if (filtered.length !== games.length) saveStoredGames(filtered);

  return true;
}

export function validateGameForPrivatePublish(game: Game): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // 1. Check if name is blank
  if (!game.name || !game.name.trim()) {
    errors.push("Game name cannot be empty.");
  }

  // 2. Check if name is default placeholder
  const isDefaultPlaceholder = /^new\s*game\s*(\d*)$/i.test(game.name.trim());
  if (isDefaultPlaceholder) {
    errors.push(`Game name cannot be the default placeholder "${game.name}". Please choose a unique game name before private publish.`);
  }

  // 3. Check description & cover image (required)
  const description = game.profile?.description?.trim() || "";
  const words = description.split(/\s+/).filter(Boolean);
  if (!description) {
    errors.push("Description is required.");
  } else if (words.length > 500) {
    errors.push(`Description exceeds 500 words limit (current: ${words.length} words).`);
  }

  if (!game.profile?.coverImage?.trim()) {
    errors.push("Cover Image is required before publishing.");
  }

  // 4. Check meta tags
  if (!game.profile?.category) {
    errors.push("Game Category is required.");
  }
  if (!game.profile?.ageRating) {
    errors.push("Age Rating is required.");
  }
  if (!game.profile?.deviceSupport) {
    errors.push("Device Support is required.");
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

export function validateGameForPublicPublish(game: Game): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const name = game.name.trim();
  const shortName = game.shortName?.trim().toLowerCase() || "";

  if (!name) errors.push("Game name is required for public review.");
  if (/^new\s*game\s*(\d*)$/i.test(name)) {
    errors.push("Choose a final game name before submitting for public review.");
  }
  if (!shortName) {
    errors.push("A short name is required because it becomes the public game link.");
  } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(shortName)) {
    errors.push("Short name may contain only lowercase letters, numbers, and hyphens.");
  }

  return { valid: errors.length === 0, errors };
}
