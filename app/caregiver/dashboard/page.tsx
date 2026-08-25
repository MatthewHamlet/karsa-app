import { redirect } from "next/navigation";
import { HOME_FOR } from "../../lib/roles";

export const dynamic = "force-dynamic";

export default function CaregiverDashboard() {
  redirect(HOME_FOR.caregiver);
}
