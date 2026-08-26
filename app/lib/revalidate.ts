import { revalidatePath } from "next/cache";

/* dulu semua action manggil revalidatePath("/", "layout") = "semua halaman
   berubah". akibatnya cache browser dibuang terus, jadi centang satu tugas
   bikin Komunitas ikut dimuat ulang padahal gak ada hubungannya.
   helper di bawah cuma nyebut halaman yang beneran kena.
   kalau ragu, mending kelebihan: layar basi itu bug, refetch ekstra cuma lambat. */

/** halaman yang nampilin data harian pasien */
export function revalidateCare(): void {
  revalidatePath("/", "page");
  // "layout" biar anak-anaknya ikut, termasuk /pasien/[section]
  revalidatePath("/care", "layout");
  revalidatePath("/pasien", "layout");
  revalidatePath("/patient/home");
  revalidatePath("/caregiver/dashboard");
}

/** data pasien + halaman yang nampilin siapa merawat siapa */
export function revalidateRelationships(): void {
  revalidateCare();
  revalidatePath("/settings", "layout");
  revalidatePath("/mulai");
  revalidatePath("/pair");
}

/** nama/foto/peran sendiri. layout-wide karena sidebar ada di semua halaman,
 *  dan ini jarang dipakai jadi mahalnya gak kerasa */
export function revalidateAccount(): void {
  revalidatePath("/", "layout");
}

/** cuma 2 halaman yang nampilin catatan & obrolan tim.
 *  sengaja sempit: kirim pesan paling sering dipakai, dan gak ngubah Beranda */
export function revalidateCareTalk(): void {
  revalidatePath("/care");
  revalidatePath("/pasien/pendamping");
}

/** scan resep juga nulis ke tabel medications, jadi angka dosis di halaman
 *  perawatan ikut berubah */
export function revalidatePrescriptions(): void {
  revalidateCare();
  revalidatePath("/scan");
  revalidatePath("/pasien/scan");
}
