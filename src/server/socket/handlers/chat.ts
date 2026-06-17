import type { Server, Socket } from "socket.io";
import type { ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData, ChatMessage } from "@/types/socket";
import { generateId } from "@/lib/utils";

type IoServer = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
type IoSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

const MAX_MSG_LENGTH = 200;

export function registerChatHandlers(io: IoServer, socket: IoSocket) {
  socket.on("chat:message", (message: string) => {
    const roomId = socket.data.roomId;
    if (!roomId) return;

    const sanitized = message.trim().slice(0, MAX_MSG_LENGTH);
    if (!sanitized) return;

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
}
