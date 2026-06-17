-- ════════════════════════════════════════════════════════════
-- Snake & Ladder — Initial Database Schema
-- Paste this in Supabase Dashboard → SQL Editor → Run
-- ════════════════════════════════════════════════════════════

-- Extensions
create extension if not exists "uuid-ossp";

-- ── PROFILES ────────────────────────────────────────────────
create table if not exists public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  username        text not null unique,
  avatar_id       text not null default 'avatar_01',
  bio             text,
  rank_tier       text not null default 'bronze',
  rank_stars      int  not null default 0 check (rank_stars >= 0 and rank_stars <= 5),
  rank_points     int  not null default 0,
  level           int  not null default 1,
  xp              int  not null default 0,
  total_matches   int  not null default 0,
  wins            int  not null default 0,
  losses          int  not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Auto-update updated_at
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger on_profile_updated
  before update on public.profiles
  for each row execute function public.handle_updated_at();

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, username, avatar_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'avatar_id', 'avatar_01')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── MATCHES ────────────────────────────────────────────────
create table if not exists public.matches (
  id          uuid primary key default uuid_generate_v4(),
  room_id     text not null,
  winner_id   uuid references public.profiles(id),
  status      text not null default 'waiting' check (status in ('waiting','playing','finished')),
  started_at  timestamptz,
  finished_at timestamptz,
  game_data   jsonb not null default '{}',
  created_at  timestamptz not null default now()
);

-- ── MATCH PLAYERS ──────────────────────────────────────────
create table if not exists public.match_players (
  id             uuid primary key default uuid_generate_v4(),
  match_id       uuid not null references public.matches(id) on delete cascade,
  user_id        uuid not null references public.profiles(id) on delete cascade,
  color          text not null,
  avatar_id      text not null default 'avatar_01',
  final_position int  not null default 0,
  rank_change    int  not null default 0,
  created_at     timestamptz not null default now(),
  unique(match_id, user_id)
);

-- ── MATCH HISTORY VIEW ─────────────────────────────────────
create or replace view public.match_history_view as
select
  m.id as match_id,
  mp.user_id,
  array_agg(distinct p.username) filter (where p.id != mp.user_id) as opponent_usernames,
  m.winner_id,
  mp.rank_change,
  m.finished_at,
  m.created_at
from public.matches m
join public.match_players mp on mp.match_id = m.id
join public.profiles p on p.id = mp.user_id
group by m.id, mp.user_id, m.winner_id, mp.rank_change, m.finished_at, m.created_at;

-- ── LEADERBOARD VIEW ───────────────────────────────────────
create or replace view public.leaderboard_view as
select
  p.id,
  p.username,
  p.avatar_id,
  p.rank_tier,
  p.rank_stars,
  p.rank_points,
  p.level,
  p.wins,
  p.total_matches,
  case when p.total_matches > 0
       then round((p.wins::numeric / p.total_matches) * 100, 1)
       else 0 end as win_rate,
  row_number() over (order by p.rank_points desc, p.wins desc) as global_rank
from public.profiles p
order by p.rank_points desc, p.wins desc;

-- ── ROW LEVEL SECURITY ─────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.matches enable row level security;
alter table public.match_players enable row level security;

-- Profiles: public read, own update
create policy "profiles_public_read"  on public.profiles for select using (true);
create policy "profiles_own_update"   on public.profiles for update using (auth.uid() = id);
create policy "profiles_own_insert"   on public.profiles for insert with check (auth.uid() = id);

-- Matches: public read, service role write (server handles writes)
create policy "matches_public_read"   on public.matches for select using (true);
create policy "matches_service_write" on public.matches for all using (auth.role() = 'service_role');

-- Match players: public read, service role write
create policy "mp_public_read"   on public.match_players for select using (true);
create policy "mp_service_write" on public.match_players for all using (auth.role() = 'service_role');

-- ── INDEXES ────────────────────────────────────────────────
create index if not exists idx_profiles_rank_points on public.profiles (rank_points desc);
create index if not exists idx_match_players_user_id on public.match_players (user_id);
create index if not exists idx_match_players_match_id on public.match_players (match_id);
create index if not exists idx_matches_status on public.matches (status);
