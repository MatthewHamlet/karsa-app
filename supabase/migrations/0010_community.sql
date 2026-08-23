-- Karsa · 0010 · komunitas
--
-- Run once in the Supabase SQL editor, after 0009.
--
-- ── How this differs from everything before it ─────────────────────────────
-- Every other table in this schema is private to one patient's circle: the RLS
-- asks `is_my_patient` or `can_care_for`, and the answer is no for almost
-- everybody. The community is the opposite — it is the one place in Karsa where
-- caregivers who have never met are meant to read each other.
--
-- So the read policies here are `to authenticated` with no further condition,
-- and that is deliberate rather than lazy. What keeps it safe is what is *not*
-- in these tables: no patient is named, no reading is attached, nothing here
-- joins to `patients` or `health_readings` at all. A post is a person writing
-- about their own experience, and if they name their mother in the body that is
-- their disclosure to make.
--
-- Writes stay owner-scoped throughout: you may post as yourself, edit your own
-- words, and delete your own rows. Nothing else.

begin;

-- ── Who somebody is, in the community ──────────────────────────────────────
-- Two columns on `profiles` rather than a `community_profiles` table. There is
-- one row per person either way, and a join for a headline is a join on every
-- card in the feed.
--
-- `verified` is set by hand in the dashboard, never by the application. It
-- marks clinicians the app has actually checked, and a flag a user can set for
-- themselves is not a check — it is a costume.

alter table public.profiles
  add column if not exists headline text,
  add column if not exists verified boolean not null default false;

comment on column public.profiles.verified is
  'Clinician verified by Karsa. Set manually; no application code may write it.';

-- ── Groups ─────────────────────────────────────────────────────────────────

create table if not exists public.community_groups (
  id          uuid primary key default gen_random_uuid(),
  name        text        not null check (length(trim(name)) > 0),
  blurb       text        not null default '',
  /* Which illustration the card draws. A key into the app's own artwork, not a
     URL — see `GroupArt`. Free text on purpose: an unknown value falls back to
     a default drawing rather than breaking a constraint on deploy day. */
  art         text        not null default 'heart',
  tone        text        not null default 'karsa',
  keywords    text[]      not null default '{}',
  created_by  uuid        references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now()
);

create table if not exists public.community_group_members (
  group_id   uuid        not null references public.community_groups (id) on delete cascade,
  profile_id uuid        not null references public.profiles (id) on delete cascade,
  joined_at  timestamptz not null default now(),
  primary key (group_id, profile_id)
);

-- ── Posts ──────────────────────────────────────────────────────────────────

create table if not exists public.community_posts (
  id         uuid primary key default gen_random_uuid(),
  author_id  uuid        not null references public.profiles (id) on delete cascade,
  /* A post may belong to a group or to the open feed. */
  group_id   uuid        references public.community_groups (id) on delete set null,
  title      text        not null check (length(trim(title)) > 0),
  body       text        not null default '',
  keywords   text[]      not null default '{}',
  /* Denormalised for the chips on the card. Two at most is a UI rule, not a
     data one, so it is not constrained here. */
  tags       text[]      not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists community_posts_recent_idx
  on public.community_posts (created_at desc);
create index if not exists community_posts_group_idx
  on public.community_posts (group_id, created_at desc);

create table if not exists public.community_comments (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid        not null references public.community_posts (id) on delete cascade,
  author_id  uuid        not null references public.profiles (id) on delete cascade,
  body       text        not null check (length(trim(body)) > 0),
  created_at timestamptz not null default now()
);

create index if not exists community_comments_post_idx
  on public.community_comments (post_id, created_at);

/* One vote per person per post, enforced by the primary key rather than by
   application code. A counter column would need a trigger to stay honest and
   would still let one person vote twice; a row per vote cannot. */
create table if not exists public.community_votes (
  post_id    uuid        not null references public.community_posts (id) on delete cascade,
  profile_id uuid        not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, profile_id)
);

-- ── Live sessions ──────────────────────────────────────────────────────────

create table if not exists public.community_sessions (
  id          uuid primary key default gen_random_uuid(),
  title       text        not null check (length(trim(title)) > 0),
  blurb       text        not null default '',
  host_name   text        not null default '',
  host_id     uuid        references public.profiles (id) on delete set null,
  starts_at   timestamptz not null,
  created_at  timestamptz not null default now()
);

create index if not exists community_sessions_upcoming_idx
  on public.community_sessions (starts_at);

create table if not exists public.community_session_signups (
  session_id uuid        not null references public.community_sessions (id) on delete cascade,
  profile_id uuid        not null references public.profiles (id) on delete cascade,
  joined_at  timestamptz not null default now(),
  primary key (session_id, profile_id)
);

-- ── Following ──────────────────────────────────────────────────────────────

create table if not exists public.community_follows (
  follower_id uuid        not null references public.profiles (id) on delete cascade,
  followee_id uuid        not null references public.profiles (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (follower_id, followee_id),
  /* Following yourself would put you in your own "orang untuk diikuti" list. */
  constraint community_follows_not_self check (follower_id <> followee_id)
);

-- ── RLS ────────────────────────────────────────────────────────────────────

alter table public.community_groups          enable row level security;
alter table public.community_group_members   enable row level security;
alter table public.community_posts           enable row level security;
alter table public.community_comments        enable row level security;
alter table public.community_votes           enable row level security;
alter table public.community_sessions        enable row level security;
alter table public.community_session_signups enable row level security;
alter table public.community_follows         enable row level security;

/* Everything here is readable by any signed-in account. `to authenticated`
   rather than `using (true)` — the difference is `anon`, the key that ships to
   every browser, which must not be able to scrape the whole community without
   an account. */
do $$
declare
  t text;
begin
  foreach t in array array[
    'community_groups', 'community_group_members', 'community_posts',
    'community_comments', 'community_votes', 'community_sessions',
    'community_session_signups', 'community_follows'
  ]
  loop
    execute format($f$
      drop policy if exists "%1$s: read signed in" on public.%1$s;
      create policy "%1$s: read signed in"
        on public.%1$s for select
        to authenticated
        using ( true );
    $f$, t);
  end loop;
end $$;

/* Writes, owner-scoped. Each table names its own owner column, which is why
   these are spelled out rather than looped. */

drop policy if exists "community_posts: write own" on public.community_posts;
create policy "community_posts: write own"
  on public.community_posts for insert to authenticated
  with check ( author_id = (select auth.uid()) );

drop policy if exists "community_posts: edit own" on public.community_posts;
create policy "community_posts: edit own"
  on public.community_posts for update to authenticated
  using ( author_id = (select auth.uid()) ) with check ( author_id = (select auth.uid()) );

drop policy if exists "community_posts: delete own" on public.community_posts;
create policy "community_posts: delete own"
  on public.community_posts for delete to authenticated
  using ( author_id = (select auth.uid()) );

drop policy if exists "community_comments: write own" on public.community_comments;
create policy "community_comments: write own"
  on public.community_comments for insert to authenticated
  with check ( author_id = (select auth.uid()) );

drop policy if exists "community_comments: delete own" on public.community_comments;
create policy "community_comments: delete own"
  on public.community_comments for delete to authenticated
  using ( author_id = (select auth.uid()) );

drop policy if exists "community_votes: vote as self" on public.community_votes;
create policy "community_votes: vote as self"
  on public.community_votes for insert to authenticated
  with check ( profile_id = (select auth.uid()) );

drop policy if exists "community_votes: unvote own" on public.community_votes;
create policy "community_votes: unvote own"
  on public.community_votes for delete to authenticated
  using ( profile_id = (select auth.uid()) );

drop policy if exists "community_group_members: join as self" on public.community_group_members;
create policy "community_group_members: join as self"
  on public.community_group_members for insert to authenticated
  with check ( profile_id = (select auth.uid()) );

drop policy if exists "community_group_members: leave own" on public.community_group_members;
create policy "community_group_members: leave own"
  on public.community_group_members for delete to authenticated
  using ( profile_id = (select auth.uid()) );

drop policy if exists "community_groups: create" on public.community_groups;
create policy "community_groups: create"
  on public.community_groups for insert to authenticated
  with check ( created_by = (select auth.uid()) );

drop policy if exists "community_session_signups: join as self" on public.community_session_signups;
create policy "community_session_signups: join as self"
  on public.community_session_signups for insert to authenticated
  with check ( profile_id = (select auth.uid()) );

drop policy if exists "community_session_signups: leave own" on public.community_session_signups;
create policy "community_session_signups: leave own"
  on public.community_session_signups for delete to authenticated
  using ( profile_id = (select auth.uid()) );

drop policy if exists "community_follows: follow as self" on public.community_follows;
create policy "community_follows: follow as self"
  on public.community_follows for insert to authenticated
  with check ( follower_id = (select auth.uid()) );

drop policy if exists "community_follows: unfollow own" on public.community_follows;
create policy "community_follows: unfollow own"
  on public.community_follows for delete to authenticated
  using ( follower_id = (select auth.uid()) );

/* No insert or update policy on `community_sessions` at all. Sessions are
   scheduled by Karsa, not by users, so they are created in the dashboard — and
   with RLS on and no policy, the API cannot write them however hard it tries. */

drop trigger if exists community_posts_touch_updated_at on public.community_posts;
create trigger community_posts_touch_updated_at
  before update on public.community_posts
  for each row execute function public.touch_updated_at();

-- ── The feed, counted ──────────────────────────────────────────────────────
-- Replies and upvotes are printed on every card, so they are counted once here
-- rather than by the browser asking per post. `security_invoker` so the view is
-- governed by the policies above and not by its owner's rights.

create or replace view public.community_feed
with (security_invoker = true) as
  select
    p.id,
    p.author_id,
    p.group_id,
    p.title,
    p.body,
    p.keywords,
    p.tags,
    p.created_at,
    (select count(*) from public.community_comments c where c.post_id = p.id) as replies,
    (select count(*) from public.community_votes  v where v.post_id = p.id) as upvotes
  from public.community_posts p;

comment on view public.community_feed is
  'Posts with their reply and vote counts. Runs as the caller, so the read
   policy on community_posts is what governs it.';

commit;
