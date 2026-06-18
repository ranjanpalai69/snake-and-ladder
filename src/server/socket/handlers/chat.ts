import type { Server, Socket } from "socket.io";
import type { ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData, ChatMessage } from "@/types/socket";
import { generateId } from "@/lib/utils";

type IoServer = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
type IoSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

const MAX_MSG_LENGTH = 200;
// Auto-clear typing indicator after 5s in case client disconnects without clearing
const TYPING_TIMEOUT_MS = 5_000;

export function registerChatHandlers(io: IoServer, socket: IoSocket) {
  let typingTimer: ReturnType<typeof setTimeout> | null = null;

  function clearTyping() {
    const roomId = socket.data.roomId;
    if (roomId) {
      socket.to(roomId).emit("chat:typing", {
        userId: socket.data.userId,
        username: socket.data.username,
        isTyping: false,
      });
    }
    if (typingTimer) { clearTimeout(typingTimer); typingTimer = null; }
  }

  socket.on("chat:message", (message: string) => {
    const roomId = socket.data.roomId;
    if (!roomId) return;

    const sanitized = message.trim().slice(0, MAX_MSG_LENGTH);
    if (!sanitized) return;

    // Stop typing indicator when message is sent
    clearTyping();

    const chatMessage: ChatMessage = {
      id: generateId(),
      userId: socket.data.userId,
      username: socket.data.username,
      avatarId: socket.handshake.auth.avatarId ?? "avatar_01",
      message: sanitized,
      timestamp: Date.now(),
    };

    io.to(roomId).emit("chat:message", chatMessage);
  });

  socket.on("chat:typing", ({ isTyping }) => {
    const roomId = socket.data.roomId;
    if (!roomId) return;

    // Broadcast to everyone else in the room
    socket.to(roomId).emit("chat:typing", {
      userId: socket.data.userId,
      username: socket.data.username,
      isTyping,
    });

    // Auto-clear after timeout (safety net)
    if (isTyping) {
      if (typingTimer) clearTimeout(typingTimer);
      typingTimer = setTimeout(clearTyping, TYPING_TIMEOUT_MS);
    } else {
      if (typingTimer) { clearTimeout(typingTimer); typingTimer = null; }
    }
  });

  socket.on("disconnect", clearTyping);
}
