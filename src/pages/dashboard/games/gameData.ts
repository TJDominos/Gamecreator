import { gameApi } from "../../../services/gameApi";

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
  status: GameStatus;
  players: string; // e.g. "1,204" or "---"
  version: string; // e.g. "v1.2.0" or "---"
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

const LEGACY_MOCK_GAME_IDS = new Set(["g_101", "g_102", "g_999"]);

export const STORAGE_KEY = "randseed_creator_games";
export const GAMES_UPDATED_EVENT = "randseed_games_updated";

export function getStoredGames(): Game[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.filter((game): game is Game => game && !LEGACY_MOCK_GAME_IDS.has(game.id));
    }
    return [];
  } catch (err) {
    console.error("Failed to load stored games", err);
    return [];
  }
}

export function saveStoredGames(games: Game[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(games));
    window.dispatchEvent(new CustomEvent(GAMES_UPDATED_EVENT, { detail: games }));
  } catch (err) {
    console.error("Failed to save stored games", err);
  }
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

/**
 * Synchronizes local cached games with backend database API
 */
export async function syncGamesWithBackend(): Promise<Game[]> {
  try {
    const backendGames = await gameApi.getGames();
    const games = Array.isArray(backendGames) ? backendGames : [];
    saveStoredGames(games);
    return games;
  } catch (err) {
    console.warn("Backend games sync failed, keeping local cache:", err);
  }
  return getStoredGames();
}

/**
 * Creates a new draft game persisted to backend D1 database
 */
export function createNextNewGame(): Game {
  const name = getNextNewGameName();
  const id = `g_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  
  const newGame: Game = {
    id,
    name,
    status: 'DRAFT',
    version: '---', // Version is bound to deployments, starts at '---'
    players: '---',
    visitors: '---',
    revenue: '---',
    availableBalance: '---',
    escrowedBalance: '---',
    createdAt: Date.now(),
    profile: {
      description: '',
      coverImage: '',
      animationUrl: ''
    },
  };

  const currentGames = getStoredGames();
  const games = [newGame, ...currentGames];
  saveStoredGames(games);

  // Persist to backend database asynchronously
  gameApi.createGame({ id, name }).then((persistedGame) => {
    if (persistedGame && persistedGame.id) {
      // Refresh local copy with server-assigned attributes
      const freshList = getStoredGames().map(g => g.id === id ? { ...g, ...persistedGame } : g);
      saveStoredGames(freshList);
    }
  }).catch((err) => {
    console.error("Failed to persist new game to backend database:", err);
  });

  return newGame;
}

/**
 * Creates a new draft game and explicitly awaits backend persistence
 */
export async function createNextNewGameAsync(): Promise<Game> {
  const name = getNextNewGameName();
  const id = `g_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  
  try {
    const backendGame = await gameApi.createGame({ id, name });
    const currentGames = getStoredGames();
    const games = [backendGame, ...currentGames.filter(g => g.id !== backendGame.id)];
    saveStoredGames(games);
    return backendGame;
  } catch (err) {
    console.warn("Direct backend create failed, falling back to local optimistic creation:", err);
    return createNextNewGame();
  }
}

/**
 * Updates game profile and metadata, persisting to backend
 */
export function updateGame(id: string, updates: Partial<Game>): Game | undefined {
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
          displayVersion: updates.profile.displayVersion ?? updates.displayVersion ?? current.profile?.displayVersion ?? current.displayVersion ?? ''
        }
      : current.profile
  };

  games[index] = updatedGame;
  saveStoredGames(games);

  // Send update to backend API
  gameApi.updateGame(id, {
    name: updatedGame.name,
    status: updatedGame.status,
    profile: updatedGame.profile
  }).catch(err => {
    console.error(`Failed to update game ${id} on backend:`, err);
  });

  return updatedGame;
}

/**
 * Deletes a game permanently from local cache and backend
 */
export async function deleteGame(id: string): Promise<boolean> {
  const games = getStoredGames();
  const filtered = games.filter((g) => g.id !== id);
  
  if (filtered.length !== games.length) {
    saveStoredGames(filtered);
  }

  // Delete from backend API
  try {
    await gameApi.deleteGame(id);
  } catch (err) {
    console.error(`Failed to delete game ${id} on backend:`, err);
  }

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

  // 3. Check uniqueness across all games
  if (!isGameNameUnique(game.name, game.id)) {
    errors.push(`Game name "${game.name}" is already taken. Game names must be globally unique in Randseed.`);
  }

  // 4. Check description & cover image (required)
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

  // 5. Check meta tags
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
