-- Karsa · 0002 · patients + care_relationships
--
-- Run in the Supabase dashboard, SQL Editor, AFTER 0001. Idempotent: safe to
-- run twice.
--
-- ── The shape of the thing ──────────────────────────────────────────────────
-- A caregiver does not own a patient. The patient owns their own care data, and
-- a caregiver reaches it only through an accepted `care_relationship`. That is
-- why there is no `caregiver_id` on `patients`: a column like that can hold one
-- caregiver, silently makes that person the owner, and has to be rewritten the
-- first time a second family member joins.
--
--      profiles (auth identity)
--         │
--         ├──< care_relationships >──┐
--         │                          │
--     caregiver                  patients ──── care data
--
-- Both directions are many-to-many, and the relationship row is where consent
-- lives: it is not access until the patient says so.

begin;

/* ── 0. Role vocabulary ─────────────────────────────────────────────────────
   0001 shipped Indonesian role values. Every policy below reads this column,
   so the database side moves to the English terms and the UI keeps translating
   for display. Existing rows are converted rather than orphaned — dropping the
   constraint first, because rewriting the values would violate the old one. */

alter table public.profiles drop constraint if exists profiles_role_check;

update public.profiles set role = 'caregiver' where role = 'pendamping';
update public.profiles set role = 'patient'   where role = 'pasien';

alter table public.profiles
  alter column role set default 'caregiver',
  add constraint profiles_role_check check (role in ('patient', 'caregiver'));

/* The 0001 trigger still writes the Indonesian words. Replaced here so a new
   signup cannot insert a value the constraint above now rejects. */
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
    case
      when new.raw_user_meta_data ->> 'role' in ('patient', 'caregiver')
        then new.raw_user_meta_data ->> 'role'
      /* Tolerated so a browser tab left open on the old form still works. */
      when new.raw_user_meta_data ->> 'role' = 'pasien'      then 'patient'
      when new.raw_user_meta_data ->> 'role' = 'pendamping'  then 'caregiver'
      else 'caregiver'
    end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

/* ── 1. patients ────────────────────────────────────────────────────────────
   `user_id` is nullable on purpose: a caregiver can write down who they are
   caring for before that person has ever heard of Karsa. The row is real, the
   care data attaches to it, and when the patient eventually signs up their
   profile is linked to the row that already exists. No placeholder auth user is
   ever created for them — a fake account is an account somebody can be
   locked out of, and a password nobody set. */

create table if not exists public.patients (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid unique references public.profiles (id) on delete set null,
  display_name    text        not null check (length(trim(display_name)) > 0),
  date_of_birth   date,
  created_by      uuid        references public.profiles (id) on delete set null,
  status          text        not null default 'pending_activation'
                              check (status in ('pending_activation', 'active')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  /* A linked patient is by definition activated; an unlinked one cannot be.
     Enforced here rather than in application code because both fields are
     written from more than one place. */
  constraint patients_link_matches_status check (
    (user_id is null and status = 'pending_activation') or
    (user_id is not null and status = 'active')
  )
);

/* `on delete set null` above, never cascade. Deleting a profile must not take
   the patient's medical history with it — the account is the way in, not the
   data itself, and someone else may still be caring for that person. */

create index if not exists patients_user_id_idx    on public.patients (user_id);
create index if not exists patients_created_by_idx on public.patients (created_by);

/* ── 2. care_relationships ──────────────────────────────────────────────────
   One row per (caregiver, patient) pair, holding the consent state. */

create table if not exists public.care_relationships (
  id            uuid primary key default gen_random_uuid(),
  caregiver_id  uuid        not null references public.profiles (id) on delete cascade,
  patient_id    uuid        not null references public.patients (id) on delete cascade,
  status        text        not null default 'pending'
                            check (status in ('pending', 'active', 'rejected', 'revoked')),
  /* How this caregiver refers to this patient — "Ibu", "Nenek". Deliberately
     NOT on `patients`: it describes the relationship, not the person, and the
     same patient is "Ibu" to one caregiver and "Nenek" to another. The mock UI
     had it on the patient, which only worked because there was one caregiver. */
  relation      text,
  invited_by    uuid        references public.profiles (id) on delete set null,
  invited_at    timestamptz not null default now(),
  accepted_at   timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint care_relationships_unique_pair unique (caregiver_id, patient_id),
  constraint care_relationships_accepted_at_matches check (
    (status = 'active' and accepted_at is not null) or
    (status <> 'active' and accepted_at is null)
  )
);

create index if not exists care_rel_caregiver_idx on public.care_relationships (caregiver_id);
create index if not exists care_rel_patient_idx   on public.care_relationships (patient_id);
create index if not exists care_rel_status_idx    on public.care_relationships (status);
/* The hot query: "which patients may this caregiver see right now". */
create index if not exists care_rel_caregiver_active_idx
  on public.care_relationships (caregiver_id, patient_id) where status = 'active';

/* ── 3. Helper functions ────────────────────────────────────────────────────
   These exist to break RLS recursion, not for convenience.

   A policy on `patients` that reads `care_relationships` triggers that table's
   own policies, which read `patients`, which triggers its policies… Postgres
   answers that with `infinite recursion detected in policy`. A `security
   definer` function runs as its owner and is not subject to RLS, so the lookup
   terminates.

   `set search_path = ''` is mandatory alongside `security definer`: without it
   the caller can point a schema name at their own objects and have them run
   with the owner's rights. Everything below is schema-qualified for that
   reason. */

create or replace function public.is_my_patient(p_patient uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.patients
    where id = p_patient and user_id = (select auth.uid())
  );
$$;

create or replace function public.can_care_for(p_patient uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.care_relationships
    where patient_id  = p_patient
      and caregiver_id = (select auth.uid())
      and status = 'active'          -- pending, rejected and revoked grant nothing
  );
$$;

/* ── 4. Row Level Security ──────────────────────────────────────────────────
   Enabled before any policy exists, which denies everything; access is then
   granted back deliberately. This is the only layer that actually protects the
   data — the `anon` key is public, so a caregiver can send any UUID they like
   and the answer has to come from here, never from React. */

alter table public.patients            enable row level security;
alter table public.care_relationships  enable row level security;

-- ── patients ────────────────────────────────────────────────────────────────
drop policy if exists "patients: read own or cared-for" on public.patients;
create policy "patients: read own or cared-for"
  on public.patients for select
  using ( public.is_my_patient(id) or public.can_care_for(id) );

drop policy if exists "patients: caregiver creates" on public.patients;
create policy "patients: caregiver creates"
  on public.patients for insert
  with check (
    created_by = (select auth.uid())
    /* A caregiver may only ever create an unclaimed profile. Inserting one
       already pointed at somebody else's account would be a way to attach
       yourself to a stranger's data. */
    and user_id is null
    and status = 'pending_activation'
  );

drop policy if exists "patients: own or active caregiver updates" on public.patients;
create policy "patients: own or active caregiver updates"
  on public.patients for update
  using      ( public.is_my_patient(id) or public.can_care_for(id) )
  with check ( public.is_my_patient(id) or public.can_care_for(id) );

-- ── care_relationships ──────────────────────────────────────────────────────
drop policy if exists "care: read own side" on public.care_relationships;
create policy "care: read own side"
  on public.care_relationships for select
  using (
    caregiver_id = (select auth.uid())   -- the caregiver sees their invitations
    or public.is_my_patient(patient_id)  -- the patient sees who is asking
  );

drop policy if exists "care: caregiver invites" on public.care_relationships;
create policy "care: caregiver invites"
  on public.care_relationships for insert
  with check (
    caregiver_id = (select auth.uid())
    and invited_by = (select auth.uid())
    /* Never self-granting. An invitation starts pending and only the patient
       can move it on — see the update policy. */
    and status = 'pending'
    and accepted_at is null
  );

/* Split in two, because the two sides may do different things.

   The patient decides consent: pending -> active / rejected, and may revoke
   later. The caregiver may only withdraw their own request or step away; they
   must never be able to set 'active' on their own row, which is the whole
   point of the invitation. */

drop policy if exists "care: patient decides" on public.care_relationships;
create policy "care: patient decides"
  on public.care_relationships for update
  using      ( public.is_my_patient(patient_id) )
  with check ( public.is_my_patient(patient_id) );

drop policy if exists "care: caregiver withdraws" on public.care_relationships;
create policy "care: caregiver withdraws"
  on public.care_relationships for update
  using      ( caregiver_id = (select auth.uid()) )
  with check ( caregiver_id = (select auth.uid()) and status in ('revoked', 'rejected') );

/* ── 5. Timestamps ──────────────────────────────────────────────────────────
   `updated_at` the client cannot forget or lie about. */

drop trigger if exists patients_touch_updated_at on public.patients;
create trigger patients_touch_updated_at
  before update on public.patients
  for each row execute function public.touch_updated_at();

drop trigger if exists care_rel_touch_updated_at on public.care_relationships;
create trigger care_rel_touch_updated_at
  before update on public.care_relationships
  for each row execute function public.touch_updated_at();

/* ── 6. Activation ──────────────────────────────────────────────────────────
   Claiming a patient row that a caregiver created earlier. Written as a
   function because it is two writes that must not half-happen, and because the
   check "is this really the person invited" cannot be expressed as a policy. */

create or replace function public.activate_patient_profile(p_patient uuid)
returns public.patients
language plpgsql
security definer
set search_path = ''
as $$
declare
  me  uuid := (select auth.uid());
  row public.patients;
begin
  if me is null then
    raise exception 'not signed in';
  end if;

  update public.patients
     set user_id = me, status = 'active'
   where id = p_patient
     and user_id is null              -- never steal an already-claimed profile
     and status = 'pending_activation'
  returning * into row;

  if row.id is null then
    raise exception 'profil pasien tidak tersedia untuk diaktifkan';
  end if;

  return row;
end;
$$;

revoke all on function public.activate_patient_profile(uuid) from public;
grant execute on function public.activate_patient_profile(uuid) to authenticated;

commit;
