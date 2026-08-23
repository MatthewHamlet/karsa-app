import type { Metadata } from "next";
import { redirect } from "next/navigation";
import CarePage from "../section/Care";
import { getSessionProfile } from "../lib/profile";
import {
  getActivitiesByDate,
  getActivityFeed,
  getCareGroup,
  getCareMessages,
  getCareNotes,
  getMoodLog,
  getMyPatients,
  getPatientDetail,
} from "../lib/care/queries";
import { getFixedStats, getMonitorStats, type Period } from "../lib/care/stats";
import { jakartaToday } from "../lib/care/time";
import type { CareData } from "../lib/care/view";

export const metadata: Metadata = {
  title: "Perawatan · Karsa",
  description: "Profil perawatan pasien: statistik, aktivitas, dan obrolan tim.",
};

/** Reads the session on every request, so it must not be cached — the same URL
 *  answers differently for two caregivers. */
export const dynamic = "force-dynamic";

const PERIODS: Period[] = ["daily", "weekly", "monthly"];

const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export default async function Care({ searchParams }: PageProps<"/care">) {
  const params = await searchParams;
  const me = await getSessionProfile();

  /* Signed out, or no keys configured: the page renders from the placeholder
     data so the design is still workable. */
  if (!me) return <CarePage params={params} />;

  const patients = await getMyPatients();
  if (patients.length === 0) redirect("/mulai");

  const active =
    patients.find((p) => p.patientId === first(params.p)) ??
    patients.find((p) => p.status === "active") ??
    patients[0];

  const patientId = active.patientId;
  const today = jakartaToday();

  /* All three periods are fetched, not just the one showing. The period switch
     is a client-side control with its own animation — going back to the server
     for each press would put a network round trip inside a 200ms transition,
     and the whole set is one indexed scan per period. */
  const [fixed, monitor, patient, feed, byDate, notes, messages, group, moods] =
    await Promise.all([
      Promise.all(PERIODS.map((p) => getFixedStats(patientId, p))),
      Promise.all(PERIODS.map((p) => getMonitorStats(patientId, p))),
      getPatientDetail(patientId),
      getActivityFeed(patientId, 6),
      getActivitiesByDate(patientId, today),
      getCareNotes(patientId),
      getCareMessages(patientId),
      getCareGroup(patientId),
      getMoodLog(patientId, 31),
    ]);

  const byPeriod = Object.fromEntries(
    PERIODS.map((p, i) => [p, { fixed: fixed[i], monitor: monitor[i] }]),
  ) as CareData["stats"];

  return (
    <CarePage
      params={params}
      data={{
        me: { id: me.id, name: me.fullName, initial: me.initial },
        patients,
        activePatientId: patientId,
        patientName: patient?.displayName ?? active.displayName,
        pending: active.status !== "active",
        today,
        stats: byPeriod,
        feed,
        activitiesByDate: byDate,
        notes,
        messages,
        group,
        moods,
      }}
    />
  );
}
