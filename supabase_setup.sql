-- ============================================================
--  Wedding RSVP — Supabase setup
--  Run this once in:  Supabase dashboard > SQL Editor > New query
-- ============================================================

-- 1. The table that stores each RSVP.
create table if not exists public.rsvps (
  id            bigint generated always as identity primary key,
  name          text    not null,
  guests        integer not null default 1,
  accommodation boolean not null default false,
  created_at    timestamptz not null default now()
);

-- 2. Turn on Row Level Security so the table is private by default.
alter table public.rsvps enable row level security;

-- 3. Allow ANYONE (the anonymous key used by the website) to INSERT a
--    response — but NOT to read, edit, or delete. This is what keeps your
--    guest list private even though the anon key ships inside the page.
drop policy if exists "anon can insert rsvp" on public.rsvps;
create policy "anon can insert rsvp"
  on public.rsvps
  for insert
  to anon
  with check (true);

-- Note: you and Shivani read the responses in the dashboard
-- (Table editor > rsvps), which bypasses RLS. No read policy is added
-- on purpose, so the public page can never list other guests' replies.
