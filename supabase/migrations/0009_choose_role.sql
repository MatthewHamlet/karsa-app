-- Karsa · 0009 · picking a role after a Google sign-in
--
-- Run once in the Supabase SQL editor, after 0008.
--
-- ── The gap this closes ────────────────────────────────────────────────────
-- The email signup form asks "pendamping or pasien" and passes the answer as
-- user metadata, which `handle_new_user` reads. Google sends no such field, so
-- every Google account falls to the `else 'caregiver'` branch in that trigger —
-- a default, not a choice. A patient signing in with Google therefore landed
-- silently in the caregiver app.
--
-- The app now asks them, once, straight after the callback. Two things have to
-- exist for that to work, and neither belongs in application code:
--
--   · a patient who picks "pasien" late needs the `patients` row that the
--     signup trigger would have made for them, and the insert policy on that
--     table deliberately refuses a self-linked row (see 0002) — so it takes a
--     `security definer` function;
--   · the role on `profiles` has to be writable by its owner, which no policy
--     currently allows.

begin;

-- ── Letting somebody set their own role ────────────────────────────────────
-- `profiles` has had no update policy at all, so every field on it was
-- read-only through the API. This adds the narrowest one that makes the choice
-- possible: your own row, and the row has to still be yours afterwards.
--
-- Note what it does *not* constrain — a person may change their mind later, and
-- there is nothing dangerous about that. A role decides which of the two front
-- ends you see; it grants no access to anybody's data on its own. Every table
-- that holds care data is governed by `care_relationships`, not by this column.

drop policy if exists "profiles: update own" on public.profiles;
create policy "profiles: update own"
  on public.profiles for update
  using      ( id = (select auth.uid()) )
  with check ( id = (select auth.uid()) );

-- ── The patient row, created on demand ─────────────────────────────────────
-- Same body as the block inside `redeem_pairing_code`, lifted out so both
-- callers share one definition of "make sure this person has a patient record".
--
-- `security definer` because the insert policy on `patients` only permits a
-- caregiver creating an *unclaimed* profile — `user_id is null`. A row that
-- points at yourself is exactly what that policy is written to refuse, and
-- rightly so: it is how a caregiver would otherwise fabricate a patient.

create or replace function public.ensure_my_patient_record()
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  me      uuid := (select auth.uid());
  existing uuid;
  my_name text;
begin
  if me is null then
    raise exception 'not signed in';
  end if;

  select pt.id into existing from public.patients pt where pt.user_id = me;
  if existing is not null then
    return existing;
  end if;

  /* `display_name` is `not null` with a non-empty check, and a Google account
     with no name on it would otherwise fail that constraint rather than the
     person's first screen simply saying "Pasien". */
  select coalesce(nullif(trim(pr.full_name), ''), 'Pasien') into my_name
  from public.profiles pr
  where pr.id = me;

  insert into public.patients (user_id, display_name, created_by, status)
  values (me, coalesce(my_name, 'Pasien'), me, 'active')
  on conflict (user_id) do nothing
  returning id into existing;

  /* `on conflict do nothing` returns no row, so a race that lost still has to
     go and read the winner's id rather than returning null. */
  if existing is null then
    select pt.id into existing from public.patients pt where pt.user_id = me;
  end if;

  return existing;
end;
$$;

revoke all on function public.ensure_my_patient_record() from public, anon;
grant execute on function public.ensure_my_patient_record() to authenticated;

commit;
