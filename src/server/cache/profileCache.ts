/**
 * In-memory profile cache with TTL.
 * Avoids hitting Supabase DB on every socket connection.
 * Entries expire after 5 minutes; active games keep the entry alive.
 */

interface CachedProfile {
  username: string;
  avatar_id: string;
  rank_tier: string;
  rank_stars: number;
  rank_points: number;
  level: number;
  expiresAt: number;
}

const TTL_MS = 5 * 60 * 1000; // 5 minutes
const cache = new Map<string, CachedProfile>();

// Evict expired entries periodically (every 2 min)
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (entry.expiresAt < now) cache.delete(key);
  }
}, 2 * 60 * 1000);

export function getCachedProfile(userId: string): CachedProfile | null {
  const entry = cache.get(userId);
  if (!entry || entry.expiresAt < Date.now()) {
    cache.delete(userId);
    return null;
  }
  return entry;
}

export function setCachedProfile(userId: string, profile: Omit<CachedProfile, "expiresAt">) {
  cache.set(userId, { ...profile, expiresAt: Date.now() + TTL_MS });
}

export function invalidateCachedProfile(userId: string) {
  cache.delete(userId);
}

export function refreshProfileTTL(userId: string) {
  const entry = cache.get(userId);
  if (entry) entry.expiresAt = Date.now() + TTL_MS;
}
