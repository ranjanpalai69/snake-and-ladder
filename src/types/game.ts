export type GameStatus = "waiting" | "starting" | "playing" | "finished";
export type PlayerColor = "red" | "blue" | "green" | "yellow" | "purple" | "orange";
export type AvatarId = "avatar_01" | "avatar_02" | "avatar_03" | "avatar_04" | "avatar_05" | "avatar_06";

export interface Snake {
  head: number;
  tail: number;
}

export interface Ladder {
  bottom: number;
  top: number;
}

export interface BoardCell {
  number: number;
  row: number;
  col: number;
  hasSnakeHead?: number;   // tail position
  hasSnakeTail?: number;   // head position
  hasLadderBottom?: number; // top position
  hasLadderTop?: number;   // bottom position
}

export interface Dice {
  value: number;
  rolling: boolean;
}

export interface GameMove {
  playerId: string;
  from: number;
  to: number;
  diceValue: number;
  hadSnake: boolean;
  hadLadder: boolean;
  /** Player rolled 6 — they get another turn (unless they won) */
  rolledSix: boolean;
  /** Player couldn't move because dice would overshoot 100 */
  wasBlocked: boolean;
  timestamp: number;
}

export interface GameState {
  roomId: string;
  status: GameStatus;
  players: GamePlayer[];
  currentPlayerIndex: number;
  dice: Dice;
  moveHistory: GameMove[];
  winner: GamePlayer | null;
  startedAt: number | null;
  finishedAt: number | null;
  snakes: Snake[];
  ladders: Ladder[];
}

export interface GamePlayer {
  id: string;
  userId: string;
  username: string;
  avatarId: AvatarId;
  color: PlayerColor;
  position: number;
  isReady: boolean;
  isConnected: boolean;
  rank: PlayerRank;
  level: number;
}

export interface PlayerRank {
  tier: RankTier;
  stars: number;      // 0-5 stars within tier
  totalStars: number; // cumulative
  points: number;
}

export type RankTier = "bronze" | "silver" | "gold" | "platinum" | "diamond" | "legend";

export const RANK_THRESHOLDS: Record<RankTier, number> = {
  bronze: 0,
  silver: 100,
  gold: 250,
  platinum: 500,
  diamond: 1000,
  legend: 2000,
};

export const RANK_COLORS: Record<RankTier, string> = {
  bronze: "#CD7F32",
  silver: "#C0C0C0",
  gold: "#FFD700",
  platinum: "#E5E4E2",
  diamond: "#B9F2FF",
  legend: "#FF10F0",
};

export const PLAYER_COLORS: Record<PlayerColor, string> = {
  red: "#EF4444",
  blue: "#3B82F6",
  green: "#22C55E",
  yellow: "#EAB308",
  purple: "#A855F7",
  orange: "#F97316",
};

export const AVATAR_OPTIONS: AvatarId[] = [
  "avatar_01", "avatar_02", "avatar_03",
  "avatar_04", "avatar_05", "avatar_06",
];
