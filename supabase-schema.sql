-- ════════════════════════════════════════════════════════════
-- BǑ-BĀNG 無望 — Supabase Schema
-- Run this in: Supabase Dashboard > SQL Editor
-- ════════════════════════════════════════════════════════════

-- ── 1. early_bird table ──
create table if not exists public.early_bird (
  id          bigint        generated always as identity primary key,
  email       text          not null unique,
  ip_hash     text,                          -- SHA-256 truncated, never raw IP
  source      text,                          -- referrer URL
  user_agent  text,                          -- browser UA (max 200 chars)
  created_at  timestamptz   not null default now()
);

-- ── 2. Indexes ──
create index if not exists early_bird_created_at_idx
  on public.early_bird (created_at desc);

-- ── 3. Row Level Security ──
alter table public.early_bird enable row level security;

-- Block ALL access from anon/authenticated roles via API
-- Only the service_role key (used in api/signup.js) can insert
create policy "block_anon_select"
  on public.early_bird
  for select
  to anon, authenticated
  using (false);

create policy "block_anon_insert"
  on public.early_bird
  for insert
  to anon, authenticated
  with check (false);

create policy "block_anon_update"
  on public.early_bird
  for update
  to anon, authenticated
  using (false);

create policy "block_anon_delete"
  on public.early_bird
  for delete
  to anon, authenticated
  using (false);

-- ── 4. Export view (for you to query in Dashboard) ──
-- Use Dashboard > Table Editor, or:
-- select email, created_at from early_bird order by created_at desc;

-- ── 5. Optional: alert when signups reach milestone ──
-- (set up in Supabase Dashboard > Database > Webhooks)
-- Webhook trigger: INSERT on early_bird
-- Payload: { "email": "...", "created_at": "..." }
-- Target: your Telegram bot / Discord webhook / email

-- ════════════════════════════════════════════════════════════
-- VERIFICATION — run after setup:
-- select count(*) from early_bird;
-- ════════════════════════════════════════════════════════════
