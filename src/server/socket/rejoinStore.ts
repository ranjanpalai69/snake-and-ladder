export interface PendingRejoinInvite {
  roomId: string;
  roomName: string;
  invitedBy: string;
  expiresAt: number;
}

// userId → pending invite (lasts 90 seconds, matching the reconnect grace period)
export const pendingRejoinInvites = new Map<string, PendingRejoinInvite>();

// Purge expired entries every 2 minutes
setInterval(() => {
  const now = Date.now();
  for (const [userId, invite] of pendingRejoinInvites.entries()) {
    if (invite.expiresAt < now) pendingRejoinInvites.delete(userId);
  }
}, 2 * 60 * 1000);
