/** The patient's own day, as the patient sees it.
 *
 *  Deliberately separate from `dashboard.ts`. That file is the caregiver's view
 *  of the same person — targets, compliance percentages, things to check up on.
 *  This one is the person themselves: a handful of things to do, what each is
 *  worth, and one message from someone who cares. The two will disagree over
 *  time and that is correct; they are answering different questions.
 *
 *  Placeholders throughout — this is a design pass, not a data layer. */

export type PatientTask = {
  id: string;
  emoji: string;
  title: string;
  /** When, or where — the one line that removes the "wait, which one?" */
  detail: string;
  /** Energy the task is worth. Small numbers, so the bar moves visibly. */
  points: number;
  done: boolean;
};

export const PATIENT = {
  name: "Meimei",
  /** How the app addresses them. Warmer than a name on its own, and what a
   *  grandchild would actually say. */
  greeting: "Oma Meimei",
  initial: "M",
};

/** One message, from the caregiver, shown as it was written. Not a
 *  notification and not editable here — the patient receives it. */
export const AFFIRMATION = {
  from: "Sinta",
  relation: "Cucu",
  text: "You matter. Semangat hari ini ya Oma! ❤️",
};

/** Full energy for a day, and exactly what the list below adds up to.
 *
 *  Seven items rather than four, because four is not a day — it is a demo. A
 *  real day has the small things in it too, and a list long enough to scroll is
 *  also what stops the screen ending halfway down. */
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

/** What Karsa says when the patient presses the big button. Picked by how the
 *  day is going, so the reply is never cheerful at somebody having a bad one. */
export const MASCOT_LINES = {
  high: "Hari ini lancar sekali, Oma. Aku senang menemani.",
  mid: "Pelan-pelan saja. Satu hal dulu, aku tunggu di sini.",
  low: "Tidak apa-apa kalau hari ini berat. Aku tetap di sini.",
};
