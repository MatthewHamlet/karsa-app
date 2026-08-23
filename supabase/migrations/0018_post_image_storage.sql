-- The storage half of 0012, on its own so a failure here cannot roll back the
-- image_url column. Run 0017 first.
--
-- If this script errors on permissions, create the bucket in the Supabase
-- dashboard instead: Storage -> New bucket -> name `community`, Public ON.
-- The policies below can then be added from Storage -> Policies.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'community',
  'community',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

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
