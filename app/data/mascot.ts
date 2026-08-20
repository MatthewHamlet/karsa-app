/** The assistant page's own data: who is being cared for, what the mascot can
 *  be asked to do, and the canned replies behind each of those.
 *
 *  There is no model on the other end of this yet — the replies are scripted so
 *  the page can be designed against realistic answers. Swap `REPLIES` for a
 *  fetch and nothing else here has to move. */

import type { Tone } from "../components/tones";

/** What the mascot is doing right now. The page only ever moves
 *  idle → thinking → presenting → idle. */
export type MascotState = "idle" | "thinking" | "presenting";

/** The header banner's context. Mirrors the patient the rest of the app is
 *  built around rather than inventing a second one. */
export const PATIENT = {
  name: "Meimei",
  age: 78,
  /** Short, scannable, and the two things that change what advice is safe. */
  alerts: ["Tekanan darah tinggi", "Alergi penisilin"],
};

export type ActionCardKind = "medication" | "vitals" | "emergency" | "note";

/** A card the mascot puts on the table in answer to something. It is an
 *  offer to do the next step, not a summary of what was said. */
export type ActionCard = {
  id: string;
  kind: ActionCardKind;
  tone: Tone;
  title: string;
  detail: string;
  /** The quiet line under the action — a time, a reading, a phone number. */
  meta?: string;
  cta: string;
};

export type Intent = "meds" | "vitals" | "urgent" | "general";

export const QUICK_ACTIONS: {
  intent: Intent;
  emoji: string;
  label: string;
  /** One button on this page is allowed to be red. */
  urgent?: boolean;
}[] = [
  { intent: "meds", emoji: "💊", label: "Catat obat jam 8 malam" },
  { intent: "vitals", emoji: "🩺", label: "Catat vital (tensi / detak jantung)" },
  { intent: "urgent", emoji: "🚨", label: "Butuh bantuan darurat", urgent: true },
];

/** What a quick action types into the box on the caregiver's behalf. */
export const PROMPT_FOR: Record<Intent, string> = {
  meds: "Tolong catat obat Meimei jam 8 malam.",
  vitals: "Aku mau catat tensi dan detak jantung Meimei.",
  urgent: "Meimei sesak napas dan pusing. Aku harus apa?",
  general: "",
};

export const REPLIES: Record<Intent, { text: string; cards: ActionCard[] }> = {
  meds: {
    text: "Baik. Malam ini Meimei dapat Amlodipine 5 mg dan Metformin 500 mg, keduanya sesudah makan. Aku sudah siapkan catatannya — tinggal tandai setelah beliau minum.",
    cards: [
      {
        id: "m1",
        kind: "medication",
        tone: "lavender",
        title: "Amlodipine 5 mg",
        detail: "Sesudah makan malam",
        meta: "20.00 · dosis 3 dari 3",
        cta: "Tandai sudah diminum",
      },
      {
        id: "m2",
        kind: "medication",
        tone: "peach",
        title: "Metformin 500 mg",
        detail: "Sesudah makan malam",
        meta: "20.00 · dosis 3 dari 3",
        cta: "Tandai sudah diminum",
      },
    ],
  },

  vitals: {
    text: "Siap. Tensi terakhir Meimei 148/92 kemarin sore — masih di atas target, jadi hasil hari ini penting. Catat setelah beliau duduk tenang lima menit ya.",
    cards: [
      {
        id: "v1",
        kind: "vitals",
        tone: "blue",
        title: "Tekanan darah",
        detail: "Target di bawah 140/90",
        meta: "Terakhir 148/92 · kemarin 17.20",
        cta: "Catat pengukuran",
      },
      {
        id: "v2",
        kind: "vitals",
        tone: "green",
        title: "Detak jantung",
        detail: "Istirahat, sebelum obat malam",
        meta: "Terakhir 78 bpm · kemarin 17.20",
        cta: "Catat pengukuran",
      },
    ],
  },

  urgent: {
    text: "Sesak napas dengan pusing pada Meimei tidak boleh ditunggu. Dudukkan beliau tegak, longgarkan pakaian, dan hubungi bantuan sekarang. Aku tidak bisa menilai kondisi medis — nomor di bawah bisa.",
    cards: [
      {
        id: "e1",
        kind: "emergency",
        tone: "rose",
        title: "Ambulans 119",
        detail: "Layanan gawat darurat nasional",
        meta: "Sebutkan: 78 tahun, hipertensi, alergi penisilin",
        cta: "Hubungi sekarang",
      },
      {
        id: "e2",
        kind: "emergency",
        tone: "cream",
        title: "dr. Anindya Rahma",
        detail: "Dokter penanggung jawab Meimei",
        meta: "+62 812 1158 1769",
        cta: "Telepon dokter",
      },
      {
        id: "e3",
        kind: "note",
        tone: "neutral",
        title: "Beri tahu tim pendamping",
        detail: "Sinta dan Truman akan langsung menerima notifikasi",
        cta: "Kirim ke grup",
      },
    ],
  },

  general: {
    text: "Aku catat ya. Kalau mau, aku bisa langsung bukakan catatan obat, pengukuran vital, atau kontak darurat Meimei — pilih saja di bawah.",
    cards: [
      {
        id: "g1",
        kind: "medication",
        tone: "lavender",
        title: "Jadwal obat hari ini",
        detail: "2 dari 3 dosis sudah diminum",
        meta: "Berikutnya 20.00",
        cta: "Buka jadwal",
      },
      {
        id: "g2",
        kind: "vitals",
        tone: "blue",
        title: "Catat vital",
        detail: "Tensi, detak jantung, suhu",
        cta: "Mulai pencatatan",
      },
    ],
  },
};

/** Reads as a person talking, not a form being filled. */
export const GREETING =
  "Halo, aku Karsa. Aku ikut menemani Meimei hari ini — tanya apa saja, atau pilih salah satu di bawah untuk mulai cepat.";

/* ── Riwayat percakapan ───────────────────────────────────────────────────── */

/** Sessions the caregiver has had with Karsa before. Each carries its whole
 *  thread, so reopening one restores the conversation rather than showing a
 *  summary of it — a caregiver looking up what they were told last Tuesday
 *  needs the words, not a title. */
export type HistorySession = {
  id: string;
  /** Grouping label, already resolved — the page does no date maths. */
  day: string;
  time: string;
  title: string;
  turns: { from: "me" | "karsa"; text: string }[];
};

export const HISTORY: HistorySession[] = [
  {
    id: "h1",
    day: "Hari ini",
    time: "08:12",
    title: "Metformin pagi tertunda",
    turns: [
      { from: "me", text: "Meimei belum minum Metformin pagi, sudah lewat 2 jam. Aman?" },
      {
        from: "karsa",
        text: "Masih aman. Metformin pagi boleh diminum sampai sebelum makan siang, asal jaraknya tidak terlalu dekat dengan dosis berikutnya. Aku catat keterlambatannya ya.",
      },
    ],
  },
  {
    id: "h2",
    day: "Kemarin",
    time: "20:40",
    title: "Tensi naik setelah makan malam",
    turns: [
      { from: "me", text: "Tensi Meimei 150/95 tadi. Biasanya 130-an." },
      {
        from: "karsa",
        text: "Satu kali pengukuran tinggi belum tentu berarti. Coba ukur ulang 15 menit lagi dalam posisi duduk tenang. Kalau masih di atas 150/95, itu layak dibawa ke dr. Anindya besok.",
      },
      { from: "me", text: "Oke, aku ukur ulang." },
    ],
  },
  {
    id: "h3",
    day: "Kemarin",
    time: "13:05",
    title: "Menu makan siang rendah garam",
    turns: [
      { from: "me", text: "Ide menu makan siang yang rendah garam tapi Meimei masih mau makan?" },
      {
        from: "karsa",
        text: "Coba pepes ikan dengan daun kemangi — rasanya kuat dari rempah, bukan dari garam. Tambah tumis labu siam dan nasi merah setengah porsi.",
      },
    ],
  },
  {
    id: "h4",
    day: "17 Agustus",
    time: "06:30",
    title: "Meimei susah tidur tiga malam",
    turns: [
      { from: "me", text: "Tiga malam ini Meimei baru tidur jam 2. Ada yang bisa dibantu?" },
      {
        from: "karsa",
        text: "Pola tidurnya memang bergeser sejak Sabtu. Biasanya yang menolong: matikan layar satu jam sebelum tidur, jaga kamar tetap gelap, dan jangan tidur siang lewat jam 3. Kalau lewat seminggu masih begini, sebaiknya dibicarakan dengan dokternya.",
      },
    ],
  },
];
