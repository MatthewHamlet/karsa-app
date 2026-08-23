begin;

create table if not exists public.community_group_messages (
  id         uuid primary key default gen_random_uuid(),
  group_id   uuid        not null references public.community_groups (id) on delete cascade,
  author_id  uuid        not null references public.profiles (id) on delete cascade,
  body       text        not null check (length(trim(body)) > 0),
  created_at timestamptz not null default now()
);

create index if not exists community_group_messages_idx
  on public.community_group_messages (group_id, created_at);

create or replace function public.is_group_member(p_group uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.community_group_members
    where group_id = p_group and profile_id = (select auth.uid())
  );
$$;

revoke all on function public.is_group_member(uuid) from public, anon;
grant execute on function public.is_group_member(uuid) to authenticated;

alter table public.community_group_messages enable row level security;

drop policy if exists "group messages: read as member" on public.community_group_messages;
create policy "group messages: read as member"
  on public.community_group_messages for select to authenticated
  using ( public.is_group_member(group_id) );

drop policy if exists "group messages: send as member" on public.community_group_messages;
create policy "group messages: send as member"
  on public.community_group_messages for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and public.is_group_member(group_id)
  );

drop policy if exists "group messages: delete own" on public.community_group_messages;
create policy "group messages: delete own"
  on public.community_group_messages for delete to authenticated
  using ( author_id = (select auth.uid()) );

commit;
