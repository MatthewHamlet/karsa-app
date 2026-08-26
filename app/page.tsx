import { redirect } from "next/navigation";
import Homepage from "./section/Home";
import {
  getActivityFeed,
  getCareGroup,
  getMoodLog,
  getMyPatients,
  getScheduleByDay,
  getTodayTasks,
} from "./lib/care/queries";
import { getDaySummary } from "./lib/care/stats";
import { getSessionProfile } from "./lib/profile";
import { jakartaToday } from "./lib/care/time";
import { HOME_FOR } from "./lib/roles";


export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: PageProps<"/">) {
  const me = await getSessionProfile();
  const today = jakartaToday();


  if (!me) return <Homepage today={today} />;

  /* pasien yang buka home pendamping dilempar ke halaman dia sendiri.
     getMyPatients() itu "siapa yang aku rawat" — buat pasien hasilnya kosong,
     sama kayak pendamping baru. jadi cek di bawah salah baca dan ngirim pasien
     ke /mulai (halaman "tambahkan pasien"). */
  if (me.role === "patient") redirect(HOME_FOR.patient);

  const patients = await getMyPatients();


  if (patients.length === 0) redirect("/mulai");


  const requested = first((await searchParams).p);
  const active =
    patients.find((p) => p.patientId === requested) ??

    patients.find((p) => p.status === "active") ??
    patients[0];

  const patientId = active.patientId;

  const [tasks, feed, schedule, moods, summary, group] = await Promise.all([
    getTodayTasks(patientId),
    getActivityFeed(patientId, 5),
    getScheduleByDay(patientId, today),
    getMoodLog(patientId, 14),
    getDaySummary(patientId),

    getCareGroup(patientId),
  ]);

  return (
    <Homepage

      key={patientId}
      greeting={me.fullName.split(" ")[0]}
      patients={patients}
      activePatientId={patientId}
      pending={active.status !== "active"}
      today={today}
      tasks={tasks}
      members={group.members}
      meId={me.id}
      feed={feed}
      schedule={schedule}
      moods={moods}
      summary={summary}
    />
  );
}

const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;
