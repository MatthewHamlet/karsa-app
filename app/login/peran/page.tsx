import type { Metadata } from "next";
import { redirect } from "next/navigation";
import ChooseRole from "../../section/ChooseRole";
import { getUser } from "../../lib/supabase/server";
import { isSupabaseConfigured } from "../../lib/supabase/config";
import { HOME_FOR, hasChosenRole, normaliseRole } from "../../lib/roles";

export const metadata: Metadata = {
  title: "Pilih peran · Karsa",
  description: "Kamu memakai Karsa sebagai pendamping atau sebagai pasien?",
};

export const dynamic = "force-dynamic";


export default async function Peran({ searchParams }: PageProps<"/login/peran">) {
  const rawNext = (await searchParams).next;
  const candidate = (Array.isArray(rawNext) ? rawNext[0] : rawNext) ?? "";

  const next = candidate.startsWith("/") && !candidate.startsWith("//") ? candidate : "";

  if (!isSupabaseConfigured()) return <ChooseRole next={next} />;

  const user = await getUser();
  if (!user) redirect("/login?next=/login/peran");


  const deliberate = (await searchParams).ganti === "1";
  if (!deliberate && hasChosenRole(user.user_metadata)) {
    redirect(HOME_FOR[normaliseRole(user.user_metadata?.role)]);
  }

  const name =
    (user.user_metadata?.full_name as string | undefined)?.trim().split(" ")[0] ||
    user.email?.split("@")[0];

  return <ChooseRole name={name} next={next} />;
}
