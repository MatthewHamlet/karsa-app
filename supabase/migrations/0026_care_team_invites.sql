-- Karsa · 0026 · asking somebody to join a care team
--
-- Run once in the Supabase SQL editor, after 0025.
--
-- "Tambahkan ke perawatan" on a community profile cannot be an insert into
-- `care_relationships`. 0002's policy is deliberate:
--
--   create policy "care: caregiver invites" ... with check (
--     caregiver_id = (select auth.uid()) and invited_by = (select auth.uid())
--     and status = 'pending' )
--
-- A caregiver may ask on their own behalf and nobody else's, and only the
-- patient can move the request past pending. That is the right rule and this
-- migration does not weaken it. Adding somebody to a care team touches two
-- people who both have to agree — the person being added, who is taking on
-- responsibility for a stranger's mother, and the patient, whose health record
-- is what gets opened.
--
-- So the button creates an *invitation*, not a relationship. The invited person
-- accepts, and accepting is what performs the insert 0002 already allows — as
-- them, with their own id in `caregiver_id`. The patient then approves it the
-- same way they approve any other request.
--
-- One exception, and it is not a loophole: when the patient is the one doing
-- the inviting, their approval has already happened by definition, so accepting
-- lands as `active`.

begin;

create table if not exists public.care_team_invites (
  id           uuid primary key default gen_random_uuid(),
  patient_id   uuid        not null references public.patients (id) on delete cascade,
  invitee_id   uuid        not null references public.profiles (id) on delete cascade,
  invited_by   uuid        not null references public.profiles (id) on delete cascade,
  status       text        not null default 'pending'
                           check (status in ('pending', 'accepted', 'declined')),
  created_at   timestamptz not null default now(),
  responded_at timestamptz
);

-- One open ask per person per patient. Partial, so a declined invitation can be
-- sent again later — people change their minds, and the alternative is a dead
-- row blocking the request forever.
create unique index if not exists care_team_invites_one_pending
  on public.care_team_invites (patient_id, invitee_id)
  where status = 'pending';

create index if not exists care_team_invites_invitee_idx
  on public.care_team_invites (invitee_id, status);

alter table public.care_team_invites enable row level security;

-- Everyone with a stake sees it: the person asked, the person asking, the
-- patient, and the rest of the team who should not send a second one.
drop policy if exists "care invites: read if involved" on public.care_team_invites;
create policy "care invites: read if involved"
  on public.care_team_invites for select to authenticated
  using (
    invitee_id = (select auth.uid())
    or invited_by = (select auth.uid())
    or public.is_my_patient(patient_id)
    or public.can_care_for(patient_id)
  );

-- Only somebody already on this patient's side may ask somebody else to join,
-- and only in their own name. `status = 'pending'` is checked here for the same
-- reason 0002 checks it: an insert is a question, never an answer.
drop policy if exists "care invites: send as team" on public.care_team_invites;
create policy "care invites: send as team"
  on public.care_team_invites for insert to authenticated
  with check (
    invited_by = (select auth.uid())
    and status = 'pending'
    and ( public.is_my_patient(patient_id) or public.can_care_for(patient_id) )
  );

-- The invited person answers. Nobody else can, including the sender — a sender
-- who could set `accepted` would be back to adding people without asking.
drop policy if exists "care invites: invitee answers" on public.care_team_invites;
create policy "care invites: invitee answers"
  on public.care_team_invites for update to authenticated
  using      ( invitee_id = (select auth.uid()) )
  with check ( invitee_id = (select auth.uid()) );

drop policy if exists "care invites: sender withdraws" on public.care_team_invites;
create policy "care invites: sender withdraws"
  on public.care_team_invites for delete to authenticated
  using ( invited_by = (select auth.uid()) );

-- ── Accepting ──────────────────────────────────────────────────────────────
-- Two writes that must not half-happen: the relationship appears and the
-- invitation closes, or neither does. In one function so a failure between them
-- is impossible.
--
-- `security definer` is doing something narrow here. The `care_relationships`
-- insert it performs is one the caller could legally do themselves — same
-- `caregiver_id`, same `pending` — so this is not privilege the caller lacks.
-- What it buys is the `active` branch: when the patient did the inviting, their
-- consent is already on record, and no policy can see that fact from inside the
-- insert. Hence the re-check of `auth.uid()` on the first line: the function
-- trusts nothing about who is calling it.
create or replace function public.accept_care_invite(p_invite uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite public.care_team_invites%rowtype;
  v_patient_user uuid;
  v_status text;
begin
  select * into v_invite
  from public.care_team_invites
  where id = p_invite
    and invitee_id = (select auth.uid())
    and status = 'pending';

  if not found then
    raise exception 'Undangan tidak ditemukan atau sudah dijawab.';
  end if;

  select user_id into v_patient_user from public.patients where id = v_invite.patient_id;

  -- Invited by the patient themselves: the approval this would otherwise wait
  -- for has already been given.
  v_status := case when v_patient_user is not null and v_patient_user = v_invite.invited_by
                   then 'active' else 'pending' end;

  insert into public.care_relationships (caregiver_id, patient_id, invited_by, status, accepted_at)
  values (
    v_invite.invitee_id,
    v_invite.patient_id,
    v_invite.invited_by,
    v_status,
    case when v_status = 'active' then now() else null end
  )
  on conflict do nothing;

  update public.care_team_invites
  set status = 'accepted', responded_at = now()
  where id = p_invite;
end;
$$;

revoke all on function public.accept_care_invite(uuid) from public, anon;
grant execute on function public.accept_care_invite(uuid) to authenticated;

commit;
