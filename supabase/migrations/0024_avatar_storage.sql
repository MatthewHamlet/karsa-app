-- Karsa · 0024 · somewhere to put a profile photo
--
-- Run once in the Supabase SQL editor, after 0023.
--
-- `profiles.avatar_url` has existed since 0001 and `MySettings.avatarUrl` has
-- been read out of it just as long. What never existed was anywhere to put the
-- file: the picker in Pengaturan made an object URL, showed it, and dropped it
-- on the next reload. The column was always waiting for this bucket.
--
-- If this script errors on permissions, create the bucket in the dashboard
-- instead: Storage -> New bucket -> name `avatars`, Public ON. The policies
-- below can then be added from Storage -> Policies.
--
-- Public read, like `community`. A profile photo is shown next to every message
-- its owner has ever sent, to a group whose membership changes — signing each
-- URL would mean re-signing them on every render of every thread, and the file
-- is a face somebody chose to publish under their own name. 2 MB because that
-- is the number the field already prints to the person choosing.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "avatars: public read" on storage.objects;
create policy "avatars: public read"
  on storage.objects for select
  using ( bucket_id = 'avatars' );

-- The first path segment must be the uploader's own id. This is the whole of
-- the write rule: it is what stops one person replacing another's face, and it
-- is why the client builds paths as `${user.id}/${uuid}.${ext}` rather than
-- anything friendlier.
drop policy if exists "avatars: upload own folder" on storage.objects;
create policy "avatars: upload own folder"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "avatars: replace own" on storage.objects;
create policy "avatars: replace own"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "avatars: delete own" on storage.objects;
create policy "avatars: delete own"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
