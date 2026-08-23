import { redirect } from "next/navigation";
import { HOME_FOR } from "../../lib/roles";

/** The path the smart-redirect brief names for caregivers.
 *
 *  A real route rather than a rewrite, so anything that has this URL written
 *  down — a bookmark, a link in a doc, an old build — still lands somewhere
 *  correct. The caregiver app itself lives at `/`; see `HOME_FOR`. */
export const dynamic = "force-dynamic";

export default function CaregiverDashboard() {
  redirect(HOME_FOR.caregiver);
}
