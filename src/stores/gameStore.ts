import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { GameState, GameMove } from "@/types/game";
import type { ChatMessage } from "@/types/socket";

export interface TypingUser {
  userId: string;
  username: string;
}

interface GameStore {
  gameState: GameState | null;
  pendingMove: GameMove | null;
  lastMove: GameMove | null;
  isRolling: boolean;
  /** Dice value being revealed (shown as overlay ~1s before piece moves) */
  diceReveal: number | null;
  chatMessages: ChatMessage[];
  /** Users currently typing in the chat */
  typingUsers: TypingUser[];
  /** Unread messages count (incremented when chat panel is not focused) */
  unreadChatCount: number;
  showWinModal: boolean;
  isReconnecting: boolean;

  setGameState: (state: GameState | null) => void;
  setPendingMove: (move: GameMove | null) => void;
  setLastMove: (move: GameMove | null) => void;
  setRolling: (rolling: boolean) => void;
  setDiceReveal: (value: number | null) => void;
  addChatMessage: (msg: ChatMessage) => void;
  setTypingUser: (user: TypingUser, isTyping: boolean) => void;
  incrementUnread: () => void;
  clearUnread: () => void;
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
      diceReveal: null,
      chatMessages: [],
      typingUsers: [],
      unreadChatCount: 0,
      showWinModal: false,
      isReconnecting: false,

      setGameState: (gameState) => set({ gameState: gameState ?? null }),
      setPendingMove: (pendingMove) => set({ pendingMove }),
      setLastMove: (lastMove) => set({ lastMove }),
      setRolling: (isRolling) => set({ isRolling }),
      setDiceReveal: (diceReveal) => set({ diceReveal }),
      addChatMessage: (msg) =>
        set((s) => ({ chatMessages: [...s.chatMessages.slice(-99), msg] })),
      setTypingUser: (user, isTyping) =>
        set((s) => ({
          typingUsers: isTyping
            ? s.typingUsers.some((u) => u.userId === user.userId)
              ? s.typingUsers
              : [...s.typingUsers, user]
            : s.typingUsers.filter((u) => u.userId !== user.userId),
        })),
      incrementUnread: () => set((s) => ({ unreadChatCount: s.unreadChatCount + 1 })),
      clearUnread: () => set({ unreadChatCount: 0 }),
      setShowWinModal: (showWinModal) => set({ showWinModal }),
      setReconnecting: (isReconnecting) => set({ isReconnecting }),
      reset: () =>
        set({
          gameState: null,
          pendingMove: null,
          lastMove: null,
          isRolling: false,
          diceReveal: null,
          chatMessages: [],
          typingUsers: [],
          unreadChatCount: 0,
          showWinModal: false,
          isReconnecting: false,
        }),
    }),
    {
      name: "sal-game",
      partialize: (state) => ({
        gameState: state.gameState,
        chatMessages: state.chatMessages.slice(-20),
      }),
    }
  )
);
