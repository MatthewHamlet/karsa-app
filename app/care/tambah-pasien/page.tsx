import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AddPatient from "../../section/AddPatient";
import { getSessionProfile } from "../../lib/profile";
import { isSupabaseConfigured } from "../../lib/supabase/config";

export const metadata: Metadata = {
  title: "Tambahkan pasien · Karsa",
  description: "Tambahkan orang yang kamu dampingi di Karsa.",
};

export const dynamic = "force-dynamic";

export default async function TambahPasien({
  searchParams,
}: PageProps<"/care/tambah-pasien">) {
  if (isSupabaseConfigured() && !(await getSessionProfile())) {
    redirect("/login?next=/care/tambah-pasien");
  }

  const mode = (await searchParams).mode;
  return <AddPatient initialMode={mode === "enter" ? "enter" : "share"} />;
}
