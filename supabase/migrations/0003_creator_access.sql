-- Karsa · 0003 · access to unclaimed patient profiles
--
-- Run after 0002. Idempotent.
--
-- ── The hole this closes ────────────────────────────────────────────────────
-- 0002 let a caregiver INSERT a patient profile for someone with no Karsa
-- account, then never let them read it back: the select policy granted access
-- only to the patient themselves or to a caregiver with an `active`
-- relationship, and a person who does not exist yet cannot accept anything.
-- The caregiver wrote a row into a void.
--
-- ── Why this does not weaken the consent model ──────────────────────────────
-- Access is scoped to rows that are still `pending_activation` — nobody owns
-- them. Consent is something only a person can give, and there is no person
-- here yet; there is a note a caregiver wrote about someone they look after.
--
-- The moment a real account claims the row (`activate_patient_profile` sets
-- `user_id` and flips status to `active`), this policy stops matching and the
-- ordinary rules take over: from then on the patient decides, and the caregiver
-- keeps access only through an accepted relationship. So creating a profile
-- buys temporary stewardship, never permanent ownership.

begin;

create or replace function public.i_created_unclaimed(p_patient uuid)
returns boolean
language sql
stable
security definer            -- breaks RLS recursion; see the note in 0002
set search_path = ''
as $$
  select exists (
    select 1 from public.patients
    where id = p_patient
      and created_by = (select auth.uid())
      and user_id is null
      and status = 'pending_activation'
  );
$$;

drop policy if exists "patients: read own or cared-for" on public.patients;
create policy "patients: read own or cared-for"
  on public.patients for select
  using (
    public.is_my_patient(id)
    or public.can_care_for(id)
    or public.i_created_unclaimed(id)
  );

drop policy if exists "patients: own or active caregiver updates" on public.patients;
create policy "patients: own or active caregiver updates"
  on public.patients for update
  using (
    public.is_my_patient(id)
    or public.can_care_for(id)
    or public.i_created_unclaimed(id)
  )
  with check (
    public.is_my_patient(id)
    or public.can_care_for(id)
    or public.i_created_unclaimed(id)
  );

/* ── The invitation a caregiver writes for their own unclaimed profile ───────
   Same reasoning: with nobody to accept, an invitation that can only ever sit
   at `pending` would leave the caregiver unable to see the patient they just
   entered. So a relationship to an *unclaimed* profile may start `active`.

   It stays impossible to self-approve a relationship with a real person — that
   still requires `status = 'pending'`, and only the patient can move it on. */
drop policy if exists "care: caregiver invites" on public.care_relationships;
create policy "care: caregiver invites"
  on public.care_relationships for insert
  with check (
    caregiver_id = (select auth.uid())
    and invited_by = (select auth.uid())
    and (
      (status = 'pending' and accepted_at is null)
      or (status = 'active' and public.i_created_unclaimed(patient_id))
    )
  );

commit;
