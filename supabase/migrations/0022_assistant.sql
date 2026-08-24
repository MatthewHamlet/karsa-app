begin;

create table if not exists public.assistant_threads (
  id         uuid primary key default gen_random_uuid(),
  patient_id uuid        not null references public.patients (id) on delete cascade,
  owner_id   uuid        not null references public.profiles (id) on delete cascade,
  title      text        not null default 'Obrolan baru',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists assistant_threads_owner_idx
  on public.assistant_threads (owner_id, updated_at desc);

create table if not exists public.assistant_messages (
  id         uuid primary key default gen_random_uuid(),
  thread_id  uuid        not null references public.assistant_threads (id) on delete cascade,
  role       text        not null check (role in ('user', 'model')),
  body       text        not null check (length(trim(body)) > 0),
  created_at timestamptz not null default now()
);

create index if not exists assistant_messages_thread_idx
  on public.assistant_messages (thread_id, created_at);

alter table public.assistant_threads  enable row level security;
alter table public.assistant_messages enable row level security;

drop policy if exists "assistant_threads: own" on public.assistant_threads;
create policy "assistant_threads: own"
  on public.assistant_threads for all to authenticated
  using      ( owner_id = (select auth.uid()) )
  with check ( owner_id = (select auth.uid()) );

drop policy if exists "assistant_messages: own thread" on public.assistant_messages;
create policy "assistant_messages: own thread"
  on public.assistant_messages for all to authenticated
  using (
    exists (
      select 1 from public.assistant_threads t
      where t.id = thread_id and t.owner_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.assistant_threads t
      where t.id = thread_id and t.owner_id = (select auth.uid())
    )
  );

drop trigger if exists assistant_threads_touch on public.assistant_threads;
create trigger assistant_threads_touch
  before update on public.assistant_threads
  for each row execute function public.touch_updated_at();

commit;

notify pgrst, 'reload schema';
