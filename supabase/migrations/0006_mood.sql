-- Karsa · 0006 · mood entries
begin;

create table if not exists public.mood_entries (
  id           uuid primary key default gen_random_uuid(),
  patient_id   uuid        not null references public.patients (id) on delete cascade,
  mood         text        not null check (mood in ('great', 'good', 'okay', 'low', 'verylow')),
  note         text,
  recorded_by  uuid        references public.profiles (id) on delete set null,
  recorded_at  timestamptz not null default now()
);

create index if not exists mood_entries_patient_idx
  on public.mood_entries (patient_id, recorded_at desc);

alter table public.mood_entries enable row level security;

drop policy if exists "mood_entries: read own or cared-for" on public.mood_entries;
create policy "mood_entries: read own or cared-for"
  on public.mood_entries for select
  using ( public.is_my_patient(patient_id) or public.can_care_for(patient_id) );

drop policy if exists "mood_entries: write own or cared-for" on public.mood_entries;
create policy "mood_entries: write own or cared-for"
  on public.mood_entries for insert
  with check ( public.is_my_patient(patient_id) or public.can_care_for(patient_id) );

commit;