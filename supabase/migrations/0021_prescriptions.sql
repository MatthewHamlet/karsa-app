begin;

create table if not exists public.prescriptions (
  id          uuid primary key default gen_random_uuid(),
  patient_id  uuid        not null references public.patients (id) on delete cascade,
  clinic      text        not null default '',
  doctor      text        not null default '',
  raw_text    text,
  image_path  text,
  scanned_by  uuid        references public.profiles (id) on delete set null,
  scanned_at  timestamptz not null default now()
);

create index if not exists prescriptions_patient_idx
  on public.prescriptions (patient_id, scanned_at desc);

alter table public.medications
  add column if not exists prescription_id uuid
    references public.prescriptions (id) on delete set null;

alter table public.prescriptions enable row level security;

drop policy if exists "prescriptions: read own or cared-for" on public.prescriptions;
create policy "prescriptions: read own or cared-for"
  on public.prescriptions for select
  using ( public.is_my_patient(patient_id) or public.can_care_for(patient_id) );

drop policy if exists "prescriptions: write own or cared-for" on public.prescriptions;
create policy "prescriptions: write own or cared-for"
  on public.prescriptions for insert
  with check ( public.is_my_patient(patient_id) or public.can_care_for(patient_id) );

drop policy if exists "prescriptions: update own or cared-for" on public.prescriptions;
create policy "prescriptions: update own or cared-for"
  on public.prescriptions for update
  using      ( public.is_my_patient(patient_id) or public.can_care_for(patient_id) )
  with check ( public.is_my_patient(patient_id) or public.can_care_for(patient_id) );

drop policy if exists "prescriptions: delete own or cared-for" on public.prescriptions;
create policy "prescriptions: delete own or cared-for"
  on public.prescriptions for delete
  using ( public.is_my_patient(patient_id) or public.can_care_for(patient_id) );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('prescriptions', 'prescriptions', false, 10485760,
        array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "prescriptions: read own circle" on storage.objects;
create policy "prescriptions: read own circle"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'prescriptions'
    and (
      public.is_my_patient(((storage.foldername(name))[1])::uuid)
      or public.can_care_for(((storage.foldername(name))[1])::uuid)
    )
  );

drop policy if exists "prescriptions: write own circle" on storage.objects;
create policy "prescriptions: write own circle"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'prescriptions'
    and (
      public.is_my_patient(((storage.foldername(name))[1])::uuid)
      or public.can_care_for(((storage.foldername(name))[1])::uuid)
    )
  );

drop policy if exists "prescriptions: delete own circle" on storage.objects;
create policy "prescriptions: delete own circle"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'prescriptions'
    and (
      public.is_my_patient(((storage.foldername(name))[1])::uuid)
      or public.can_care_for(((storage.foldername(name))[1])::uuid)
    )
  );

commit;

notify pgrst, 'reload schema';
