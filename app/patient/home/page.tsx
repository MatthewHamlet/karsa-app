import { redirect } from "next/navigation";
import { HOME_FOR } from "../../lib/roles";

export const dynamic = "force-dynamic";

export default function PatientHome() {
  redirect(HOME_FOR.patient);
}
