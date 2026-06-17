# Snake & Ladder 3D

A real-time multiplayer Snake & Ladder game with 3D visuals, bot mode, rank system, and PWA support.

**Live:** https://snake-and-ladder-ynq8.onrender.com  
**Repo:** https://github.com/ranjanpalai69/snake-and-ladder

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 16, React 18, Tailwind CSS, Framer Motion |
| 3D Engine | Three.js (TubeGeometry, CatmullRomCurve3, OrbitControls) |
| Realtime | Socket.io 4 (WebSocket + polling fallback) |
| Auth & DB | Supabase (Auth, PostgreSQL, RLS) |
| State | Zustand (persisted stores) |
| PWA | next-pwa (offline support, installable) |
| Deploy | Render (Node.js web service, single port) |
| Sounds | Web Audio API (no external library) |

---

## Features

- **3D Board** — flat snakes with S-curve body, raised ladders with dual rails
- **Animations** — cell-by-cell piece movement, snake bite, ladder climb, win fanfare
- **Sound Effects** — dice roll, step tick, snake hiss, ladder chime, win melody
- **Multiplayer** — real-time rooms, chat, reconnect grace period (90s), rank updates
- **Bot Mode** — single-player vs AI bot with auto-roll
- **Rank System** — Bronze → Silver → Gold → Platinum tiers with star progression
- **Leaderboard** — global rank by rank points
- **Profile** — avatars, match history, XP/level
- **PWA** — installable, offline page

---

## Project Structure

```
snake-and-ladder/
├── server.ts                    # Entry point — Next.js + Socket.io on same port
├── server-setup.cjs             # Module aliases for tsx
├── src/
│   ├── app/
│   │   ├── (auth)/login/        # Login page
│   │   ├── (auth)/signup/       # Signup page
│   │   ├── (game)/game/[roomId] # Multiplayer game room
│   │   ├── (game)/lobby/        # Room browser
│   │   ├── (game)/single-player # Solo + bot mode
│   │   ├── leaderboard/         # Global leaderboard
│   │   ├── profile/             # User profile
│   │   └── auth/callback/       # Supabase OAuth callback
│   ├── components/
│   │   ├── 3d/
│   │   │   ├── ThreeScene.tsx   # Full 3D board, snakes, ladders, pieces, animations
│   │   │   └── DynamicScene.tsx # Dynamic import wrapper (SSR-safe)
│   │   ├── game/                # GameControls, PlayerPanel, ChatPanel, WinModal
│   │   ├── lobby/               # CreateRoomModal, JoinByCodeModal, RoomCard
│   │   ├── profile/             # AvatarPicker, MatchHistory, StatsCard
│   │   └── layout/              # Navbar, Providers (Socket init)
│   ├── lib/
│   │   ├── game/
│   │   │   ├── constants.ts     # Board layout, snake/ladder positions, XP constants
│   │   │   └── engine.ts        # Pure game logic (applyMove, rollDice, rank calc)
│   │   ├── sounds.ts            # Web Audio API sound effects
│   │   └── supabase/            # Client, server, middleware helpers
│   ├── server/
│   │   ├── socket/
│   │   │   ├── index.ts         # Socket.io server setup, auth middleware, CORS
│   │   │   └── handlers/        # room.ts, game.ts, chat.ts
│   │   ├── game/GameRoom.ts     # In-memory room state, reconnect logic
│   │   └── cache/profileCache.ts # TTL cache for profile lookups
│   ├── stores/
│   │   ├── authStore.ts         # Auth state (persisted)
│   │   ├── roomStore.ts         # Room state (persisted)
│   │   └── gameStore.ts         # Game state + lastMove trigger
│   ├── hooks/                   # useAuth, useGame, useProfile, useSocket
│   └── types/                   # game.ts, room.ts, socket.ts, supabase.ts
├── supabase/migrations/
│   └── 001_initial_schema.sql   # Full DB schema (run once in Supabase)
├── render.yaml                  # Render Blueprint deploy config
├── .npmrc                       # legacy-peer-deps=true (eslint peer fix)
└── public/
    ├── manifest.json            # PWA manifest
    └── assets/icons/            # PWA icons (all sizes)
```

---

## Local Development

### Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project (free tier works)

### 1. Clone

```bash
git clone https://github.com/ranjanpalai69/snake-and-ladder.git
cd snake-and-ladder
```

### 2. Install

```bash
npm install
```

### 3. Environment Variables

Create `.env.local` in the project root:

```env
# Supabase — Project Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Local app URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
PORT=3000
```

### 4. Database Setup

In [Supabase Dashboard](https://supabase.com/dashboard) → SQL Editor, run:

```sql
-- Paste the full contents of supabase/migrations/001_initial_schema.sql
```

This creates: `profiles`, `matches`, `match_players` tables, RLS policies, leaderboard view, and auth triggers.

### 5. Supabase Auth Setup

In Supabase Dashboard → Authentication → URL Configuration:
- **Site URL:** `http://localhost:3000`
- **Redirect URLs:** `http://localhost:3000/auth/callback`

### 6. Run

```bash
npm run dev
```

Opens at **http://localhost:3000**. The server runs Next.js and Socket.io on the same port.

---

## Architecture

### Single Port Design

`server.ts` starts an HTTP server, attaches Socket.io to it, then passes the same `httpServer` to `next.js` request handler. Both share port 3000 (dev) / 10000 (prod).

```
HTTP Request → server.ts
  ├── /socket.io/*  → Socket.io handler
  └── everything else → Next.js handler
```

### 3D Scene (ThreeScene.tsx)

- **Board:** 10×10 grid of `BoxGeometry` tiles with alternating colors
- **Snakes:** `CatmullRomCurve3` S-curve in XZ plane → `TubeGeometry`, flat on board at Y=0.26
- **Ladders:** Dual-rail `TubeGeometry` at Y=0.44 (above snakes), with `CylinderGeometry` rungs
- **Pieces:** `CylinderGeometry` at Y=0.38
- **Camera:** Auto-fit via FOV math — fits 10×10 board for any screen size/orientation
- **Animation:** Ref-based sequential queue, each step has `duration / update(t) / onStart / onEnd`

### Game Engine (engine.ts)

Pure functions, no side effects:
- `rollDice()` → 1-6
- `applyMove(state, playerId, diceValue)` → `{ newState, move }`
- `move` carries `hadSnake / hadLadder / from / to` — ThreeScene watches `lastMove` in gameStore to trigger animations

### Rank System

```
bronze(0-5★) → silver(0-5★) → gold(0-5★) → platinum
Win: +25 pts | Loss: -10 pts | 100pts = 1★ | 5★ = tier up
```

---

## Deployment (Render)

The repo includes `render.yaml` for one-click Blueprint deploy.

### Manual Steps After Deploy

1. Go to your Render service → **Environment** tab
2. Set these variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_APP_URL` → your Render URL (e.g. `https://snake-and-ladder-ynq8.onrender.com`)

3. In Supabase → Authentication → URL Configuration → Redirect URLs:
   - Add `https://snake-and-ladder-ynq8.onrender.com/auth/callback`

4. Trigger a redeploy (Render dashboard → Manual Deploy)

### One-Click Deploy

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/ranjanpalai69/snake-and-ladder)

---

## Socket Events

| Event | Direction | Description |
|---|---|---|
| `room:create` | C→S | Create a new room |
| `room:join` | C→S | Join by room ID |
| `room:leave` | C→S | Leave room |
| `room:reconnect` | C→S | Rejoin after disconnect |
| `game:roll` | C→S | Roll dice |
| `game:move` | S→C | Move result + new state |
| `game:state` | S→C | Full state sync |
| `game:finished` | S→C | Game over |
| `chat:send` | C→S | Send chat message |
| `chat:message` | S→C | Receive chat message |
| `room:updated` | S→C | Room metadata changed |
| `room:player:left` | S→C | Player removed |

---

## Snake & Ladder Positions

**Snakes (head → tail)**

| Head | Tail |
|------|------|
| 99 | 54 |
| 90 | 48 |
| 85 | 35 |
| 74 | 53 |
| 64 | 18 |
| 57 | 33 |
| 47 | 26 |
| 40 | 3 |
| 32 | 10 |

**Ladders (bottom → top)**

| Bottom | Top |
|--------|-----|
| 2 | 38 |
| 7 | 14 |
| 8 | 30 |
| 15 | 26 |
| 21 | 42 |
| 28 | 76 |
| 50 | 67 |
| 71 | 92 |
| 78 | 98 |
| 88 | 97 |

---

## License

MIT
