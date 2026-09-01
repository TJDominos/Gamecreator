export type GameStatus = 'DRAFT' | 'DEVELOPMENT' | 'PRIVATE_TESTING' | 'PENDING_REVIEW' | 'REJECTED' | 'APPROVED' | 'PUBLIC_ACTIVE' | 'MAINTENANCE' | 'ARCHIVED';

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
}

export const MOCK_GAMES: Game[] = [
  { id: "g_101", name: "Neon Dash", status: "PUBLIC_ACTIVE", players: "1,204", version: "v1.2.0", visitors: "2,500", revenue: "$342.00", availableBalance: "$120.00", escrowedBalance: "$50.00" },
  { id: "g_102", name: "Space Miner", status: "DEVELOPMENT", players: "12", version: "sandbox-a4f2", visitors: "20", revenue: "$0.00", availableBalance: "$45.50", escrowedBalance: "$0.00" },
  { id: "g_999", name: "Cosmic Wars", status: "PENDING_REVIEW", players: "42", version: "rc-1.0", visitors: "100", revenue: "$0.00", availableBalance: "$0.00", escrowedBalance: "$0.00" },
  { id: "g_842", name: "Untitled Game", status: "DRAFT", players: "-", version: "-", visitors: "-", revenue: "-", availableBalance: "-", escrowedBalance: "-" },
];

export function getGameById(id: string): Game | undefined {
  return MOCK_GAMES.find(g => g.id === id);
}
