import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Room, RoomSummary } from "@/types/room";

interface RoomStore {
  currentRoom: Room | null;
  publicRooms: RoomSummary[];
  isConnected: boolean;
  /** Persisted: the roomId the user was in before refresh */
  persistedRoomId: string | null;
  /** Live countdown seconds before game starts (null = no countdown) */
  countdown: number | null;

  setCurrentRoom: (room: Room | null) => void;
  setPublicRooms: (rooms: RoomSummary[]) => void;
  setConnected: (connected: boolean) => void;
  setPersistedRoomId: (id: string | null) => void;
  setCountdown: (n: number | null) => void;
  reset: () => void;
}

export const useRoomStore = create<RoomStore>()(
  persist(
    (set) => ({
      currentRoom: null,
      publicRooms: [],
      isConnected: false,
      persistedRoomId: null,
      countdown: null,

      setCurrentRoom: (currentRoom) =>
        set({ currentRoom, persistedRoomId: currentRoom?.id ?? null }),

      setPublicRooms: (publicRooms) => set({ publicRooms }),
      setConnected: (isConnected) => set({ isConnected }),
      setPersistedRoomId: (persistedRoomId) => set({ persistedRoomId }),
      setCountdown: (countdown) => set({ countdown }),
      reset: () => set({ currentRoom: null, publicRooms: [], isConnected: false, persistedRoomId: null, countdown: null }),
    }),
    {
      name: "sal-room",
      // Only persist the roomId — room object itself will be refreshed from server
      partialize: (state) => ({ persistedRoomId: state.persistedRoomId }),
    }
  )
);
