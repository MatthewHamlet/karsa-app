/* tampilan sementara waktu halaman lagi dimuat.
   dua gunanya:
   1. dulu klik Perawatan itu diem aja di Beranda sampai server selesai, jadi
      keliatan nge-hang dan orang klik lagi.
   2. lebih penting: Next cuma prefetch route dinamis kalau ada file loading.
      semua route di app ini dinamis (baca cookie sesi), jadi sebelum ada file
      ini gak ada link sidebar yang di-prefetch sama sekali.

   sengaja dibikin generik, biar gak jadi layout kedua yang harus diurus. */
function Block({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-karsa-line/45 motion-safe:animate-pulse ${className}`}
    />
  );
}

export default function PageSkeleton() {
  return (
    /* kotak-kotaknya aria-hidden (cuma hiasan), tapi tetap ada teks sr-only
       biar screen reader tau halamannya lagi dimuat, bukan kosong */
    <div className="w-full px-4 pb-10 pt-6 sm:px-6 md:px-8 md:pt-10 xl:px-12 xl:pt-12">
      <span className="sr-only" role="status" aria-live="polite">
        Memuat halaman…
      </span>

      <div aria-hidden className="mx-auto w-full max-w-[1680px]">
        <Block className="h-28 w-full rounded-3xl sm:h-32" />

        <div className="mt-6 grid gap-4 md:mt-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-8">
          <div className="min-w-0 space-y-4">
            <Block className="h-9 w-1/3 rounded-xl" />
            <Block className="h-[220px] w-full rounded-3xl" />
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <Block className="h-[176px] rounded-3xl" />
              <Block className="h-[176px] rounded-3xl" />
              <Block className="h-[176px] rounded-3xl" />
            </div>
          </div>

          <div className="hidden space-y-4 lg:block">
            <Block className="h-16 w-full rounded-2xl" />
            <Block className="h-[280px] w-full rounded-3xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
