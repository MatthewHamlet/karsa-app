import type {
  CareGroupMember,
  CareMessage,
  CareNote,
  CarePatientActivityMap,
  FeedItem,
  MoodEntryRow,
} from "./queries";
import type { FixedStatKey, MonitorKey, Period, StatValue } from "./stats";
import type { CarePatient } from "./types";
import type { CalendarDay } from "./time";
import type { TrendPeriod, SerialDetail } from "./trends";

/** The view model the Perawatan page is rendered from.
 *
 *  One bundle rather than a dozen props threaded through three components. The
 *  shell in the middle reads almost none of these — it only hands them on — and
 *  naming each one separately would mean editing it every time a card
 *  underneath wants one more figure.
 *
 *  Types only. Every import above is `import type`, so nothing in this file
 *  survives compilation and a client component can read it without dragging
 *  `next/headers` into the browser bundle behind it. */
export type CareData = {
  /** Who is looking. The chat needs it to tell my own bubbles from everyone
   *  else's. */
  me: { id: string; name: string; initial: string };
  patients: CarePatient[];
  activePatientId: string;
  patientName: string;
  /** The relationship is still awaiting the patient's answer, so RLS refuses
   *  everything behind it and the page says so rather than showing blanks. */
  pending: boolean;
  today: CalendarDay;
  stats: Record<
    Period,
    {
      fixed: Record<FixedStatKey, StatValue>;
      monitor: Record<MonitorKey, StatValue>;
    }
  >;
  /** Real per-day detail behind the weekly and monthly cards — the charts and
   *  the compliance heatmap. Empty per metric when nothing was recorded. */
  trends: Record<TrendPeriod, Record<string, SerialDetail>>;
  monthShort: string;
  feed: FeedItem[];
  activitiesByDate: CarePatientActivityMap;
  notes: CareNote[];
  messages: CareMessage[];
  group: { members: CareGroupMember[]; since: string | null };
  moods: MoodEntryRow[];
};
