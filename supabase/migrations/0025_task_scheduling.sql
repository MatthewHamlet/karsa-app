-- Karsa · 0025 · daily tasks get a time, a note, and an owner
--
-- Run once in the Supabase SQL editor, after 0024.
--
-- Three things 0005's `daily_tasks` could not express, all of which a care team
-- of more than one person needs immediately:
--
--   * WHEN. `hint` was free text — '07:00', 'Sepanjang hari', 'Siang' — which
--     reads fine and sorts as nonsense. A task cannot be handed out by time of
--     day if the time of day is prose, so `at_time` is a real `time`. `hint`
--     stays for the tasks that genuinely have no clock ("Sepanjang hari"), and
--     the UI prefers `at_time` whenever it is set.
--
--   * WHO. A second caregiver joins and every task is silently addressed to
--     both of them. `assignee_id` names one person; null keeps the old meaning,
--     which is "whoever gets to it first".
--
--   * WHY. `note` is the standing instruction that belongs to the task rather
--     than to the day — "setelah makan, jangan perut kosong". It was going in
--     `care_notes` and losing its connection to the task it was about.

begin;

alter table public.daily_tasks
  add column if not exists at_time     time,
  add column if not exists note        text,
  add column if not exists assignee_id uuid references public.profiles (id) on delete set null;

-- One task, one owner, no duplicates.
--
-- The rule asked for is that two people in a group cannot be given the same
-- task. Having a single `assignee_id` column is half of it — a row cannot name
-- two people. This index is the other half: it stops the same task from
-- existing twice in the first place, which is how it would otherwise happen —
-- two caregivers each adding "Obat pagi" at 07:00, ending up with one each and
-- a patient scheduled for two doses.
--
-- Cased and trimmed, so "Obat pagi" and " obat  pagi" are the same task rather
-- than two. Partial on `active`, so retiring a task frees its name again.
create unique index if not exists daily_tasks_unique_per_slot
  on public.daily_tasks (patient_id, lower(trim(label)), coalesce(at_time, time '00:00'))
  where active;

create index if not exists daily_tasks_assignee_idx
  on public.daily_tasks (assignee_id) where active;

-- ── A new patient starts genuinely empty ───────────────────────────────────
-- 0007 seeded five tasks on the theory that a blank page is a worse first
-- impression than a wrong one. It is not, once the tasks are assignable: the
-- seeded five arrive owned by nobody, at times nobody chose, and the first
-- thing a caregiver does is delete them. Worse, they arrive before the second
-- caregiver does, so the "who does what" conversation starts from five
-- decisions that were never made.
--
-- The care notes stay. Those are advice, they are true of every patient, and
-- nobody has to undo them.
create or replace function public.seed_patient_defaults()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.care_notes (patient_id, body, sort_order, created_by)
  values
    (new.id, 'Obat diminum setelah makan, jangan saat perut kosong.', 1, new.created_by),
    (new.id, 'Hubungi tim perawatan bila ada kondisi tidak biasa.',   2, new.created_by);

  return new;
end;
$$;

commit;
