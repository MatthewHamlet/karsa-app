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
import { getTrendDetail, monthShortOf } from "../lib/care/trends";
import { jakartaToday } from "../lib/care/time";
import { HOME_FOR } from "../lib/roles";
import type { CareData } from "../lib/care/view";

export const metadata: Metadata = {
  title: "Perawatan · Karsa",
  description: "Profil perawatan pasien: statistik, aktivitas, dan obrolan tim.",
};


export const dynamic = "force-dynamic";

const PERIODS: Period[] = ["daily", "weekly", "monthly"];

const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export default async function Care({ searchParams }: PageProps<"/care">) {
  const params = await searchParams;
  const me = await getSessionProfile();


  if (!me) return <CarePage params={params} />;

  /* jebakan yang sama kayak di home: getMyPatients() kosong juga buat pasien,
     jadi tanpa ini pasien yang buka Perawatan dilempar ke /mulai */
  if (me.role === "patient") redirect(HOME_FOR.patient);

  const patients = await getMyPatients();
  if (patients.length === 0) redirect("/mulai");

  const active =
    patients.find((p) => p.patientId === first(params.p)) ??
    patients.find((p) => p.status === "active") ??
    patients[0];

  const patientId = active.patientId;
  const today = jakartaToday();


  const [fixed, monitor, weekly, monthly, patient, feed, byDate, notes, messages, group, moods] =
    await Promise.all([
      Promise.all(PERIODS.map((p) => getFixedStats(patientId, p))),
      Promise.all(PERIODS.map((p) => getMonitorStats(patientId, p))),
      getTrendDetail(patientId, "weekly"),
      getTrendDetail(patientId, "monthly"),
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
        trends: { weekly, monthly },
        monthShort: monthShortOf(),
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
