import { SNAKES, LADDERS, BOARD_SIZE, XP_PER_WIN, XP_PER_LOSS, XP_PER_LEVEL, RANK_POINTS_WIN, RANK_POINTS_LOSS } from "./constants";
import type { GameState, GamePlayer, GameMove, PlayerRank, RankTier } from "@/types/game";

// ── Dice ────────────────────────────────────────────────────────────────────

export function rollDice(): number {
  return Math.floor(Math.random() * 6) + 1;
}

// ── Position resolution ─────────────────────────────────────────────────────

export function resolvePosition(from: number, diceValue: number): {
  newPosition: number;
  hadSnake: boolean;
  hadLadder: boolean;
  snakeFrom?: number;
  ladderFrom?: number;
} {
  let newPosition = from + diceValue;
  let hadSnake = false;
  let hadLadder = false;
  let snakeFrom: number | undefined;
  let ladderFrom: number | undefined;

  if (newPosition > BOARD_SIZE) {
    // Bounce back (can't exceed 100)
    newPosition = BOARD_SIZE - (newPosition - BOARD_SIZE);
    return { newPosition, hadSnake, hadLadder };
  }

  // Check for snake
  const snake = SNAKES.find((s) => s.head === newPosition);
  if (snake) {
    snakeFrom = newPosition;
    newPosition = snake.tail;
    hadSnake = true;
  }

  // Check for ladder (can't have both on same square)
  if (!hadSnake) {
    const ladder = LADDERS.find((l) => l.bottom === newPosition);
    if (ladder) {
      ladderFrom = newPosition;
      newPosition = ladder.top;
      hadLadder = true;
    }
  }

  return { newPosition, hadSnake, hadLadder, snakeFrom, ladderFrom };
}

// ── Turn management ─────────────────────────────────────────────────────────

export function getNextPlayerIndex(state: GameState): number {
  return (state.currentPlayerIndex + 1) % state.players.length;
}

export function isWinner(position: number): boolean {
  return position === BOARD_SIZE;
}

// ── Rank calculation ────────────────────────────────────────────────────────

const TIER_ORDER: RankTier[] = ["bronze", "silver", "gold", "platinum", "diamond", "legend"];
const TIER_STAR_POINTS = 20; // points per star within tier
const TIER_PROMOTION_STARS = 5;
const TIER_DEMOTION_FLOOR = 0;

export function calculateNewRank(rank: PlayerRank, won: boolean): PlayerRank {
  const delta = won ? RANK_POINTS_WIN : RANK_POINTS_LOSS;
  const newPoints = Math.max(0, rank.points + delta);

  return computeRankFromPoints(newPoints);
}

export function computeRankFromPoints(points: number): PlayerRank {
  const tierThresholds: Record<RankTier, number> = {
    bronze: 0,
    silver: 100,
    gold: 300,
    platinum: 600,
    diamond: 1100,
    legend: 2000,
  };

  let tier: RankTier = "bronze";
  for (const t of TIER_ORDER) {
    if (points >= tierThresholds[t]) tier = t;
    else break;
  }

  const tierBase = tierThresholds[tier];
  const nextTier = TIER_ORDER[TIER_ORDER.indexOf(tier) + 1];
  const tierCap = nextTier ? tierThresholds[nextTier] : Infinity;
  const withinTier = points - tierBase;
  const tierRange = tierCap === Infinity ? 500 : tierThresholds[nextTier] - tierBase;
  const stars = Math.min(5, Math.floor((withinTier / tierRange) * 5));

  return { tier, stars, totalStars: computeTotalStars(tier, stars), points };
}

function computeTotalStars(tier: RankTier, stars: number): number {
  const tierIdx = TIER_ORDER.indexOf(tier);
  return tierIdx * 5 + stars;
}

export function calculateXpGain(won: boolean): number {
  return won ? XP_PER_WIN : XP_PER_LOSS;
}

export function calculateLevel(xp: number): { level: number; xpInLevel: number; xpForNext: number } {
  const level = Math.floor(xp / XP_PER_LEVEL) + 1;
  const xpInLevel = xp % XP_PER_LEVEL;
  return { level, xpInLevel, xpForNext: XP_PER_LEVEL };
}

// ── AI (single player) ──────────────────────────────────────────────────────

export function makeAiMove(player: GamePlayer): number {
  return rollDice();
}

// ── Full game state factory ─────────────────────────────────────────────────

export function createInitialGameState(roomId: string, players: GamePlayer[]): GameState {
  return {
    roomId,
    status: "playing",
    players: players.map((p) => ({ ...p, position: 0 })),
    currentPlayerIndex: 0,
    dice: { value: 1, rolling: false },
    moveHistory: [],
    winner: null,
    startedAt: Date.now(),
    finishedAt: null,
    snakes: SNAKES,
    ladders: LADDERS,
  };
}

export function applyMove(state: GameState, playerId: string, diceValue: number): {
  newState: GameState;
  move: GameMove;
} {
  const playerIndex = state.players.findIndex((p) => p.id === playerId);
  if (playerIndex === -1) throw new Error("Player not found");

  const player = state.players[playerIndex];
  const { newPosition, hadSnake, hadLadder } = resolvePosition(player.position, diceValue);

  const move: GameMove = {
    playerId,
    from: player.position,
    to: newPosition,
    diceValue,
    hadSnake,
    hadLadder,
    timestamp: Date.now(),
  };

  const updatedPlayers = state.players.map((p, i) =>
    i === playerIndex ? { ...p, position: newPosition } : p
  );

  const winner = isWinner(newPosition) ? updatedPlayers[playerIndex] : null;

  const newState: GameState = {
    ...state,
    players: updatedPlayers,
    currentPlayerIndex: winner ? state.currentPlayerIndex : getNextPlayerIndex(state),
    dice: { value: diceValue, rolling: false },
    moveHistory: [...state.moveHistory, move],
    winner,
    status: winner ? "finished" : "playing",
    finishedAt: winner ? Date.now() : null,
  };

  return { newState, move };
}
