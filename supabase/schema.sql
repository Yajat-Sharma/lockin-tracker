-- LOCKIN sync schema
-- Run this once in your Supabase project's SQL editor (Database → SQL Editor → New query).
-- Safe to re-run: uses `create table if not exists` and `drop policy if exists`.

create table if not exists public.habits (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  icon text not null,
  description text not null default '',
  frequency text not null,
  custom_days int[],
  goal_type text not null default 'count',
  goal_target int not null default 30,
  start_date text not null,
  color text not null default 'cyan',
  archived boolean not null default false,
  "order" int not null default 0,
  reminder boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.entries (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  habit_id text not null,
  date text not null,
  completed boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, habit_id, date)
);

create table if not exists public.settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  theme text not null default 'dark',
  start_of_week int not null default 1,
  date_format text not null default 'MMM d, yyyy',
  animations boolean not null default true,
  reduced_motion boolean not null default false,
  updated_at timestamptz not null default now()
);

create index if not exists habits_user_id_idx on public.habits(user_id);
create index if not exists entries_user_id_idx on public.entries(user_id);
create index if not exists entries_habit_id_idx on public.entries(habit_id);

alter table public.habits enable row level security;
alter table public.entries enable row level security;
alter table public.settings enable row level security;

-- Each signed-in user can only ever see or touch their own rows.
drop policy if exists "habits_select_own" on public.habits;
create policy "habits_select_own" on public.habits for select using (auth.uid() = user_id);
drop policy if exists "habits_insert_own" on public.habits;
create policy "habits_insert_own" on public.habits for insert with check (auth.uid() = user_id);
drop policy if exists "habits_update_own" on public.habits;
create policy "habits_update_own" on public.habits for update using (auth.uid() = user_id);
drop policy if exists "habits_delete_own" on public.habits;
create policy "habits_delete_own" on public.habits for delete using (auth.uid() = user_id);

drop policy if exists "entries_select_own" on public.entries;
create policy "entries_select_own" on public.entries for select using (auth.uid() = user_id);
drop policy if exists "entries_insert_own" on public.entries;
create policy "entries_insert_own" on public.entries for insert with check (auth.uid() = user_id);
drop policy if exists "entries_update_own" on public.entries;
create policy "entries_update_own" on public.entries for update using (auth.uid() = user_id);
drop policy if exists "entries_delete_own" on public.entries;
create policy "entries_delete_own" on public.entries for delete using (auth.uid() = user_id);

drop policy if exists "settings_select_own" on public.settings;
create policy "settings_select_own" on public.settings for select using (auth.uid() = user_id);
drop policy if exists "settings_insert_own" on public.settings;
create policy "settings_insert_own" on public.settings for insert with check (auth.uid() = user_id);
drop policy if exists "settings_update_own" on public.settings;
create policy "settings_update_own" on public.settings for update using (auth.uid() = user_id);

-- Enable Realtime so other signed-in devices get live updates.
alter publication supabase_realtime add table public.habits;
alter publication supabase_realtime add table public.entries;
