import Homepage from "./section/Home";
import { getMyPatients } from "./lib/care/queries";
import { getSessionProfile } from "./lib/profile";

/** Rendered per request: it reads the session, and a cached copy would show one
 *  caregiver's patient list to the next visitor. */
export const dynamic = "force-dynamic";

export default async function Home() {
  const me = await getSessionProfile();

  /* `undefined` while signed out, so the switcher falls back to the design
     placeholder. An empty array is a different answer — a real caregiver with
     nobody yet — and gets the "Belum ada pasien" screen instead. */
  const patients = me ? await getMyPatients() : undefined;

  return <Homepage patients={patients} />;
}
