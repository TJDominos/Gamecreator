export type GameStatus = 'DRAFT' | 'DEVELOPMENT' | 'PRIVATE_TESTING' | 'PENDING_REVIEW' | 'REJECTED' | 'APPROVED' | 'PUBLIC_ACTIVE' | 'MAINTENANCE' | 'ARCHIVED';

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

export interface Game {
  id: string;
  name: string;
  status: GameStatus;
  players: string;
  version: string;
  visitors: string;
  revenue: string;
  availableBalance: string;
  escrowedBalance: string;
  repoInfo?: GameRepoInfo;
}

export const MOCK_GAMES: Game[] = [
  { 
    id: "g_101", 
    name: "Neon Dash", 
    status: "PUBLIC_ACTIVE", 
    players: "1,204", 
    version: "v1.2.0", 
    visitors: "2,500", 
    revenue: "$342.00", 
    availableBalance: "$120.00", 
    escrowedBalance: "$50.00",
    repoInfo: {
      repository: "TJDominos/Gamecreator",
      branch: "main",
      lastCommitSha: "a4f29cb",
      lastCommitMessage: "Fix collision bugs and particle effects",
      lastSyncedAt: "2 mins ago",
      isSynced: true,
      syncMethod: "github_action",
      sandboxUrl: "https://randseed.org/sandbox/g_101"
    }
  },
  { 
    id: "g_102", 
    name: "Space Miner", 
    status: "DEVELOPMENT", 
    players: "12", 
    version: "sandbox-a4f2", 
    visitors: "20", 
    revenue: "$0.00", 
    availableBalance: "$45.50", 
    escrowedBalance: "$0.00",
    repoInfo: {
      repository: "RandSeedStudio/space-miner",
      branch: "main",
      lastCommitSha: "7b1c3a8",
      lastCommitMessage: "Update laser drill physics",
      lastSyncedAt: "15 mins ago",
      isSynced: true,
      syncMethod: "github_action",
      sandboxUrl: "https://randseed.org/sandbox/g_102"
    }
  },
  { 
    id: "g_999", 
    name: "Cosmic Wars", 
    status: "PENDING_REVIEW", 
    players: "42", 
    version: "rc-1.0", 
    visitors: "100", 
    revenue: "$0.00", 
    availableBalance: "$0.00", 
    escrowedBalance: "$0.00",
    repoInfo: {
      repository: "RandSeedStudio/cosmic-wars",
      branch: "release/1.0",
      lastCommitSha: "9f0d1e2",
      lastCommitMessage: "Initial release candidate audit",
      lastSyncedAt: "2 hours ago",
      isSynced: true,
      syncMethod: "webhook",
      sandboxUrl: "https://randseed.org/sandbox/g_999"
    }
  },
  { 
    id: "g_842", 
    name: "Untitled Game", 
    status: "DRAFT", 
    players: "-", 
    version: "-", 
    visitors: "-", 
    revenue: "-", 
    availableBalance: "-", 
    escrowedBalance: "-" 
  },
];

export function getGameById(id: string): Game | undefined {
  return MOCK_GAMES.find(g => g.id === id);
}
