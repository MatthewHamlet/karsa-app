import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Karsa · Pasien",
};

const TITLES: Record<string, string> = {
  jurnal: "Jurnal",
  komunitas: "Komunitas",
  maskot: "Maskot",
  profil: "Profil",
  pengaturan: "Pengaturan",
};

/** Everywhere the patient's bottom bar can go that is not Home yet.
 *
 *  One route rather than four files of filler, and it says plainly that the
 *  screen is unbuilt. The alternative was a bar whose tabs 404, which teaches
 *  the person that pressing things breaks the app — the worst lesson this
 *  particular audience could take from it. */
export default async function PatientSection({ params }: PageProps<"/pasien/[section]">) {
  const { section } = await params;
  const title = TITLES[section] ?? "Halaman";

  return (
    <div className="mx-auto w-full max-w-lg px-5 pb-28 pt-10 md:pb-10">
      <Link
        href="/pasien"
        className="mb-6 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-[15px] font-bold text-neutral-700 outline-none ring-1 ring-karsa-line transition-colors duration-200 hover:bg-karsa-soft hover:text-karsa-dark focus-visible:ring-2 focus-visible:ring-karsa/40"
      >
        <ArrowLeft size={18} strokeWidth={2.4} aria-hidden />
        Kembali
      </Link>

      <div className="rounded-3xl bg-white p-7 text-center ring-1 ring-karsa-line">
        <h1 className="text-[24px] font-bold tracking-tight text-neutral-900">{title}</h1>
        <p className="mx-auto mt-3 max-w-[32ch] text-[16px] leading-6 text-neutral-500">
          Halaman ini sedang disiapkan. Untuk sekarang, semua yang kamu butuhkan
          ada di Beranda.
        </p>
      </div>
    </div>
  );
}
