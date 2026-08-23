-- Karsa · 0012 · pictures on community posts
--
-- Run once, after 0011.
--
-- ── Where the file actually lives ──────────────────────────────────────────
-- In Supabase Storage, with only its URL on the row. The alternative — base64
-- in a text column — turns a 2MB photo into ~2.7MB of text that every feed
-- query then drags across the wire whether or not the card is on screen, and
-- Postgres is a poor filesystem.
--
-- The bucket is public-read. That is a real decision, not a default: anybody
-- with the URL can open the image without a session. It is right for this one
-- because a community post is already readable by every signed-in account, and
-- because the alternative — signed URLs minted per request — would mean the
-- feed could not be cached and every image would expire mid-scroll. What makes
-- it acceptable is that the URLs are unguessable (a uuid per file) and that
-- nothing private is ever uploaded here: this bucket is for post pictures, and
-- no care data, reading, or patient record goes near it.

begin;

alter table public.community_posts
  add column if not exists image_url text;

comment on column public.community_posts.image_url is
  'Public URL of the post picture in the `community` storage bucket. Null for
   text-only posts.';

-- ── The bucket ─────────────────────────────────────────────────────────────
-- `on conflict do nothing` so re-running is safe, and the limits are set here
-- rather than trusted to the browser: a client-side size check is a courtesy to
-- the user, not a control — it is the one thing an attacker simply skips.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'community',
  'community',
  true,
  5242880,                                   -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ── Who may put a file there ───────────────────────────────────────────────
-- Uploads are scoped to a folder named after the uploader's own id, and the
-- policy checks that the first path segment *is* that id. Without it, any
-- signed-in account could overwrite anybody else's picture by guessing a path —
-- which would let one person silently replace the photo on somebody else's
-- post.

drop policy if exists "community images: public read" on storage.objects;
create policy "community images: public read"
  on storage.objects for select
  using ( bucket_id = 'community' );

drop policy if exists "community images: upload own folder" on storage.objects;
create policy "community images: upload own folder"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'community'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "community images: replace own" on storage.objects;
create policy "community images: replace own"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'community'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "community images: delete own" on storage.objects;
create policy "community images: delete own"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'community'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- The feed view has to carry the new column, or the picture never reaches the
-- card. `create or replace` keeps its `security_invoker` setting.
create or replace view public.community_feed
with (security_invoker = true) as
  select
    p.id,
    p.author_id,
    p.group_id,
    p.title,
    p.body,
    p.image_url,
    p.keywords,
    p.tags,
    p.created_at,
    (select count(*) from public.community_comments c where c.post_id = p.id) as replies,
    (select count(*) from public.community_votes  v where v.post_id = p.id) as upvotes
  from public.community_posts p;

commit;
