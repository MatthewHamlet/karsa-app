-- Karsa · 0023 · group chat, live
--
-- Run once in the Supabase SQL editor, after 0022.
--
-- 0015 gave the group conversation a table, RLS and a send action. What it did
-- not give it was a way to hear about a message you did not send: the component
-- refetched after its own insert and otherwise sat still, so two people in the
-- same group each saw a conversation with half the lines missing until one of
-- them reloaded.
--
-- Realtime is the missing half, and it is a publication away. Two things worth
-- knowing about how it behaves here:
--
--   * The row still goes through RLS. A `postgres_changes` subscriber is
--     handed the change only if the `select` policy on the table would have
--     let them read it — which for this table is `is_group_member`. So this
--     does not widen who can see a message; it only lets the people who could
--     already read it find out sooner.
--
--   * Typing indicators deliberately do NOT go through this table. They are
--     broadcast on the channel and never stored: "sedang mengetik" is true for
--     about two seconds and is nobody's business afterwards. A `typing` column
--     would mean a write per keystroke and a permanent record of hesitation.

begin;

-- `add table` errors if the table is already published, and this file has to be
-- safe to run twice like every migration before it.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'community_group_messages'
  ) then
    alter publication supabase_realtime add table public.community_group_messages;
  end if;
end $$;

-- The payload Realtime sends for an insert is the row as it was written:
-- `author_id`, not the author's name, initial or colour. The client turns that
-- into a rendered message by refetching, which keeps one definition of how a
-- message looks — see `getGroupMessages`. `replica identity full` is therefore
-- not needed for inserts, but deletes send only the primary key without it, and
-- a member removing their own line should disappear from everyone's screen too.
alter table public.community_group_messages replica identity full;

commit;
