

export type Period = "daily" | "weekly" | "monthly";


const pct = (current: number, target: number) => Math.round((current / target) * 100);

export const PERIODS: { key: Period; label: string }[] = [
  { key: "daily", label: "Harian" },
  { key: "weekly", label: "Mingguan" },
  { key: "monthly", label: "Bulanan" },
];


export type StatTone = { bg: string; edge: string; tile: string; ink: string };



export const CARE_GROUP = {
  name: "Pendamping Meimei",
  createdAt: "Dibuat 8 Des 2025",
  members: [
    { id: "sinta", name: "Sinta", initial: "S", color: "#56785d" },
    { id: "matthew", name: "Matthew", initial: "M", color: "#8a76bd" },
    { id: "truman", name: "Truman", initial: "T", color: "#c98a4a" },
  ],
};



export type FixedStatKey = "fluid" | "meals" | "medication" | "mood" | "sleep";

export type MealState = { label: string; done: boolean };


export type StatValue = {

  value: string;

  caption: string;

  progress?: number;

  meals?: MealState[];
};

export const FIXED_TONES: Record<FixedStatKey, StatTone> = {
  fluid: { bg: "#e9f1f9", edge: "#d2e2f0", tile: "#d5e5f4", ink: "#3f6a95" },
  meals: { bg: "#fdf2e7", edge: "#f4dfc8", tile: "#f9e2cb", ink: "#b06c34" },
  medication: { bg: "#f3f0fb", edge: "#e2dbf3", tile: "#e6e0f7", ink: "#6a58ae" },
  mood: { bg: "#fdf6e4", edge: "#f3e5c2", tile: "#f8ead0", ink: "#96762a" },
  sleep: { bg: "#ecedf8", edge: "#d8daef", tile: "#dcdef4", ink: "#4a4f8f" },
};

export const FIXED_STATS: Record<
  FixedStatKey,
  { title: string; byPeriod: Record<Period, StatValue> }
> = {
  fluid: {
    title: "Cairan",
    byPeriod: {
      daily: { value: "1.500 ml", caption: "dari 3.000 ml", progress: pct(1500, 3000) },
      weekly: { value: "16,4 L", caption: "dari 21 L", progress: pct(16.4, 21) },
      monthly: { value: "68 L", caption: "dari 90 L", progress: pct(68, 90) },
    },
  },
  meals: {
    title: "Makan",
    byPeriod: {
      daily: {
        value: "1 dari 3",
        caption: "makan hari ini",
        meals: [
          { label: "Sarapan", done: true },
          { label: "Makan siang", done: false },
          { label: "Makan malam", done: false },
        ],
      },
      weekly: { value: "18 dari 21", caption: "makan minggu ini", progress: pct(18, 21) },
      monthly: { value: "79 dari 90", caption: "makan bulan ini", progress: pct(79, 90) },
    },
  },
  medication: {
    title: "Obat",
    byPeriod: {
      daily: { value: "2 dari 3", caption: "dosis hari ini", progress: pct(2, 3) },
      weekly: { value: "19 dari 21", caption: "dosis minggu ini", progress: pct(19, 21) },
      monthly: { value: "84 dari 90", caption: "dosis bulan ini", progress: pct(84, 90) },
    },
  },
  mood: {
    title: "Perasaan",
    byPeriod: {
      daily: { value: "Senang", caption: "“Aku suka matahari sore hari ini”" },
      weekly: { value: "Senang", caption: "paling sering minggu ini" },
      monthly: { value: "Senang", caption: "paling sering bulan ini" },
    },
  },
  sleep: {
    title: "Tidur",
    byPeriod: {
      daily: { value: "7 jam 20 mnt", caption: "semalam" },
      weekly: { value: "7 jam 05 mnt", caption: "rata-rata per malam" },
      monthly: { value: "6 jam 52 mnt", caption: "rata-rata per malam" },
    },
  },
};



export type MonitorKey =
  | "bloodPressure"
  | "bloodSugar"
  | "oxygen"
  | "heartRate"
  | "temperature"
  | "weight";

export type MonitorStat = {
  key: MonitorKey;
  title: string;
  description: string;
  tone: StatTone;
  byPeriod: Record<Period, StatValue>;
};

export const MONITOR_STATS: MonitorStat[] = [
  {
    key: "bloodPressure",
    title: "Tekanan darah",
    description: "Sistolik dan diastolik, dicatat manual",
    tone: { bg: "#fdeef1", edge: "#f5d8de", tile: "#f9dde3", ink: "#a4495c" },
    byPeriod: {
      daily: { value: "128/82", caption: "mmHg · 06:05" },
      weekly: { value: "126/80", caption: "rata-rata mmHg" },
      monthly: { value: "129/83", caption: "rata-rata mmHg" },
    },
  },
  {
    key: "bloodSugar",
    title: "Gula darah",
    description: "Kadar glukosa sebelum makan",
    tone: { bg: "#fdf6e3", edge: "#f2e4c1", tile: "#f8ebcb", ink: "#96762a" },
    byPeriod: {
      daily: { value: "110", caption: "mg/dL · sebelum sarapan" },
      weekly: { value: "114", caption: "rata-rata mg/dL" },
      monthly: { value: "117", caption: "rata-rata mg/dL" },
    },
  },
  {
    key: "oxygen",
    title: "Saturasi oksigen",
    description: "SpO₂ dari oksimeter jari",
    tone: { bg: "#e8f5f2", edge: "#cee7e1", tile: "#d6ebe5", ink: "#3d7a6d" },
    byPeriod: {
      daily: { value: "98%", caption: "SpO₂ · 06:10" },
      weekly: { value: "97%", caption: "rata-rata SpO₂" },
      monthly: { value: "97%", caption: "rata-rata SpO₂" },
    },
  },
  {
    key: "heartRate",
    title: "Detak jantung",
    description: "Denyut per menit saat istirahat",
    tone: { bg: "#fdeeec", edge: "#f6d8d3", tile: "#fadfd9", ink: "#a8503f" },
    byPeriod: {
      daily: { value: "72 bpm", caption: "saat istirahat" },
      weekly: { value: "74 bpm", caption: "rata-rata" },
      monthly: { value: "73 bpm", caption: "rata-rata" },
    },
  },
  {
    key: "temperature",
    title: "Suhu tubuh",
    description: "Diukur di dahi atau ketiak",
    tone: { bg: "#fdf1e8", edge: "#f5dbc8", tile: "#f9e2d0", ink: "#a5623a" },
    byPeriod: {
      daily: { value: "36,6 °C", caption: "pagi ini" },
      weekly: { value: "36,7 °C", caption: "rata-rata" },
      monthly: { value: "36,6 °C", caption: "rata-rata" },
    },
  },
  {
    key: "weight",
    title: "Berat badan",
    description: "Ditimbang setiap pagi",
    tone: { bg: "#eef5ef", edge: "#dae8db", tile: "#e0ece1", ink: "#45734e" },
    byPeriod: {
      daily: { value: "54,2 kg", caption: "pagi ini" },
      weekly: { value: "54,0 kg", caption: "rata-rata" },
      monthly: { value: "53,8 kg", caption: "rata-rata" },
    },
  },
];



export type ActivityIcon = "medication" | "meal" | "fluid" | "sleep" | "vital";

export type PatientActivity = {
  id: string;
  icon: ActivityIcon;
  text: string;
  time: string;
};


export const ACTIVITIES_BY_DATE: Record<string, PatientActivity[]> = {
  "2025-8-9": [
    { id: "a1", icon: "medication", text: "Meimei minum 500 mg Metformin", time: "06:40" },
    { id: "a2", icon: "meal", text: "Meimei sarapan bubur ayam", time: "06:20" },
    { id: "a3", icon: "fluid", text: "Meimei minum 250 ml air", time: "05:50" },
    { id: "a4", icon: "sleep", text: "Meimei bangun tidur", time: "05:30" },
  ],
  "2025-8-8": [
    { id: "b1", icon: "meal", text: "Meimei makan malam", time: "19:10" },
    { id: "b2", icon: "vital", text: "Tekanan darah tercatat 128/82", time: "18:40" },
    { id: "b3", icon: "meal", text: "Meimei makan siang", time: "12:30" },
    { id: "b4", icon: "medication", text: "Meimei minum vitamin D3", time: "07:10" },
  ],
  "2025-8-5": [
    { id: "c1", icon: "fluid", text: "Meimei minum 300 ml air", time: "16:00" },
    { id: "c2", icon: "meal", text: "Meimei makan siang", time: "12:15" },
  ],
  "2025-8-2": [
    { id: "d1", icon: "sleep", text: "Meimei tidur siang 30 menit", time: "13:00" },
    { id: "d2", icon: "medication", text: "Meimei minum Amlodipine", time: "19:20" },
  ],
};


export const ACTIVITY_MONTH = { y: 2025, m: 8 };
export const ACTIVITY_TODAY = { y: 2025, m: 8, d: 9 };


export const RECENT_ACTIVITIES: PatientActivity[] = ACTIVITIES_BY_DATE["2025-8-9"];



export const IMPORTANT_INFO: string[] = [
  "Obat diminum setelah makan, jangan saat perut kosong.",
  "Hindari aktivitas berat setelah pukul 18:00.",
  "Hubungi tim perawatan bila ada kondisi tidak biasa.",
  "Pastikan Meimei minum air setiap dua jam sekali.",
];

export type InfoChange = { id: string; date: string; text: string; by: string };

export const INFO_HISTORY: InfoChange[] = [
  { id: "h1", date: "14 Agu", text: "Instruksi obat diperbarui", by: "Sinta" },
  { id: "h2", date: "12 Agu", text: "Preferensi makan ditambahkan", by: "Matthew" },
  { id: "h3", date: "08 Agu", text: "Anjuran aktivitas diubah", by: "Sinta" },
  { id: "h4", date: "02 Agu", text: "Rutinitas istirahat disesuaikan", by: "Sinta" },
  { id: "h5", date: "27 Jul", text: "Catatan cairan ditambahkan", by: "Truman" },
  { id: "h6", date: "19 Jul", text: "Profil perawatan dibuat", by: "Sinta" },
];
