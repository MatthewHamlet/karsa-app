import { redirect } from "next/navigation";
import Homepage from "./section/Home";
import {
  getActivityFeed,
  getMoodLog,
  getMyPatients,
  getScheduleByDay,
  getTodayTasks,
} from "./lib/care/queries";
import { getDaySummary } from "./lib/care/stats";
import { getSessionProfile } from "./lib/profile";
import { jakartaToday } from "./lib/care/time";

/** Rendered per request: it reads the session, and a cached copy would show one
 *  caregiver's patient list to the next visitor. */
export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: PageProps<"/">) {
  const me = await getSessionProfile();
  const today = jakartaToday();

  /* Signed out — or working on the design without credentials. `undefined`
     rather than an empty array, which is the difference the components read:
     an empty array is a real caregiver with nobody yet, and gets the screen
     below instead of the placeholder rows. */
  if (!me) return <Homepage today={today} />;

  const patients = await getMyPatients();

  /* Everything past here divides by a patient, so with nobody to divide by
     there is no dashboard to render. The proxy already turns this case away
     before the page runs; this is the second lock on the same door, for the
     case where the token's role metadata is missing and the proxy let it
     through. See `ONBOARDING_ALLOWED` in `proxy.ts`. */
  if (patients.length === 0) redirect("/mulai");

  /* Which patient the page is about. In the URL rather than in component state,
     because the data behind the switcher is fetched on the server: a selection
     the server cannot see would change the name at the top and nothing else. */
  const requested = first((await searchParams).p);
  const active =
    patients.find((p) => p.patientId === requested) ??
    /* Prefer somebody whose invitation has been accepted. A pending
       relationship is in the list on purpose, but it carries no access, so
       landing on one by default would show a full dashboard of empty cards. */
    patients.find((p) => p.status === "active") ??
    patients[0];

  const patientId = active.patientId;

  const [tasks, feed, schedule, moods, summary] = await Promise.all([
    getTodayTasks(patientId),
    getActivityFeed(patientId),
    getScheduleByDay(patientId, today),
    getMoodLog(patientId, 14),
    getDaySummary(patientId),
  ]);

  return (
    <Homepage
      /* Remounts when the switcher changes patient. The dashboard keeps which
         tasks have been ticked in local state so a row can strike through
         before the write lands — without this key that state survives the
         switch, and the next patient's list opens with somebody else's tasks
         already crossed off. */
      key={patientId}
      greeting={me.fullName.split(" ")[0]}
      patients={patients}
      activePatientId={patientId}
      pending={active.status !== "active"}
      today={today}
      tasks={tasks}
      feed={feed}
      schedule={schedule}
      moods={moods}
      summary={summary}
    />
  );
}

const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;
