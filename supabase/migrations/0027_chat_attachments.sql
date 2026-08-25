alter table public.care_messages
  add column if not exists image_path    text,
  add column if not exists voice_path    text,
  add column if not exists voice_seconds int;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'care-chat',
  'care-chat',
  false,
  10485760,
  array[
    'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic',
    'audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg', 'audio/wav'
  ]
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "care-chat: read own circle" on storage.objects;
create policy "care-chat: read own circle"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'care-chat'
    and (
      public.is_my_patient(((storage.foldername(name))[1])::uuid)
      or public.can_care_for(((storage.foldername(name))[1])::uuid)
    )
  );

drop policy if exists "care-chat: write own circle" on storage.objects;
create policy "care-chat: write own circle"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'care-chat'
    and (
      public.is_my_patient(((storage.foldername(name))[1])::uuid)
      or public.can_care_for(((storage.foldername(name))[1])::uuid)
    )
  );

drop policy if exists "care-chat: delete own circle" on storage.objects;
create policy "care-chat: delete own circle"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'care-chat'
    and (
      public.is_my_patient(((storage.foldername(name))[1])::uuid)
      or public.can_care_for(((storage.foldername(name))[1])::uuid)
    )
  );

notify pgrst, 'reload schema';
