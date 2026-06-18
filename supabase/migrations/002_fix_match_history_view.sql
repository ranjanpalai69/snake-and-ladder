-- ════════════════════════════════════════════════════════════
-- Migration 002 — Fix match_history_view & status constraint
-- Run this in Supabase Dashboard → SQL Editor → Run
-- ════════════════════════════════════════════════════════════

-- Allow 'abandoned' status (prev constraint only had waiting/playing/finished)
alter table public.matches drop constraint if exists matches_status_check;
alter table public.matches add constraint matches_status_check
  check (status in ('waiting', 'playing', 'finished', 'abandoned'));

-- Drop and recreate — column names changed so CREATE OR REPLACE is rejected by Postgres.
drop view if exists public.match_history_view;

-- Returns one row per (match × user), with self stats + full opponent list as JSON.
create view public.match_history_view as
select
  m.id                            as match_id,
  mp_me.user_id,
  m.winner_id,
  mp_me.rank_change,
  mp_me.final_position            as my_final_position,
  mp_me.color                     as my_color,
  m.status,
  m.started_at,
  m.finished_at,
  m.created_at,
  (
    select json_agg(
      json_build_object(
        'user_id',        mp2.user_id,
        'username',       p2.username,
        'avatar_id',      mp2.avatar_id,
        'final_position', mp2.final_position,
        'rank_change',    mp2.rank_change,
        'color',          mp2.color
      )
      order by mp2.final_position desc
    )
    from  public.match_players mp2
    join  public.profiles p2 on p2.id = mp2.user_id
    where mp2.match_id = m.id
      and mp2.user_id  != mp_me.user_id
  ) as opponents,
  (
    select count(*)::int
    from   public.match_players mp3
    where  mp3.match_id = m.id
  ) as total_players
from  public.matches m
join  public.match_players mp_me on mp_me.match_id = m.id;
