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

/** Shown once, to accounts that never answered the question.
 *
 *  Lives under `/login` so the proxy already treats it as public and the rail
 *  already knows not to wrap it — both of those are keyed on the whole subtree.
 *  It is not really public: without a session there is nobody to set a role
 *  for, so it sends you to sign in.
 *
 *  Guards in both directions. Somebody who has already chosen is sent on rather
 *  than asked again, which is what stops a bookmarked link from being a way to
 *  silently flip your own role. */
export default async function Peran({ searchParams }: PageProps<"/login/peran">) {
  const rawNext = (await searchParams).next;
  const candidate = (Array.isArray(rawNext) ? rawNext[0] : rawNext) ?? "";
  /* Same-site only. This ends up in a redirect, and an arbitrary URL here would
     turn the role screen into a phishing hop. */
  const next = candidate.startsWith("/") && !candidate.startsWith("//") ? candidate : "";

  if (!isSupabaseConfigured()) return <ChooseRole next={next} />;

  const user = await getUser();
  if (!user) redirect("/login?next=/login/peran");

  /* Already answered, so this is a stale bookmark or a back-button — send them
     on rather than asking twice.
     `?ganti=1` is the deliberate exception: it is how somebody who picked wrong
     gets to change it. Nothing links to it yet, which is why the screen itself
     does not advertise a way back. */
  const deliberate = (await searchParams).ganti === "1";
  if (!deliberate && hasChosenRole(user.user_metadata)) {
    redirect(HOME_FOR[normaliseRole(user.user_metadata?.role)]);
  }

  const name =
    (user.user_metadata?.full_name as string | undefined)?.trim().split(" ")[0] ||
    user.email?.split("@")[0];

  return <ChooseRole name={name} next={next} />;
}
