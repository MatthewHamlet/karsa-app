-- Karsa · 0014 · profil orang lain tidak pernah bisa dibaca
--
-- Jalankan sekali, setelah 0013.
--
-- ── Bug yang diperbaiki ──────────────────────────────────────────────────
-- `profiles` cuma punya satu policy SELECT sejak 0001, dan isinya "baca
-- punyamu sendiri":
--
--     using ( (select auth.uid()) = id )
--
-- Tidak ada satu pun migration setelahnya yang menambah izin baca profil
-- orang lain. Padahal hampir semua fitur sosial di app ini perlu itu.
--
-- Yang paling kelihatan: `getMyCareTeam()` mengambil relasi lewat embed
-- `caregiver:profiles!care_relationships_caregiver_id_fkey(...)`. Baris
-- `care_relationships`-nya lolos RLS (pasien boleh baca sisinya sendiri),
-- tapi join ke `profiles` diblokir — jadi PostgREST mengembalikan relasi
-- dengan `caregiver: null`, lalu `if (!c) return []` di kode membuang
-- barisnya diam-diam. Hasilnya: pasien melihat "belum ada pendamping"
-- padahal relasinya ada dan aktif di database.
--
-- Efek yang sama, lebih halus, kena juga di `getCareGroup` (anggota tim
-- hilang), `namesFor` (activity feed & obrolan jadi "Seseorang"/"Sistem"),
-- dan `peopleFor` (penulis postingan jadi "Pengguna Karsa"). Di sana ada
-- fallback nama generik, jadi kelihatan "jalan" walau nama aslinya tidak
-- pernah terbaca.
--
-- ── Kenapa izinnya dibuka ke semua yang login ────────────────────────────
-- Bisa saja dibikin sempit — "cuma yang satu tim perawatan" — tapi Komunitas
-- memang butuh baca profil orang asing: penulis postingan, dan daftar "Orang
-- untuk Diikuti". `community_posts` sendiri sudah `to authenticated using
-- (true)` sejak 0010. Policy sempit di `profiles` cuma akan jadi kode mati di
-- sebelah kebutuhan yang lebih luas itu.
--
-- `to authenticated`, bukan `using (true)` — bedanya `anon`, kunci yang ikut
-- terkirim ke setiap browser. Tanpa akun, daftar pengguna tetap tertutup.
--
-- ── Yang TIDAK ikut terbuka ─────────────────────────────────────────────
-- Tabel ini isinya nama, peran, headline, avatar. Tidak ada email (itu di
-- `auth.users`, yang tidak pernah terekspos ke API), tidak ada nomor telepon,
-- dan tidak ada satu pun data perawatan. Semua yang sensitif — tugas, obat,
-- catatan kesehatan, mood — tetap dijaga `is_my_patient` / `can_care_for`
-- dan tidak tersentuh migration ini.
--
-- Catatan jujur: kolom `role` ikut terbaca, jadi sesama pengguna yang login
-- bisa tahu siapa yang terdaftar sebagai pasien. Kalau nanti itu dianggap
-- terlalu terbuka, cara mempersempitnya tanpa merusak Komunitas adalah bikin
-- view `public_profiles` (id, full_name, headline, verified, avatar_url) lalu
-- arahkan query komunitas ke sana — bukan mencabut policy ini.

begin;

drop policy if exists "profiles: read signed in" on public.profiles;
create policy "profiles: read signed in"
  on public.profiles for select
  to authenticated
  using ( true );

/* Policy lama dari 0001 dibiarkan. Policy RLS itu OR, jadi keberadaannya tidak
   mempersempit apa pun — dan menghapusnya cuma bikin diff yang tidak perlu. */

commit;
