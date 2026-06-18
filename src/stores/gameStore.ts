import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { GameState, GameMove } from "@/types/game";
import type { ChatMessage } from "@/types/socket";

interface GameStore {
  gameState: GameState | null;
  pendingMove: GameMove | null;
  lastMove: GameMove | null;
  isRolling: boolean;
  chatMessages: ChatMessage[];
  showWinModal: boolean;
  /** Whether we're currently mid-reconnect attempt */
  isReconnecting: boolean;

  setGameState: (state: GameState | null) => void;
  setPendingMove: (move: GameMove | null) => void;
  setLastMove: (move: GameMove | null) => void;
  setRolling: (rolling: boolean) => void;
  addChatMessage: (msg: ChatMessage) => void;
  setShowWinModal: (show: boolean) => void;
  setReconnecting: (v: boolean) => void;
  reset: () => void;
}

export const useGameStore = create<GameStore>()(
  persist(
    (set) => ({
      gameState: null,
      pendingMove: null,
      lastMove: null,
      isRolling: false,
      chatMessages: [],
      showWinModal: false,
      isReconnecting: false,

      setGameState: (gameState) => set({ gameState: gameState ?? null }),
      setPendingMove: (pendingMove) => set({ pendingMove }),
      setLastMove: (lastMove) => set({ lastMove }),
      setRolling: (isRolling) => set({ isRolling }),
      addChatMessage: (msg) =>
        set((s) => ({ chatMessages: [...s.chatMessages.slice(-99), msg] })),
      setShowWinModal: (showWinModal) => set({ showWinModal }),
      setReconnecting: (isReconnecting) => set({ isReconnecting }),
      reset: () =>
        set({
          gameState: null,
          pendingMove: null,
          lastMove: null,
          isRolling: false,
          chatMessages: [],
          showWinModal: false,
          isReconnecting: false,
        }),
    }),
    {
      name: "sal-game",
      // Persist game state and chat so the board is visible immediately on refresh
      partialize: (state) => ({
        gameState: state.gameState,
        chatMessages: state.chatMessages.slice(-20), // Keep last 20 messages
      }),
    }
  )
);
