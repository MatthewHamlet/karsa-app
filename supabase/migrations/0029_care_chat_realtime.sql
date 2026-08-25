-- Karsa · 0029 · care team + patient chat, live
--
-- Run once in the Supabase SQL editor, after 0028.
--
-- 0023 did this for the community group chat. The care side needs the same
-- treatment for two conversations that were both waiting on a manual reload:
--
--   * `care_messages` — the patient and their caregivers talking to each other.
--     Same problem 0023 described: whoever did not send the message saw nothing
--     until they refreshed.
--
--   * `care_relationships` — the consent row. A caregiver types the patient's
--     invite code and a `pending` row appears, but the patient's Terima / Tolak
--     card only showed up on the next page load, which is the worst possible
--     moment for it to be slow: somebody is standing there waiting to be let in.
--
-- RLS still decides who hears about a change. `care_messages` is gated by
-- `is_my_patient or can_care_for` (0007) and `care_relationships` by
-- `caregiver_id = auth.uid() or is_my_patient(patient_id)` (0002), so this
-- widens nothing — it only shortens the wait for people already allowed to look.

begin;

-- `add table` errors if the table is already published, and this file has to be
-- safe to run twice like every migration before it.
do $$
declare
  t text;
begin
  foreach t in array array['care_messages', 'care_relationships'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- Both clients refetch on any change rather than rendering the payload, so
-- inserts and updates would work without this. Deletes are why it is here: they
-- send only the primary key otherwise, and RLS cannot judge a row it was not
-- given — a withdrawn request would linger on the patient's screen.
alter table public.care_messages      replica identity full;
alter table public.care_relationships replica identity full;

commit;
