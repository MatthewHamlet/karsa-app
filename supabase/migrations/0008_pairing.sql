-- Karsa · 0008 · caregiver→patient pairing codes
--
-- Run once in the Supabase SQL editor, after 0007.
--
-- ── What this adds, and why it is the other direction ──────────────────────
-- 0004 gave every patient a permanent `share_code` that a caregiver types in.
-- That works, but it needs the patient to already have an account, to find
-- their own code, and to read it out — which is the wrong way round for the
-- flow this app is built on, where the caregiver is the one driving.
--
-- Here the caregiver generates a short-lived code, hands it over however they
-- like (screen, QR, WhatsApp), and the patient redeems it. No email, no SMTP,
-- and nothing on the patient's side to find first.
--
-- ── Where the relationship actually lands ──────────────────────────────────
-- In `care_relationships`, the table every RLS policy in 0002–0007 is written
-- against — `is_my_patient` and `can_care_for` both read it, and they are what
-- every other table's policies call. A separate `patient_caregiver_relations`
-- table would mean pairing writing a row that none of those policies consult:
-- the patient would show as linked and not one page of data would open.
--
-- So the pairing writes `care_relationships`, and `patient_caregiver_relations`
-- exists as a view over it at the bottom of this file. One source of truth,
-- and the name is still there to query.

begin;

-- ── Codes ──────────────────────────────────────────────────────────────────
-- Short-lived and single-use. `patient_id` is null until redeemed — it is the
-- record of who took the code, not a target set in advance.

create table if not exists public.pairing_codes (
  code         text        primary key,
  caregiver_id uuid        not null references public.profiles (id) on delete cascade,
  /* How the caregiver refers to this person once linked: "Ibu", "Nenek". Asked
     for when the code is made, because afterwards there is no moment to ask. */
  relation     text,
  expires_at   timestamptz not null,
  redeemed_at  timestamptz,
  redeemed_by  uuid        references public.profiles (id) on delete set null,
  patient_id   uuid        references public.patients (id) on delete set null,
  created_at   timestamptz not null default now(),

  constraint pairing_codes_redeem_is_complete check (
    (redeemed_at is null and redeemed_by is null and patient_id is null) or
    (redeemed_at is not null and redeemed_by is not null and patient_id is not null)
  )
);

create index if not exists pairing_codes_caregiver_idx
  on public.pairing_codes (caregiver_id, created_at desc);

-- Attempts, for rate limiting. A pairing code is the key to somebody's medical
-- history, so guessing at it has to cost something — see `redeem_pairing_code`.
create table if not exists public.pairing_attempts (
  id         uuid primary key default gen_random_uuid(),
  actor_id   uuid        not null references public.profiles (id) on delete cascade,
  tried_at   timestamptz not null default now(),
  ok         boolean     not null default false
);

create index if not exists pairing_attempts_actor_idx
  on public.pairing_attempts (actor_id, tried_at desc);

-- ── Generating a code ──────────────────────────────────────────────────────
-- `KRS-` and six characters, from an alphabet with no 0/O, 1/I/L and no vowels.
--
-- Six, not three. The format in the brief was `KRS-888`, and three random
-- characters is a keyspace of about forty thousand — small enough that a script
-- walking it lands on a live code within minutes, and the prize is being
-- attached to a stranger's blood pressure and medication list as their
-- caregiver. Six keeps the same shape and the same "KRS-" prefix, reads the
-- same over the phone, and is about two billion. The rate limit below is the
-- second half of that; neither is sufficient alone.
--
-- The vowels are dropped so a random draw cannot spell something unfortunate,
-- and the lookalike digits so a code read aloud to an elderly relative survives
-- the trip.

create or replace function public.new_pair_code()
returns text
language plpgsql
volatile
set search_path = ''
as $$
declare
  alphabet constant text := '23456789BCDFGHJKMNPQRSTVWXYZ';
  candidate text;
  i int;
begin
  loop
    candidate := 'KRS-';
    for i in 1..6 loop
      candidate := candidate ||
        substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;

    exit when not exists (
      select 1 from public.pairing_codes pc where pc.code = candidate
    );
  end loop;

  return candidate;
end;
$$;

/* Issues a code for whoever is asking, valid 24 hours.
 *
 * `security definer` so it can write a row the caller has no insert policy for,
 * and so the uniqueness loop above can see codes belonging to other caregivers
 * — without that it would happily hand out a duplicate of somebody else's.
 *
 * An unexpired, unredeemed code is reused rather than replaced. Otherwise every
 * re-open of the modal invalidates the code the caregiver already wrote down or
 * sent, which is the single most annoying way for this feature to fail. */
create or replace function public.create_pairing_code(p_relation text default null)
returns table (code text, expires_at timestamptz, relation text)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
  fresh text;
begin
  if me is null then
    raise exception 'not signed in';
  end if;

  /* One live code per caregiver at a time. Handing out a fistful of valid keys
     to the same house is not a feature. */
  return query
    select pc.code, pc.expires_at, pc.relation
    from public.pairing_codes pc
    where pc.caregiver_id = me
      and pc.redeemed_at is null
      and pc.expires_at > now()
    order by pc.created_at desc
    limit 1;

  if found then
    return;
  end if;

  fresh := public.new_pair_code();

  return query
    insert into public.pairing_codes (code, caregiver_id, relation, expires_at)
    values (fresh, me, nullif(trim(coalesce(p_relation, '')), ''), now() + interval '24 hours')
    returning pairing_codes.code, pairing_codes.expires_at, pairing_codes.relation;
end;
$$;

/* Redeeming, run by the patient.
 *
 * Does four things that must not half-happen — find the code, make sure the
 * caller has a patient record, link them, burn the code — so it is one function
 * and one transaction rather than four round trips from the browser.
 *
 * Returns a json verdict instead of raising, because "that code is not valid"
 * is an ordinary answer to give somebody, not an exception. */
create or replace function public.redeem_pairing_code(p_code text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  me         uuid := (select auth.uid());
  normalised text := upper(trim(p_code));
  recent     int;
  row_code   public.pairing_codes%rowtype;
  my_patient uuid;
  my_name    text;
  giver_name text;
begin
  if me is null then
    return jsonb_build_object('ok', false, 'reason', 'not_signed_in');
  end if;

  /* Ten tries an hour. Enough that somebody squinting at a handwritten code
     gets it in the end; not enough to walk a keyspace. Counted per account, so
     it costs an attacker a fresh signup for every ten guesses. */
  select count(*) into recent
  from public.pairing_attempts pa
  where pa.actor_id = me
    and pa.tried_at > now() - interval '1 hour'
    and not pa.ok;

  if recent >= 10 then
    return jsonb_build_object('ok', false, 'reason', 'rate_limited');
  end if;

  /* Accepts the code with or without its prefix, because half the people typing
     it in will have been read the last six characters over the phone. */
  if normalised !~ '^KRS-' then
    normalised := 'KRS-' || normalised;
  end if;

  select * into row_code
  from public.pairing_codes pc
  where pc.code = normalised
  for update;

  if row_code.code is null
     or row_code.redeemed_at is not null
     or row_code.expires_at <= now() then
    insert into public.pairing_attempts (actor_id, ok) values (me, false);
    /* One answer for "no such code", "already used" and "expired". Telling them
       apart is a way to confirm that a code exists, which is exactly what a
       script walking the keyspace wants to know. */
    return jsonb_build_object('ok', false, 'reason', 'invalid');
  end if;

  if row_code.caregiver_id = me then
    insert into public.pairing_attempts (actor_id, ok) values (me, false);
    return jsonb_build_object('ok', false, 'reason', 'own_code');
  end if;

  /* The caller's own patient record, created if this is their first link.
     `status` and `user_id` are written together because the table's
     `patients_link_matches_status` constraint requires it: a linked patient is
     by definition activated. */
  select pt.id into my_patient
  from public.patients pt
  where pt.user_id = me;

  if my_patient is null then
    select coalesce(nullif(trim(pr.full_name), ''), 'Pasien') into my_name
    from public.profiles pr
    where pr.id = me;

    insert into public.patients (user_id, display_name, created_by, status)
    values (me, coalesce(my_name, 'Pasien'), me, 'active')
    returning id into my_patient;
  end if;

  /* `active` immediately, with no pending step. The consent this table exists
     to record is the patient's, and the patient is the one running this
     function — asking them to approve their own action would be theatre. */
  insert into public.care_relationships
    (caregiver_id, patient_id, status, relation, invited_by, accepted_at)
  values
    (row_code.caregiver_id, my_patient, 'active', row_code.relation,
     row_code.caregiver_id, now())
  on conflict (caregiver_id, patient_id) do update
    set status      = 'active',
        accepted_at = now(),
        relation    = coalesce(public.care_relationships.relation, excluded.relation);

  update public.pairing_codes
  set redeemed_at = now(), redeemed_by = me, patient_id = my_patient
  where code = row_code.code;

  insert into public.pairing_attempts (actor_id, ok) values (me, true);

  select coalesce(nullif(trim(pr.full_name), ''), 'Pendamping') into giver_name
  from public.profiles pr
  where pr.id = row_code.caregiver_id;

  return jsonb_build_object('ok', true, 'caregiver_name', giver_name);
end;
$$;

/* `anon` is explicitly stripped. Both of these are `security definer`, so a
   grant to anon would be a way to mint and burn pairing codes with no account
   at all. */
revoke all on function public.create_pairing_code(text) from public, anon;
revoke all on function public.redeem_pairing_code(text)  from public, anon;
grant execute on function public.create_pairing_code(text) to authenticated;
grant execute on function public.redeem_pairing_code(text)  to authenticated;

-- ── RLS ────────────────────────────────────────────────────────────────────
-- Read-only, and only your own. Every write goes through the two functions
-- above, which is what stops a caregiver setting their own expiry date or
-- marking somebody else's code as redeemed.

alter table public.pairing_codes    enable row level security;
alter table public.pairing_attempts enable row level security;

drop policy if exists "pairing_codes: read own" on public.pairing_codes;
create policy "pairing_codes: read own"
  on public.pairing_codes for select
  using ( caregiver_id = (select auth.uid()) );

drop policy if exists "pairing_codes: cancel own" on public.pairing_codes;
create policy "pairing_codes: cancel own"
  on public.pairing_codes for delete
  using ( caregiver_id = (select auth.uid()) and redeemed_at is null );

/* No policy at all on `pairing_attempts`, and that is deliberate rather than an
   omission: RLS is on, so with no policy nobody can read or write it through
   the API. Only the `security definer` function above touches it, which is the
   whole point — a rate limit the person being limited can delete is not one. */

-- ── The name the brief asked for ───────────────────────────────────────────
-- A view, not a table. Same rows as `care_relationships`, named the way the
-- pairing feature talks about them, and `security_invoker` so it is governed by
-- that table's policies rather than the view owner's rights.

create or replace view public.patient_caregiver_relations
with (security_invoker = true) as
  select
    cr.id,
    cr.patient_id,
    cr.caregiver_id,
    cr.status,
    cr.relation,
    cr.accepted_at,
    cr.created_at
  from public.care_relationships cr;

comment on view public.patient_caregiver_relations is
  'The caregiver–patient links, under the name the pairing flow uses. A view
   over care_relationships, which is the table every RLS policy in this schema
   is written against — there is deliberately no second relations table.';

commit;
