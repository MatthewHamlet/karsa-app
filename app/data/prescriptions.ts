/** Scanned prescriptions: what the reader pulls off a photo, and every sheet
 *  scanned before it.
 *
 *  No reader behind this yet — `EXTRACTED` is what a scan is scripted to find,
 *  so the review screen can be designed against a realistic result. Point it at
 *  a real OCR response and nothing else here has to move. */

export type Medicine = {
  id: string;
  name: string;
  dose: string;
  /** How it is taken, in the words a label uses. */
  rule: string;
  /** The schedule those words work out to. Editable — a reader guesses these
   *  from "3x sehari", and a household's hours are its own. */
  times: string[];
  /** Below this, the reader wasn't sure. The row says so rather than hiding it:
   *  a misread dose is the one mistake this feature must not make quietly. */
  confident?: boolean;
};

export type Prescription = {
  id: string;
  /** Pre-formatted — a real Date renders in the server's zone and then the
   *  browser's, and the two disagree. */
  date: string;
  clinic: string;
  doctor: string;
  status: "aktif" | "selesai";
  medicines: Medicine[];
};

/** What the scan comes back with, before anyone checks it. */
export const EXTRACTED: Medicine[] = [
  {
    id: "e1",
    name: "Paracetamol",
    dose: "500 mg",
    rule: "3x sehari, sesudah makan",
    times: ["08:00", "13:00", "19:00"],
    confident: true,
  },
  {
    id: "e2",
    name: "Amlodipine",
    dose: "5 mg",
    rule: "1x sehari, malam hari",
    times: ["20:00"],
    confident: true,
  },
  {
    id: "e3",
    name: "Metformin",
    dose: "500 mg",
    rule: "2x sehari, sesudah makan",
    times: ["08:00", "19:00"],
    /* Deliberately unsure: handwriting on a dose is exactly where a reader
       fails, and the screen has to be honest about it. */
    confident: false,
  },
];

export const SCAN_HISTORY: Prescription[] = [
  {
    id: "p1",
    date: "18 Agustus 2026",
    clinic: "Klinik Geriatri Sehat",
    doctor: "dr. Anindya Rahma",
    status: "aktif",
    medicines: [
      {
        id: "p1m1",
        name: "Amlodipine",
        dose: "5 mg",
        rule: "1x sehari, malam hari",
        times: ["20:00"],
      },
      {
        id: "p1m2",
        name: "Metformin",
        dose: "500 mg",
        rule: "2x sehari, sesudah makan",
        times: ["08:00", "19:00"],
      },
    ],
  },
  {
    id: "p2",
    date: "2 Agustus 2026",
    clinic: "RS Harapan Bunda",
    doctor: "dr. Wirawan Sudibyo",
    status: "aktif",
    medicines: [
      {
        id: "p2m1",
        name: "Candesartan",
        dose: "8 mg",
        rule: "1x sehari, pagi",
        times: ["07:00"],
      },
    ],
  },
  {
    id: "p3",
    date: "11 Juli 2026",
    clinic: "Klinik Geriatri Sehat",
    doctor: "dr. Anindya Rahma",
    status: "selesai",
    medicines: [
      {
        id: "p3m1",
        name: "Cefixime",
        dose: "100 mg",
        rule: "2x sehari, 5 hari",
        times: ["08:00", "20:00"],
      },
      {
        id: "p3m2",
        name: "Paracetamol",
        dose: "500 mg",
        rule: "Bila demam",
        times: ["Sesuai perlu"],
      },
    ],
  },
];

/** Tips shown behind the bulb on the camera bar. Short enough to read while
 *  holding a phone over a sheet of paper. */
export const SCAN_TIPS = [
  "Letakkan resep di permukaan datar dengan cahaya merata.",
  "Pastikan seluruh tepi kertas masuk ke dalam bingkai.",
  "Hindari bayangan tangan atau kepala di atas kertas.",
  "Jika tulisan dokter sulit dibaca, foto lebih dekat per bagian.",
];
