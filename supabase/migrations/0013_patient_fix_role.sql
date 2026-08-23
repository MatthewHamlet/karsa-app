-- Karsa · 0013 · patients tidak pernah ditandai 'patient' di profiles.role
--
-- Jalankan sekali, setelah 0012.
--
-- ── Bug yang diperbaiki ──────────────────────────────────────────────────
-- `redeem_pairing_code` (0008) membuat baris `patients` dan
-- `care_relationships` untuk siapa pun yang menukar kode undangan sebagai
-- pasien, tapi tidak pernah menulis `profiles.role = 'patient'`. Akun yang
-- rolenya masih default 'caregiver' (dari signup, atau dari Google yang
-- belum/tidak lewat /login/peran) tetap tercatat sebagai caregiver di
-- `profiles` walau sudah jadi pasien lewat pairing. Proxy lalu membaca
-- `profiles.role`, menganggap dia caregiver, mengecek `care_relationships`
-- sebagai caregiver (0 baris), dan melempar ke /mulai — layar "Tambahkan
-- pasien" yang salah tempat.
--
-- `ensure_my_patient_record` (0009) punya masalah yang sama persis: dipanggil
-- dari `chooseRole` setelah `profiles.role` sudah di-update di sana, jadi
-- kasusnya aman — tapi didefinisikan ulang di sini juga supaya konsisten dan
-- tidak bergantung urutan pemanggil.

begin;

-- ── 1. redeem_pairing_code: ikut menulis profiles.role ─────────────────────
create or replace function public.redeem_pairing_code(p_code text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  me         uuid := (select auth.uid());
  normalised text := upper(trim(p_code));
  recent     int;
  row_code   public.pairing_codes%rowtype;
  my_patient uuid;
  my_name    text;
  giver_name text;
begin
  if me is null then
    return jsonb_build_object('ok', false, 'reason', 'not_signed_in');
  end if;

  select count(*) into recent
  from public.pairing_attempts pa
  where pa.actor_id = me
    and pa.tried_at > now() - interval '1 hour'
    and not pa.ok;

  if recent >= 10 then
    return jsonb_build_object('ok', false, 'reason', 'rate_limited');
  end if;

  if normalised !~ '^KRS-' then
    normalised := 'KRS-' || normalised;
  end if;

  select * into row_code
  from public.pairing_codes pc
  where pc.code = normalised
  for update;

  if row_code.code is null
     or row_code.redeemed_at is not null
     or row_code.expires_at <= now() then
    insert into public.pairing_attempts (actor_id, ok) values (me, false);
    return jsonb_build_object('ok', false, 'reason', 'invalid');
  end if;

  if row_code.caregiver_id = me then
    insert into public.pairing_attempts (actor_id, ok) values (me, false);
    return jsonb_build_object('ok', false, 'reason', 'own_code');
  end if;

  select pt.id into my_patient
  from public.patients pt
  where pt.user_id = me;

  if my_patient is null then
    select coalesce(nullif(trim(pr.full_name), ''), 'Pasien') into my_name
    from public.profiles pr
    where pr.id = me;

    insert into public.patients (user_id, display_name, created_by, status)
    values (me, coalesce(my_name, 'Pasien'), me, 'active')
    returning id into my_patient;
  end if;

  insert into public.care_relationships
    (caregiver_id, patient_id, status, relation, invited_by, accepted_at)
  values
    (row_code.caregiver_id, my_patient, 'active', row_code.relation,
     row_code.caregiver_id, now())
  on conflict (caregiver_id, patient_id) do update
    set status      = 'active',
        accepted_at = now(),
        relation    = coalesce(public.care_relationships.relation, excluded.relation);

  update public.pairing_codes
  set redeemed_at = now(), redeemed_by = me, patient_id = my_patient
  where code = row_code.code;

  insert into public.pairing_attempts (actor_id, ok) values (me, true);

  -- ── Baris baru: menyamakan profiles.role dengan kenyataan.
  -- Menukar kode sebagai pasien *adalah* pernyataan "saya pasien" — jadi
  -- ditulis di sini, bukan cuma diharapkan sudah benar dari signup.
  update public.profiles
  set role = 'patient'
  where id = me
    and role is distinct from 'patient';

  select coalesce(nullif(trim(pr.full_name), ''), 'Pendamping') into giver_name
  from public.profiles pr
  where pr.id = row_code.caregiver_id;

  return jsonb_build_object('ok', true, 'caregiver_name', giver_name);
end;
$$;

-- ── 2. Backfill: akun yang sudah kadung salah ───────────────────────────────
-- Siapa pun yang punya baris `patients` sendiri (user_id = profil dia) adalah
-- pasien, titik — terlepas dari apa kata `profiles.role` sekarang.
update public.profiles pr
set role = 'patient'
where role is distinct from 'patient'
  and exists (
    select 1 from public.patients pt where pt.user_id = pr.id
  );

commit;