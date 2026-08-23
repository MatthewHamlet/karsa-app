begin;

delete from public.community_groups a
using public.community_groups b
where a.created_by = b.created_by
  and a.created_by is not null
  and a.id > b.id;

create unique index if not exists community_groups_one_per_creator
  on public.community_groups (created_by)
  where created_by is not null;

create or replace function public.join_group_creator()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.created_by is not null then
    insert into public.community_group_members (group_id, profile_id)
    values (new.id, new.created_by)
    on conflict do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists community_groups_join_creator on public.community_groups;
create trigger community_groups_join_creator
  after insert on public.community_groups
  for each row execute function public.join_group_creator();

insert into public.community_group_members (group_id, profile_id)
select g.id, g.created_by
from public.community_groups g
where g.created_by is not null
on conflict do nothing;

create or replace function public.is_group_admin(p_group uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.community_groups
    where id = p_group and created_by = (select auth.uid())
  );
$$;

revoke all on function public.is_group_admin(uuid) from public, anon;
grant execute on function public.is_group_admin(uuid) to authenticated;

drop policy if exists "community_group_members: leave own" on public.community_group_members;
create policy "community_group_members: leave or kick"
  on public.community_group_members for delete to authenticated
  using (
    (profile_id = (select auth.uid()) and not public.is_group_admin(group_id))
    or (public.is_group_admin(group_id) and profile_id <> (select auth.uid()))
  );

drop policy if exists "community_groups: edit own" on public.community_groups;
create policy "community_groups: edit own"
  on public.community_groups for update to authenticated
  using ( created_by = (select auth.uid()) )
  with check ( created_by = (select auth.uid()) );

drop policy if exists "community_groups: delete own" on public.community_groups;
create policy "community_groups: delete own"
  on public.community_groups for delete to authenticated
  using ( created_by = (select auth.uid()) );

commit;
