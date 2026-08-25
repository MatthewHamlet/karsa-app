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


export type CareData = {

  me: { id: string; name: string; initial: string };
  patients: CarePatient[];
  activePatientId: string;
  patientName: string;

  pending: boolean;
  today: CalendarDay;
  stats: Record<
    Period,
    {
      fixed: Record<FixedStatKey, StatValue>;
      monitor: Record<MonitorKey, StatValue>;
    }
  >;

  trends: Record<TrendPeriod, Record<string, SerialDetail>>;
  monthShort: string;
  feed: FeedItem[];
  activitiesByDate: CarePatientActivityMap;
  notes: CareNote[];
  messages: CareMessage[];
  group: { members: CareGroupMember[]; since: string | null };
  moods: MoodEntryRow[];
};
