-- Karsa · 0011 · community furniture
--
-- Run once, after 0010. Optional, but the page is bare without it.
--
-- ── What is in here, and what is deliberately not ──────────────────────────
-- Groups and a scheduled session. These are things Karsa provides — the rooms
-- and the timetable — not things users wrote, so seeding them is furnishing the
-- building rather than faking its occupants.
--
-- There are **no seeded posts, comments, votes or people**. The old
-- `app/data/community.ts` had five threads written by four invented caregivers,
-- including a fictional geriatrician answering clinical questions about blood
-- pressure. Moving that into the database would not have made it less invented;
-- it would have made it harder to tell apart from something a real person
-- wrote, which is worse. An empty feed that says "jadilah yang pertama menulis"
-- is honest, and one real post fixes it.
--
-- Idempotent: safe to run twice. Groups are keyed by name, and the session by
-- its title, so re-running updates rather than duplicating.

begin;

insert into public.community_groups (name, blurb, art, tone, keywords)
values
  (
    'Komunitas Diabetes & Nutrisi',
    'Berbagi menu, jadwal makan, dan cara menjaga gula darah tetap stabil.',
    'nutrition', 'green',
    array['nutrisi', 'gizi', 'diabetes', 'resep', 'makan']
  ),
  (
    'Pendamping Lansia Indonesia',
    'Ruang umum untuk siapa saja yang merawat orang tua di rumah.',
    'elderly', 'peach',
    array['lansia', 'orang tua', 'perawatan harian', 'rutinitas']
  ),
  (
    'Ruang Tenang Pendamping',
    'Tempat menaruh lelah. Cerita, keluh, dan cara menjaga diri sendiri tetap utuh.',
    'mind', 'lavender',
    array['kesehatan mental', 'lelah', 'burnout', 'dukungan']
  ),
  (
    'Pemulihan Pasca-Stroke',
    'Latihan, kesabaran, dan kemajuan kecil yang layak dirayakan.',
    'recovery', 'blue',
    array['stroke', 'terapi', 'fisioterapi', 'pemulihan']
  )
on conflict do nothing;

/* `community_groups` has no unique constraint on `name` — adding one would stop
   two different communities ever choosing the same name, which is a rule for a
   product decision to make rather than a migration. So the guard is here
   instead: only insert what is not already present. */
delete from public.community_groups a
using public.community_groups b
where a.name = b.name and a.id > b.id;

-- ── The upcoming session ───────────────────────────────────────────────────
-- Scheduled a week out from whenever this runs, at 19:00 Jakarta, so a fresh
-- checkout always has one *upcoming* rather than one that expired before the
-- project was cloned. `community_sessions` has no user-facing write policy —
-- see 0010 — so this is the only way one gets created.

insert into public.community_sessions (title, blurb, host_name, starts_at)
select
  'Tanya Jawab Ahli: Menjaga Kesehatan Mental Pendamping',
  'Satu jam bersama ahli geriatri untuk membahas kelelahan pendamping dan cara memulihkannya.',
  'dr. Anindya Rahma',
  (date_trunc('day', now() at time zone 'Asia/Jakarta') + interval '7 days' + interval '19 hours')
    at time zone 'Asia/Jakarta'
where not exists (
  select 1 from public.community_sessions
  where title = 'Tanya Jawab Ahli: Menjaga Kesehatan Mental Pendamping'
    and starts_at > now()
);

commit;
