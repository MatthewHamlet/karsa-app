-- Karsa · 0004 · share codes, and a patient row for every patient account
--
-- Run after 0003. Idempotent.
--
-- ── Why a code, and not a search box ────────────────────────────────────────
-- A caregiver has to be able to point at an existing patient. The obvious way
-- is to look them up by email — and that turns the "add patient" form into a
-- free tool for testing whether any given address has a Karsa account, which is
-- a privacy leak dressed as a feature. Worse, it lets a stranger fire off
-- invitations at people they merely suspect are here.
--
-- So the patient holds a short code and hands it over deliberately. Nothing can
-- be enumerated: without the code there is no way to name a patient at all, and
-- the lookup below returns a display name and nothing else.

begin;

/* ── 1. The code ────────────────────────────────────────────────────────────
   Deliberately short enough to read down a phone line. The alphabet drops
   0/O/1/I/L, which are the characters people mistype when copying by hand. */

create or replace function public.new_share_code()
returns text
language plpgsql
volatile
set search_path = ''
as $$
declare
  alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  candidate text;
  i integer;
begin
  loop
    candidate := '';
    for i in 1..8 loop
      candidate := candidate || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    /* Collisions are vanishingly unlikely at 31^8, but "unlikely" is not
       "impossible" and a duplicate here would hand one patient's caregiver to
       another. Loop until the insert can actually succeed. */
    exit when not exists (select 1 from public.patients where share_code = candidate);
  end loop;
  return candidate;
end;
$$;

alter table public.patients
  add column if not exists share_code text unique;

update public.patients set share_code = public.new_share_code() where share_code is null;

alter table public.patients
  alter column share_code set default public.new_share_code(),
  alter column share_code set not null;

/* ── 2. Every patient account gets a patient row ────────────────────────────
   Signing up with role 'patient' created a profile and nothing else, so the
   person had no record to attach care data to and no code to share. The
   trigger from 0002 is extended rather than replaced alongside it — one
   trigger, one source of truth for what a new account gets. */

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  chosen_role text;
  chosen_name text;
begin
  chosen_name := coalesce(new.raw_user_meta_data ->> 'full_name', '');
  chosen_role := case
    when new.raw_user_meta_data ->> 'role' in ('patient', 'caregiver')
      then new.raw_user_meta_data ->> 'role'
    when new.raw_user_meta_data ->> 'role' = 'pasien'      then 'patient'
    when new.raw_user_meta_data ->> 'role' = 'pendamping'  then 'caregiver'
    /* Google sign-in sends no role of ours at all, so this is the common path,
       not an edge case. Caregiver is the safer default: it grants nothing on
       its own, whereas defaulting to patient would create a care record for
       somebody who never asked for one. */
    else 'caregiver'
  end;

  insert into public.profiles (id, full_name, role)
  values (new.id, chosen_name, chosen_role)
  on conflict (id) do nothing;

  if chosen_role = 'patient' then
    insert into public.patients (user_id, display_name, created_by, status)
    values (
      new.id,
      nullif(trim(chosen_name), ''),
      new.id,
      'active'
    )
    on conflict (user_id) do nothing;
  end if;

  return new;
end;
$$;

/* Backfill: patient accounts created before this trigger existed. */
insert into public.patients (user_id, display_name, created_by, status)
select p.id, coalesce(nullif(trim(p.full_name), ''), 'Pasien'), p.id, 'active'
from public.profiles p
where p.role = 'patient'
  and not exists (select 1 from public.patients pt where pt.user_id = p.id)
on conflict (user_id) do nothing;

/* ── 3. Looking a patient up by their code ──────────────────────────────────
   `security definer` so it can read past RLS — the caregiver has no
   relationship yet, so the ordinary select policy correctly refuses them.
   Returns the display name and the id, never an email, and only ever for an
   exact code match. */

create or replace function public.find_patient_by_code(p_code text)
returns table (patient_id uuid, display_name text, already_linked boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select
    pt.id,
    pt.display_name,
    exists (
      select 1 from public.care_relationships cr
      where cr.patient_id = pt.id
        and cr.caregiver_id = (select auth.uid())
        and cr.status in ('pending', 'active')
    )
  from public.patients pt
  where pt.share_code = upper(trim(p_code))
    and (select auth.uid()) is not null
  limit 1;
$$;

revoke all on function public.find_patient_by_code(text) from public, anon;
grant execute on function public.find_patient_by_code(text) to authenticated;

/* A caregiver may read their own patients' codes; the patient reads their own.
   Covered already by the select policy on `patients` — no extra policy needed,
   the column simply travels with the row. */

commit;
