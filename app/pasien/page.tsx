import type { Metadata } from "next";
import Link from "next/link";
import PatientDesktopDashboard from "../components/PatientDesktopDashboard";
import { getPatientHome } from "../lib/care/queries";
import { getSessionProfile } from "../lib/profile";
import { isSupabaseConfigured } from "../lib/supabase/config";

export const metadata: Metadata = {
  title: "Karsa · Beranda Pasien",
  description:
    "Ruang Karsa untuk pasien: tugas harian, energi sehat, dan pesan dari pendamping.",
};

export const dynamic = "force-dynamic";

export default async function PatientHome() {
  if (!isSupabaseConfigured() || !(await getSessionProfile())) {
    return <PatientDesktopDashboard />;
  }

  const home = await getPatientHome();

  if (!home) return <NoRecord />;

  return <PatientDesktopDashboard home={home} />;
}

function NoRecord() {
  return (
    <div className="mx-auto w-full max-w-lg px-5 pb-28 pt-16 md:pb-10">
      <div className="rounded-3xl bg-white p-7 text-center ring-1 ring-karsa-line">
        <h1 className="text-[24px] font-bold tracking-tight text-neutral-900">
          Belum ada profil pasien
        </h1>
        <p className="mx-auto mt-3 max-w-[34ch] text-[16px] leading-6 text-neutral-500">
          Akun ini belum terhubung ke profil pasien mana pun. Minta pendampingmu
          membuatkannya, atau buka halaman pendamping untuk membagikan kodemu.
        </p>
        <Link
          href="/pasien/pendamping"
          className="mt-6 inline-flex h-13 items-center justify-center rounded-2xl bg-karsa px-6 py-3.5 text-[15px] font-bold text-white outline-none transition-colors duration-200 hover:bg-karsa-dark focus-visible:ring-2 focus-visible:ring-karsa focus-visible:ring-offset-2"
        >
          Buka pendamping saya
        </Link>
      </div>
    </div>
  );
}
