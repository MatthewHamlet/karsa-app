import { redirect } from "next/navigation";
import { HOME_FOR } from "../../lib/roles";

/** The path the smart-redirect brief names for patients.
 *
 *  The patient app is the whole `/pasien` subtree — journal, mascot, community,
 *  care team — so this is an entrance to it rather than a rename of it. */
export const dynamic = "force-dynamic";

export default function PatientHome() {
  redirect(HOME_FOR.patient);
}
