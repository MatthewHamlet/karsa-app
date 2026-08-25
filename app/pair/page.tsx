import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import ConnectCaregiver from "../components/ConnectCaregiver";
import { getSessionProfile } from "../lib/profile";
import { isSupabaseConfigured } from "../lib/supabase/config";

export const metadata: Metadata = {
  title: "Hubungkan pendamping · Karsa",
  description: "Masukkan kode pendampingan untuk terhubung dengan keluargamu.",
};

export const dynamic = "force-dynamic";

export default async function Pair({ searchParams }: PageProps<"/pair">) {
  const raw = (await searchParams).code;
  const code = (Array.isArray(raw) ? raw[0] : raw) ?? "";

  if (isSupabaseConfigured() && !(await getSessionProfile())) {
    const next = `/pair${code ? `?code=${encodeURIComponent(code)}` : ""}`;
    redirect(`/login?next=${encodeURIComponent(next)}`);
  }

  return (
    <div className="mx-auto w-full max-w-lg px-5 pb-28 pt-10 md:pb-12">
      <Link
        href="/pasien"
        className="mb-6 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-[15px] font-bold text-neutral-700 outline-none ring-1 ring-karsa-line transition-colors duration-200 hover:bg-karsa-soft hover:text-karsa-dark focus-visible:ring-2 focus-visible:ring-karsa/40"
      >
        <ArrowLeft size={18} strokeWidth={2.4} aria-hidden />
        Kembali
      </Link>

      <ConnectCaregiver initialCode={code} autoFocus={!code} />
    </div>
  );
}
