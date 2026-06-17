# Snake & Ladder — Local Setup

## 1. Install dependencies (already done)
```
npm install
```

## 2. Configure environment
Edit `.env.local`:
- Go to https://supabase.com → New project
- Project Settings → API → copy:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`

## 3. Run database migrations
- In Supabase dashboard → SQL Editor
- Paste and run: `supabase/migrations/001_initial_schema.sql`

## 4. Start the development server

**Option A — Full (with Socket.io + Next.js combined):**
```
npm run dev
```
This runs `ts-node server.ts` which boots both Next.js AND Socket.io on port 3000.

**Option B — Next.js only (no multiplayer, but single-player works):**
```
npx next dev --turbopack
```

## 5. Open the app
- http://localhost:3000

## Project structure
```
src/
  app/              Next.js pages (App Router)
  components/
    3d/             Three.js / R3F components
    game/           In-game UI (controls, chat, player panel)
    lobby/          Room management UI
    profile/        Profile, avatar picker, match history
    layout/         Navbar, providers
    ui/             Shadcn UI primitives
  hooks/            useAuth, useSocket, useGame, useProfile
  lib/
    game/           Core game engine (no dependencies)
    socket/         Client socket factory
    supabase/       Supabase clients (browser / server / admin)
  server/
    socket/         Socket.io server + event handlers
    game/           GameRoom class (in-memory state)
  stores/           Zustand state (auth, game, room)
  types/            TypeScript interfaces
public/
  assets/
    models/         Place .glb 3D models here (optional)
    textures/       Place board/dice textures here (optional)
    sounds/         Sound effects (optional)
supabase/
  migrations/       SQL to run in Supabase dashboard
```

## Where to get 3D assets (optional)
The game is fully playable with procedural 3D geometry (no files needed).
To add real 3D models, place `.glb` files in `public/assets/models/`:
- Avatars: https://sketchfab.com (search "low poly character", CC license)
- Dice: https://sketchfab.com (search "dice 3d")
- Game pieces: https://sketchfab.com (search "board game token")
