import type { Snake, Ladder } from "@/types/game";

export const BOARD_SIZE = 100;
export const GRID_COLS = 10;
export const GRID_ROWS = 10;

// Classic snake & ladder positions
export const SNAKES: Snake[] = [
  { head: 99, tail: 54 },
  { head: 90, tail: 48 },
  { head: 85, tail: 35 },
  { head: 74, tail: 53 },
  { head: 64, tail: 18 },
  { head: 57, tail: 33 },
  { head: 47, tail: 26 },
  { head: 40, tail: 3 },
  { head: 32, tail: 10 },
];

export const LADDERS: Ladder[] = [
  { bottom: 2, top: 38 },
  { bottom: 7, top: 14 },
  { bottom: 8, top: 30 },
  { bottom: 15, top: 26 },
  { bottom: 21, top: 42 },
  { bottom: 28, top: 76 },
  { bottom: 50, top: 67 },
  { bottom: 71, top: 92 },
  { bottom: 78, top: 98 },
  { bottom: 88, top: 97 },
];

export const DICE_FACES = [1, 2, 3, 4, 5, 6] as const;

export const XP_PER_WIN = 120;
export const XP_PER_LOSS = 30;
export const XP_PER_LEVEL = 200;

export const RANK_POINTS_WIN = 25;
export const RANK_POINTS_LOSS = -10;
export const RANK_POINTS_WIN_BONUS_MULTIPLIER = 1.5; // bonus if opponent higher ranked

// Board cell number to [row, col] (0-indexed, bottom-left origin)
// Row 0 = bottom row (1-10), Row 9 = top row (91-100)
// Odd rows go left→right, even rows go right→left (snaking pattern)
export function cellToCoords(cell: number): { row: number; col: number } {
  const idx = cell - 1;
  const row = Math.floor(idx / GRID_COLS);
  const col = row % 2 === 0 ? idx % GRID_COLS : GRID_COLS - 1 - (idx % GRID_COLS);
  return { row, col };
}

export function coordsToCell(row: number, col: number): number {
  const idx = row % 2 === 0
    ? row * GRID_COLS + col
    : row * GRID_COLS + (GRID_COLS - 1 - col);
  return idx + 1;
}
