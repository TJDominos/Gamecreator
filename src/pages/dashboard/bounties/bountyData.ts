export type BountyState = 'OPEN' | 'RUNNING' | 'ONLINE' | 'CLOSED';
export type Category = 'Casino' | 'Puzzle' | 'Card & Board' | 'Simulation' | 'Arcade' | 'Strategy' | 'Word' | 'Trivia' | 'Role-Playing' | 'Sports' | 'Music';

export interface Creator {
  id: string;
  name: string;
  avatar: string;
}

export interface GameExample {
  id: string;
  title: string;
  thumbnail: string;
  url: string;
}

export interface PublishedGame {
  creator: Creator;
  gameName: string;
  prize?: string;
  uu?: number;
  reviewScore?: number;
  performanceScore?: number;
}

export interface Winner {
  creator: Creator;
  gameName: string;
  prize: string;
  uu?: number;
  reviewScore?: number;
  performanceScore?: number;
}

export interface Bounty {
  id: string;
  title: string;
  description: string;
  state: BountyState;
  category: Category;
  prizePool: number;
  currency: 'WLT' | 'USD';
  tags: string[];
  subscriptions: number;
  onlineGames: number;
  deadline: string;
  battleEnd?: string;
  
  fullDescription?: string;
  examples?: GameExample[];
  participants?: Creator[];
  publishedGames?: PublishedGame[];
  winners?: Winner[];
  videoUrl?: string;

  totalScore?: number;
  myGameName?: string;
  myGameScore?: number;
}

const mockParticipants: Creator[] = Array.from({ length: 45 }, (_, i) => ({
  id: `u${i + 1}`,
  name: `Creator_${i + 1}`,
  avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=User${i + 1}`
}));

mockParticipants[0].name = 'AlexTheDev';
mockParticipants[1].name = 'PixelNinja';
mockParticipants[2].name = 'SarahCodes';
mockParticipants[3].name = 'GameBuilder99';

const mockPublished: PublishedGame[] = [
  { creator: mockParticipants[0], gameName: 'Neon Rush 2026', prize: '50,000 WLT', uu: 12500, reviewScore: 4.8, performanceScore: 60000 },
  { creator: mockParticipants[1], gameName: 'Pixel Dodger', prize: '30,000 WLT', uu: 8400, reviewScore: 4.5, performanceScore: 37800 }
];

const mockWinners: Winner[] = [
  { creator: mockParticipants[0], gameName: 'Neon Rush 2026', prize: '50,000 WLT', uu: 12500, reviewScore: 4.8, performanceScore: 60000 },
  { creator: mockParticipants[1], gameName: 'Pixel Dodger', prize: '30,000 WLT', uu: 8400, reviewScore: 4.5, performanceScore: 37800 },
  { creator: mockParticipants[2], gameName: 'Block Breaker', prize: '20,000 WLT', uu: 5200, reviewScore: 4.2, performanceScore: 21840 }
];

const mockExamples: GameExample[] = [
  { id: 'ex1', title: 'Geometry Dash', thumbnail: 'https://picsum.photos/seed/ex1/640/360', url: '#' },
  { id: 'ex2', title: 'Flappy Bird', thumbnail: 'https://picsum.photos/seed/ex2/640/360', url: '#' }
];

const fullDesc = `Join this campaign to build the next generation of games. We are looking for highly engaging, addictive mechanics that can retain players over a 30-day period.

Key Requirements:
- Must integrate our Core SDK for player authentication.
- Must support both mobile (H5) and desktop browsers.
- Sessions should be short and replayable.

Resources:
Feel free to use any HTML5 game engine (Phaser, PixiJS, PlayCanvas, or Unity WebGL).`;

export const MOCK_BOUNTIES: Bounty[] = [
  {
    id: "bty_001",
    title: "Next-Gen Arcade Challenge",
    description: "Build an addictive arcade game (e.g. Endless Runner, Flappy Bird clone) with high replayability. Engage players for 30 days to win the grand prize.",
    state: "OPEN",
    category: "Arcade",
    prizePool: 100000,
    currency: 'WLT',
    tags: ["#ArcadeChallenge26"],
    subscriptions: 14,
    onlineGames: 0,
    deadline: "2026-09-15T00:00:00Z",
    fullDescription: fullDesc,
    examples: mockExamples,
    participants: mockParticipants,
    videoUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4'
  },
  {
    id: "bty_002",
    title: "Casual Casino Plinko",
    description: "Create a web3 Plinko game. Must classify as 18+ due to crypto mechanics. Social casino mechanics preferred.",
    state: "RUNNING",
    category: "Casino",
    prizePool: 15000,
    currency: 'USD',
    tags: ["#Web3Plinko"],
    subscriptions: 45,
    onlineGames: 2,
    deadline: "2026-08-01T00:00:00Z",
    fullDescription: fullDesc,
    examples: mockExamples,
    participants: mockParticipants
  },
  {
    id: "bty_003",
    title: "Puzzle Match-3 Showdown",
    description: "A classic match-3 puzzle game with a twist. The game with the highest 30-day retention wins.",
    state: "ONLINE",
    category: "Puzzle",
    prizePool: 80000,
    currency: 'WLT',
    tags: ["#Match3Mastery"],
    subscriptions: 21,
    onlineGames: 5,
    deadline: "2026-07-01T00:00:00Z",
    battleEnd: "2026-09-10T00:00:00Z",
    fullDescription: fullDesc,
    examples: mockExamples,
    participants: mockParticipants,
    publishedGames: mockPublished,
    totalScore: 97800,
    myGameName: 'Neon Rush 2026',
    myGameScore: 60000
  },
  {
    id: "bty_004",
    title: "Tower Defense Mini",
    description: "Mini auto-battler or tower defense game.",
    state: "CLOSED",
    category: "Strategy",
    prizePool: 10000,
    currency: 'USD',
    tags: ["#TDMini"],
    subscriptions: 12,
    onlineGames: 4,
    deadline: "2026-05-01T00:00:00Z",
    battleEnd: "2026-06-30T00:00:00Z",
    fullDescription: fullDesc,
    examples: mockExamples,
    participants: mockParticipants,
    publishedGames: mockPublished,
    winners: mockWinners,
    totalScore: 119640,
    myGameName: 'Neon Rush 2026',
    myGameScore: 60000
  },
  {
    id: "bty_005",
    title: "Cyberpunk Roguelike Battle",
    description: "Build a high-intensity roguelike deckbuilder with fast-paced tactical battles.",
    state: "ONLINE",
    category: "Role-Playing",
    prizePool: 50000,
    currency: 'WLT',
    tags: ["#RoguelikeBattle"],
    subscriptions: 18,
    onlineGames: 3,
    deadline: "2026-06-01T00:00:00Z",
    battleEnd: "2026-09-25T00:00:00Z",
    fullDescription: fullDesc,
    examples: mockExamples,
    participants: mockParticipants,
    publishedGames: [
      { creator: mockParticipants[1], gameName: 'Cyber Rogue', prize: '25,000 WLT', uu: 9100, reviewScore: 4.6, performanceScore: 41860 }
    ],
    totalScore: 41860
    // Note: myGameScore is intentionally undefined so it displays "-"
  }
];

export interface BountyScores {
  totalScore: string;
  myScore: string;
  myGameName?: string;
}

/**
 * Calculates current total bounty scores and my game score.
 * Rules:
 * - Only available on ONLINE and CLOSED states.
 * - If the bounty or the user's game has no scores, "-" is returned.
 */
export function getBountyScores(bounty: Bounty, currentUserName?: string): BountyScores {
  // If not online and not closed, scores do not apply yet
  if (bounty.state !== 'ONLINE' && bounty.state !== 'CLOSED') {
    return {
      totalScore: '-',
      myScore: '-',
      myGameName: undefined
    };
  }

  // 1. Calculate total bounty score
  let totalScoreNum = 0;
  if (typeof bounty.totalScore === 'number' && bounty.totalScore > 0) {
    totalScoreNum = bounty.totalScore;
  } else {
    const list = bounty.state === 'CLOSED'
      ? (bounty.winners && bounty.winners.length > 0 ? bounty.winners : bounty.publishedGames || [])
      : (bounty.publishedGames || []);
    totalScoreNum = list.reduce((sum, item) => sum + (item.performanceScore || 0), 0);
  }

  // 2. Calculate my game score
  let myScoreNum: number | undefined = bounty.myGameScore;
  let myGameName = bounty.myGameName;

  if (myScoreNum === undefined) {
    const allGames = [...(bounty.publishedGames || []), ...(bounty.winners || [])];
    const match = allGames.find(g =>
      g.creator.name === 'AlexTheDev' ||
      (currentUserName && g.creator.name.toLowerCase() === currentUserName.toLowerCase())
    );
    if (match && typeof match.performanceScore === 'number' && match.performanceScore > 0) {
      myScoreNum = match.performanceScore;
      myGameName = match.gameName;
    }
  }

  return {
    totalScore: totalScoreNum > 0 ? totalScoreNum.toLocaleString() : '-',
    myScore: myScoreNum !== undefined && myScoreNum > 0 ? myScoreNum.toLocaleString() : '-',
    myGameName: myScoreNum !== undefined && myScoreNum > 0 ? myGameName : undefined
  };
}

/**
 * Checks whether a creator can unsubscribe from a bounty.
 * Creators can only unsubscribe on bounties with open status ('OPEN') and development stages ('RUNNING').
 * Once a bounty reaches 'ONLINE' (Traffic Battle) or 'CLOSED' (Settled), unsubscription is locked.
 */
export function canUnsubscribeFromBounty(state: BountyState): boolean {
  return state === 'OPEN' || state === 'RUNNING';
}

