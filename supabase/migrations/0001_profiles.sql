-- Karsa · 0001 · profiles
--
-- Run this once, in the Supabase dashboard under SQL Editor. It cannot be run
-- from the app: the `anon` key has no rights to create tables, and the key that
-- does (`service_role`) must never be anywhere near this codebase.
--
-- ── Why a `profiles` table at all ───────────────────────────────────────────
-- `auth.users` already exists and is where sign-in happens, but it belongs to
-- Supabase: its shape can change under you, and it is not exposed to the API for
-- writing. Anything the product knows about a person — their name, whether they
-- are a pendamping or a pasien — goes in a table of your own, keyed to the same
-- id. That is the standard pattern and the one everything else will hang off.

create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text        not null default '',
  -- The app is two products on one domain. This is what decides which one a
  -- person lands in, so it is constrained rather than left as free text.
  role        text        not null default 'pendamping'
                          check (role in ('pendamping', 'pasien')),
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.profiles is
  'One row per auth user. Created automatically by the trigger below.';

-- ── Row Level Security ──────────────────────────────────────────────────────
-- This is the part that matters. The `anon` key is public: it ships to every
-- browser that opens the site, and that is by design. RLS is the only thing
-- standing between that key and this table. Without the line below, anyone who
-- opens devtools, copies the key out of the page and points it at the REST
-- endpoint can read and rewrite every row here.
--
-- Enable it first, then grant back exactly what is needed. A table with RLS on
-- and no policies denies everything, which is the correct place to start.

alter table public.profiles enable row level security;

drop policy if exists "profiles: read own" on public.profiles;
create policy "profiles: read own"
  on public.profiles for select
  using ( (select auth.uid()) = id );

drop policy if exists "profiles: update own" on public.profiles;
create policy "profiles: update own"
  on public.profiles for update
  using      ( (select auth.uid()) = id )
  with check ( (select auth.uid()) = id );

-- No insert policy on purpose. Rows are created by the trigger below, which
-- runs as the definer and bypasses RLS; letting clients insert their own would
-- also let them insert rows for somebody else's id.

-- ── Keep a profile in step with its user ────────────────────────────────────
-- `security definer` is required: the trigger fires as the signing-up user, who
-- has no rights on this table yet. `set search_path = ''` is required *with* it
-- — a definer function that resolves names through the caller's search_path can
-- be tricked into running the caller's code with the owner's privileges. Every
-- name below is therefore schema-qualified.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    -- Anything unexpected falls back rather than failing the signup: a bad
    -- value here would otherwise make the whole account creation roll back.
    case
      when new.raw_user_meta_data ->> 'role' in ('pendamping', 'pasien')
        then new.raw_user_meta_data ->> 'role'
      else 'pendamping'
    end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- `updated_at` that cannot be forgotten or lied about by the client.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- ── Backfill ────────────────────────────────────────────────────────────────
-- The trigger only fires on new signups. Any account created before this ran —
-- the test user made by hand in the dashboard, for instance — has no profile
-- yet, and would otherwise sign in successfully into a broken empty state.
insert into public.profiles (id, full_name)
select u.id, coalesce(u.raw_user_meta_data ->> 'full_name', '')
from auth.users u
on conflict (id) do nothing;
