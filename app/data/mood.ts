export type MoodKey = "great" | "good" | "okay" | "low" | "verylow";

export type Mood = {
  key: MoodKey;
  label: string;
  value: number;
  color: string;
  ink: string;
  soft: string;
};

export const MOODS: Mood[] = [
  { key: "great", label: "Senang sekali", value: 5, color: "#86ab6e", ink: "#3a5330", soft: "#eaf2e5" },
  { key: "good", label: "Senang", value: 4, color: "#f0b23f", ink: "#7a4f12", soft: "#fdf1d9" },
  { key: "okay", label: "Biasa saja", value: 3, color: "#b08b70", ink: "#4c3524", soft: "#f4ebe4" },
  { key: "low", label: "Kurang baik", value: 2, color: "#e8834a", ink: "#78380f", soft: "#fce7da" },
  { key: "verylow", label: "Sedih", value: 1, color: "#9a7fc0", ink: "#3f2d63", soft: "#eee9f7" },
];

export const MOOD_BY_KEY = Object.fromEntries(MOODS.map((m) => [m.key, m])) as Record<
  MoodKey,
  Mood
>;

export const MOOD_COUNTS: Record<MoodKey, number> = {
  good: 12,
  okay: 8,
  great: 6,
  low: 4,
  verylow: 2,
};

export const TOTAL_ENTRIES = Object.values(MOOD_COUNTS).reduce((a, b) => a + b, 0);

export const MOST_COMMON = (Object.entries(MOOD_COUNTS) as [MoodKey, number][]).reduce(
  (best, current) => (current[1] > best[1] ? current : best),
);

export type TrendPoint = { label: string; mood: MoodKey };

export const MOOD_TREND: TrendPoint[] = [
  { label: "21", mood: "okay" },
  { label: "22", mood: "low" },
  { label: "23", mood: "okay" },
  { label: "24", mood: "good" },
  { label: "25", mood: "good" },
  { label: "26", mood: "verylow" },
  { label: "27", mood: "low" },
  { label: "28", mood: "okay" },
  { label: "29", mood: "good" },
  { label: "30", mood: "great" },
  { label: "31", mood: "good" },
  { label: "1", mood: "okay" },
  { label: "2", mood: "good" },
  { label: "3", mood: "great" },
];

export type MoodEntry = {
  id: string;
  mood: MoodKey;
  when: string;
  note?: string;
};

export const MOOD_ENTRIES: MoodEntry[] = [
  {
    id: "e1",
    mood: "good",
    when: "Hari ini · 08:42",
    note: "Rasanya jauh lebih enak setelah jalan pagi di taman. Udaranya sejuk dan aku sempat mengobrol sebentar dengan tetangga sebelah. Sarapannya juga habis, tidak seperti kemarin.",
  },
  {
    id: "e2",
    mood: "great",
    when: "Kemarin · 19:10",
    note: "Truman datang membawa buah kesukaanku. Kami mengobrol lama sampai malam.",
  },
  {
    id: "e3",
    mood: "okay",
    when: "Kemarin · 09:05",
    note: "Tidurnya kurang nyenyak semalam, jadi paginya agak lemas. Tapi tidak apa-apa.",
  },
  {
    id: "e4",
    mood: "low",
    when: "2 Sep · 20:30",
    note: "Kaki terasa pegal seharian dan aku tidak sempat keluar rumah sama sekali.",
  },
  {
    id: "e5",
    mood: "good",
    when: "2 Sep · 08:15",
  },
];
