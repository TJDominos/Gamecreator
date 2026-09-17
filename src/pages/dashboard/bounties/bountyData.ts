export type BountyState = "DRAFT" | "OPEN" | "RUNNING" | "ONLINE" | "CLOSED";
export type Category =
  | "Casino"
  | "Puzzle"
  | "Card & Board"
  | "Simulation"
  | "Arcade"
  | "Strategy"
  | "Word"
  | "Trivia"
  | "Role-Playing"
  | "Sports"
  | "Music";

export interface Creator {
  id: string;
  name: string;
  avatar: string;
  joinedAt?: number;
}

export interface GameExample {
  id: string;
  title: string;
  thumbnail: string;
  url: string;
}

export interface PublishedGame {
  id?: string;
  gameId?: string;
  creator: Creator;
  gameName: string;
  prize?: string;
  uu?: number;
  reviewScore?: number;
  performanceScore?: number;
}

export interface Winner extends PublishedGame {}

export interface Bounty {
  id: string;
  title: string;
  description: string;
  state: BountyState;
  category: Category;
  prizePool: number;
  currency: "WLT" | "USD";
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
  isSubscribed?: boolean;
}

export interface BountyScores {
  totalScore: string;
  myScore: string;
  myGameName?: string;
}

export function getBountyScores(bounty: Bounty, currentUserName?: string): BountyScores {
  if (bounty.state !== "ONLINE" && bounty.state !== "CLOSED") {
    return { totalScore: "-", myScore: "-", myGameName: undefined };
  }

  const games = bounty.state === "CLOSED" && bounty.winners?.length
    ? bounty.winners
    : bounty.publishedGames || [];
  const totalScore = bounty.totalScore ?? games.reduce(
    (sum, game) => sum + (game.performanceScore || 0),
    0,
  );

  let myScore = bounty.myGameScore;
  let myGameName = bounty.myGameName;
  if (myScore === undefined) {
    const allGames = [...(bounty.publishedGames || []), ...(bounty.winners || [])];
    const match = allGames.find((game) =>
      currentUserName && game.creator.name.toLowerCase() === currentUserName.toLowerCase(),
    );
    myScore = match?.performanceScore;
    myGameName = match?.gameName;
  }

  return {
    totalScore: totalScore > 0 ? totalScore.toLocaleString() : "-",
    myScore: myScore && myScore > 0 ? myScore.toLocaleString() : "-",
    myGameName: myScore && myScore > 0 ? myGameName : undefined,
  };
}

export function canUnsubscribeFromBounty(state: BountyState): boolean {
  return state === "OPEN" || state === "RUNNING";
}
