-- Karsa · 0005 · daily tasks, health readings, meals, medication
--
-- Semua tabel di sini pakai pola akses yang sama dengan 0002:
-- is_my_patient() untuk si pasien sendiri, can_care_for() untuk caregiver
-- dengan relasi 'active'. Tidak ada tabel di sini yang punya caregiver_id —
-- semuanya menempel ke patient_id, dan siapa boleh baca/tulis diputuskan RLS.

begin;

-- ── 1. Tugas harian ────────────────────────────────────────────────────────
-- `daily_tasks` adalah definisi tugas berulang (bukan per-tanggal).
-- `task_completions` mencatat tanggal mana tugas itu sudah dicentang — jadi
-- riwayat harian otomatis ada tanpa perlu bikin baris tugas baru tiap hari.

create table if not exists public.daily_tasks (
  id           uuid primary key default gen_random_uuid(),
  patient_id   uuid        not null references public.patients (id) on delete cascade,
  label        text        not null check (length(trim(label)) > 0),
  hint         text,
  sort_order   int         not null default 0,
  active       boolean     not null default true,
  created_by   uuid        references public.profiles (id) on delete set null,
  created_at   timestamptz not null default now()
);

create table if not exists public.task_completions (
  id           uuid primary key default gen_random_uuid(),
  task_id      uuid        not null references public.daily_tasks (id) on delete cascade,
  patient_id   uuid        not null references public.patients (id) on delete cascade,
  done_on      date        not null default (now() at time zone 'Asia/Jakarta')::date,
  completed_by uuid        references public.profiles (id) on delete set null,
  completed_at timestamptz not null default now(),
  constraint task_completions_unique_per_day unique (task_id, done_on)
);

create index if not exists daily_tasks_patient_idx on public.daily_tasks (patient_id) where active;
create index if not exists task_completions_patient_day_idx on public.task_completions (patient_id, done_on);

-- ── 2. Bacaan kesehatan (satu tabel generik) ───────────────────────────────
-- Menampung tensi, gula darah, SpO2, detak jantung, suhu, berat, cairan, dan
-- tidur. `value` adalah angka utama (sistolik / kadar gula / ml / menit dst),
-- `value_secondary` hanya dipakai tensi (diastolik).

create table if not exists public.health_readings (
  id              uuid primary key default gen_random_uuid(),
  patient_id      uuid        not null references public.patients (id) on delete cascade,
  kind            text        not null check (kind in (
                    'blood_pressure', 'blood_sugar', 'oxygen', 'heart_rate',
                    'temperature', 'weight', 'fluid', 'sleep_minutes'
                  )),
  value           numeric     not null,
  value_secondary numeric,
  recorded_by     uuid        references public.profiles (id) on delete set null,
  recorded_at     timestamptz not null default now()
);

create index if not exists health_readings_patient_kind_idx
  on public.health_readings (patient_id, kind, recorded_at desc);

-- ── 3. Makan ────────────────────────────────────────────────────────────────

create table if not exists public.meal_logs (
  id          uuid primary key default gen_random_uuid(),
  patient_id  uuid        not null references public.patients (id) on delete cascade,
  meal        text        not null check (meal in ('sarapan', 'makan_siang', 'makan_malam')),
  done_on     date        not null default (now() at time zone 'Asia/Jakarta')::date,
  logged_by   uuid        references public.profiles (id) on delete set null,
  logged_at   timestamptz not null default now(),
  constraint meal_logs_unique_per_day unique (patient_id, meal, done_on)
);

-- ── 4. Obat ─────────────────────────────────────────────────────────────────

create table if not exists public.medications (
  id          uuid primary key default gen_random_uuid(),
  patient_id  uuid        not null references public.patients (id) on delete cascade,
  name        text        not null,
  dose        text        not null default '',
  rule        text        not null default '',
  times       text[]      not null default '{}',   -- e.g. {'08:00','20:00'}
  active      boolean     not null default true,
  created_at  timestamptz not null default now()
);

create table if not exists public.medication_logs (
  id             uuid primary key default gen_random_uuid(),
  medication_id  uuid        not null references public.medications (id) on delete cascade,
  patient_id     uuid        not null references public.patients (id) on delete cascade,
  scheduled_time text,                              -- which slot in `times` this covers
  taken_on       date        not null default (now() at time zone 'Asia/Jakarta')::date,
  logged_by      uuid        references public.profiles (id) on delete set null,
  logged_at      timestamptz not null default now(),
  constraint medication_logs_unique_per_slot unique (medication_id, scheduled_time, taken_on)
);

create index if not exists medications_patient_idx on public.medications (patient_id) where active;
create index if not exists medication_logs_patient_day_idx on public.medication_logs (patient_id, taken_on);

-- ── 5. RLS: satu pasangan policy per tabel, sama untuk semuanya ────────────

alter table public.daily_tasks       enable row level security;
alter table public.task_completions  enable row level security;
alter table public.health_readings   enable row level security;
alter table public.meal_logs         enable row level security;
alter table public.medications       enable row level security;
alter table public.medication_logs   enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array[
    'daily_tasks', 'task_completions', 'health_readings',
    'meal_logs', 'medications', 'medication_logs'
  ]
  loop
    execute format($f$
      drop policy if exists "%1$s: read own or cared-for" on public.%1$s;
      create policy "%1$s: read own or cared-for"
        on public.%1$s for select
        using ( public.is_my_patient(patient_id) or public.can_care_for(patient_id) );

      drop policy if exists "%1$s: write own or cared-for" on public.%1$s;
      create policy "%1$s: write own or cared-for"
        on public.%1$s for insert
        with check ( public.is_my_patient(patient_id) or public.can_care_for(patient_id) );

      drop policy if exists "%1$s: update own or cared-for" on public.%1$s;
      create policy "%1$s: update own or cared-for"
        on public.%1$s for update
        using      ( public.is_my_patient(patient_id) or public.can_care_for(patient_id) )
        with check ( public.is_my_patient(patient_id) or public.can_care_for(patient_id) );

      drop policy if exists "%1$s: delete own or cared-for" on public.%1$s;
      create policy "%1$s: delete own or cared-for"
        on public.%1$s for delete
        using ( public.is_my_patient(patient_id) or public.can_care_for(patient_id) );
    $f$, t);
  end loop;
end $$;

commit;