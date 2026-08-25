

export type PatientTask = {
  id: string;
  emoji: string;
  title: string;

  detail: string;

  points: number;
  done: boolean;
};

export const PATIENT = {
  name: "Pasien",
  greeting: "Pasien",
  initial: "P",
};


export const AFFIRMATION = {
  from: "Sinta",
  relation: "Cucu",
  text: "You matter. Semangat hari ini ya Oma! ❤️",
};


export const ENERGY_TARGET = 50;

export const PATIENT_TASKS: PatientTask[] = [
  {
    id: "t1",
    emoji: "💊",
    title: "Minum obat pagi",
    detail: "Metformin, setelah sarapan",
    points: 10,
    done: true,
  },
  {
    id: "t2",
    emoji: "🩺",
    title: "Cek tekanan darah",
    detail: "Duduk tenang dulu 5 menit",
    points: 5,
    done: true,
  },
  {
    id: "t3",
    emoji: "🥤",
    title: "Minum 8 gelas air",
    detail: "Baru 5 gelas hari ini",
    points: 5,
    done: false,
  },
  {
    id: "t4",
    emoji: "🚶",
    title: "Jalan sore di taman",
    detail: "15 menit saja cukup",
    points: 10,
    done: false,
  },
  {
    id: "t5",
    emoji: "🍚",
    title: "Sarapan",
    detail: "Bubur atau roti, jangan dilewat",
    points: 5,
    done: true,
  },
  {
    id: "t6",
    emoji: "🌙",
    title: "Obat malam",
    detail: "Amlodipine, setelah makan malam",
    points: 10,
    done: false,
  },
  {
    id: "t7",
    emoji: "🛏️",
    title: "Tidur lebih awal",
    detail: "Sebelum jam 10 malam",
    points: 5,
    done: false,
  },
];

