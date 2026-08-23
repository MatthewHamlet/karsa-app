-- 0012 bundled the column and the storage setup in one transaction; if the
-- storage half failed on permissions the column rolled back with it. Split here
-- so each part stands alone. Safe to re-run.
--
-- The view is dropped rather than replaced: `create or replace view` matches
-- columns by position, so inserting image_url after body tried to rename the
-- existing `keywords` column and errored.

alter table public.community_posts
  add column if not exists image_url text;

drop view if exists public.community_feed;

create view public.community_feed
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

notify pgrst, 'reload schema';
