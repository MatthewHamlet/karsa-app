-- Karsa · 0007 · the rest of the app's data
--
-- Run once in the Supabase SQL editor, after 0006.
--
-- Everything the UI was rendering from `app/data/*.ts` now has a table behind
-- it: the schedule, the activity feed, the standing care notes, the team's
-- conversation, and the targets the stat cards divide by. The tables follow the
-- same two rules as 0005: `patient_id` on every row, and RLS expressed only
-- through `is_my_patient` / `can_care_for`, so there is exactly one definition
-- of "may see this person's data" in the whole database.

begin;

-- ── Targets ────────────────────────────────────────────────────────────────
-- The stat cards print "1.500 ml dari 3.000 ml". The second number was a
-- constant in the component, which made every patient thirsty in exactly the
-- same way. It belongs on the person.
--
-- Columns on `patients` rather than a table of their own: there is exactly one
-- row per patient, they are read on every page that reads the patient anyway,
-- and the update policy that already exists is the one that should govern them.

alter table public.patients
  add column if not exists fluid_target_ml  int  not null default 2000,
  add column if not exists sleep_target_min int  not null default 480,
  add column if not exists notes            text;

-- ── Schedule ───────────────────────────────────────────────────────────────
-- Appointments and one-off events, as opposed to `daily_tasks`, which recur
-- forever and have no date. Stored as a timestamptz pair rather than a date
-- plus two text times: "is this still upcoming" is a question the database
-- should be able to answer.

create table if not exists public.schedule_events (
  id          uuid primary key default gen_random_uuid(),
  patient_id  uuid        not null references public.patients (id) on delete cascade,
  title       text        not null check (length(trim(title)) > 0),
  kind        text        not null default 'appointment'
                          check (kind in ('appointment', 'meds', 'therapy', 'checkup')),
  starts_at   timestamptz not null,
  ends_at     timestamptz,
  note        text,
  created_by  uuid        references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now()
);

create index if not exists schedule_events_patient_start_idx
  on public.schedule_events (patient_id, starts_at);

-- ── Standing care notes ────────────────────────────────────────────────────
-- The "Informasi penting" card: things that are true every day, as opposed to
-- things that happened. Kept as rows rather than one blob of text, because the
-- card lists them and the history panel has to say which one changed.

create table if not exists public.care_notes (
  id          uuid primary key default gen_random_uuid(),
  patient_id  uuid        not null references public.patients (id) on delete cascade,
  body        text        not null check (length(trim(body)) > 0),
  sort_order  int         not null default 0,
  created_by  uuid        references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists care_notes_patient_idx
  on public.care_notes (patient_id, sort_order);

-- ── Team chat ──────────────────────────────────────────────────────────────
-- One conversation per patient, between everybody who looks after them. Not a
-- DM system: the point of the card is that caregivers can see what each other
-- already did, and a private thread would defeat it.
--
-- `context_*` is the care item a message was started from — "Diskusikan" on a
-- medication card carries the medication into the composer. Denormalised on
-- purpose: the label has to keep saying what it said when the message was sent,
-- even after the underlying item is edited or deleted.

create table if not exists public.care_messages (
  id             uuid primary key default gen_random_uuid(),
  patient_id     uuid        not null references public.patients (id) on delete cascade,
  author_id      uuid        not null references public.profiles (id) on delete cascade,
  body           text        not null check (length(trim(body)) > 0),
  context_type   text        check (context_type in
                   ('medication', 'instruction', 'event', 'note', 'record')),
  context_label  text,
  context_detail text,
  created_at     timestamptz not null default now()
);

create index if not exists care_messages_patient_idx
  on public.care_messages (patient_id, created_at);

-- ── RLS ────────────────────────────────────────────────────────────────────

alter table public.schedule_events enable row level security;
alter table public.care_notes      enable row level security;
alter table public.care_messages   enable row level security;

-- Same loop as 0005: the four policies are identical for every table whose only
-- rule is "this patient's people", so they are written once and formatted per
-- table rather than copied and slowly drifting apart.
do $$
declare
  t text;
begin
  foreach t in array array['schedule_events', 'care_notes'] loop
    execute format($f$
      drop policy if exists "%1$s: read own or cared-for" on public.%1$s;
      create policy "%1$s: read own or cared-for"
        on public.%1$s for select
        using ( public.is_my_patient(patient_id) or public.can_care_for(patient_id) );
      drop policy if exists "%1$s: write own or cared-for" on public.%1$s;
      create policy "%1$s: write own or cared-for"
        on public.%1$s for insert
        with check ( public.is_my_patient(patient_id) or public.can_care_for(patient_id) );
      drop policy if exists "%1$s: update own or cared-for" on public.%1$s;
      create policy "%1$s: update own or cared-for"
        on public.%1$s for update
        using      ( public.is_my_patient(patient_id) or public.can_care_for(patient_id) )
        with check ( public.is_my_patient(patient_id) or public.can_care_for(patient_id) );
      drop policy if exists "%1$s: delete own or cared-for" on public.%1$s;
      create policy "%1$s: delete own or cared-for"
        on public.%1$s for delete
        using ( public.is_my_patient(patient_id) or public.can_care_for(patient_id) );
    $f$, t);
  end loop;
end $$;

-- The conversation is read by the whole team, but a line belongs to whoever
-- wrote it. Hence its own four rather than the loop's.
drop policy if exists "care_messages: read own or cared-for" on public.care_messages;
create policy "care_messages: read own or cared-for"
  on public.care_messages for select
  using ( public.is_my_patient(patient_id) or public.can_care_for(patient_id) );

-- `author_id` is pinned to the caller here rather than trusted from the insert.
-- Without this, any member of the team could post under somebody else's name,
-- which is the one thing a shared conversation must not allow.
drop policy if exists "care_messages: send as self" on public.care_messages;
create policy "care_messages: send as self"
  on public.care_messages for insert
  with check (
    author_id = (select auth.uid())
    and ( public.is_my_patient(patient_id) or public.can_care_for(patient_id) )
  );

drop policy if exists "care_messages: author edits" on public.care_messages;
create policy "care_messages: author edits"
  on public.care_messages for update
  using      ( author_id = (select auth.uid()) )
  with check ( author_id = (select auth.uid()) );

drop policy if exists "care_messages: author deletes" on public.care_messages;
create policy "care_messages: author deletes"
  on public.care_messages for delete
  using ( author_id = (select auth.uid()) );

drop trigger if exists care_notes_touch_updated_at on public.care_notes;
create trigger care_notes_touch_updated_at
  before update on public.care_notes
  for each row execute function public.touch_updated_at();

-- ── The activity feed ──────────────────────────────────────────────────────
-- "Sudah terjadi": a ticked task, a reading, a meal, a dose, a mood. Every one
-- of those is already a row somewhere, so this is a view rather than a sixth
-- table. An `activity_events` table would mean every write happening twice, and
-- on the day the two disagree the feed is the one that lies.
--
-- `security_invoker` is the load-bearing word. A view is owned by whoever
-- created it, and by default Postgres runs its body as that owner — which would
-- read straight past the RLS on all five tables underneath and hand every
-- caregiver everybody's activity. With it on, the policies are evaluated as the
-- caller, so the view is exactly as safe as the tables it reads.

create or replace view public.activity_feed
with (security_invoker = true) as
  select
    tc.id,
    tc.patient_id,
    'task'::text    as kind,
    dt.label        as title,
    null::text      as detail,
    tc.completed_by as actor_id,
    tc.completed_at as occurred_at
  from public.task_completions tc
  join public.daily_tasks dt on dt.id = tc.task_id

  union all
  select
    hr.id,
    hr.patient_id,
    'reading',
    hr.kind,
    /* Blood pressure is the one reading with two numbers; everything else
       prints as itself. Formatted here so the feed is renderable without the
       component needing to know which kinds are compound. */
    case when hr.value_secondary is not null
         then trim(to_char(hr.value, 'FM999999.99')) || '/' ||
              trim(to_char(hr.value_secondary, 'FM999999.99'))
         else trim(to_char(hr.value, 'FM999999.99'))
    end,
    hr.recorded_by,
    hr.recorded_at
  from public.health_readings hr

  union all
  select
    ml.id,
    ml.patient_id,
    'meal',
    ml.meal,
    null,
    ml.logged_by,
    ml.logged_at
  from public.meal_logs ml

  union all
  select
    mdl.id,
    mdl.patient_id,
    'medication',
    m.name,
    nullif(trim(m.dose || ' ' || coalesce(mdl.scheduled_time, '')), ''),
    mdl.logged_by,
    mdl.logged_at
  from public.medication_logs mdl
  join public.medications m on m.id = mdl.medication_id

  union all
  select
    me.id,
    me.patient_id,
    'mood',
    me.mood,
    me.note,
    me.recorded_by,
    me.recorded_at
  from public.mood_entries me;

comment on view public.activity_feed is
  'Read-only union of everything that has happened to a patient. Runs as the
   caller (security_invoker), so the RLS on the five source tables governs it.';

-- ── A new patient starts with a day, not a blank page ──────────────────────
-- A caregiver who has just written down their mother should not land on five
-- empty cards and have to invent a care plan before the app does anything.
-- These are the ordinary things, phrased so they read as obviously editable,
-- and they are inserted only on creation — deleting one keeps it deleted.
--
-- `security definer` because the trigger runs inside the caller's insert, and
-- the caller's own insert policy on `daily_tasks` asks `can_care_for`, which is
-- not true yet: the relationship row is written a statement later.

create or replace function public.seed_patient_defaults()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.daily_tasks (patient_id, label, hint, sort_order, created_by)
  values
    (new.id, 'Sarapan & obat pagi',  '07:00',          1, new.created_by),
    (new.id, 'Minum air yang cukup', 'Sepanjang hari', 2, new.created_by),
    (new.id, 'Jalan pagi',           'Sebelum 09:00',  3, new.created_by),
    (new.id, 'Cek tekanan darah',    'Siang',          4, new.created_by),
    (new.id, 'Obat malam',           '20:00',          5, new.created_by);

  insert into public.care_notes (patient_id, body, sort_order, created_by)
  values
    (new.id, 'Obat diminum setelah makan, jangan saat perut kosong.', 1, new.created_by),
    (new.id, 'Hubungi tim perawatan bila ada kondisi tidak biasa.',   2, new.created_by);

  return new;
end;
$$;

drop trigger if exists patients_seed_defaults on public.patients;
create trigger patients_seed_defaults
  after insert on public.patients
  for each row execute function public.seed_patient_defaults();

commit;
