/** The Komunitas page's own data: the threads worth surfacing, the caregiver
 *  sub-communities, the next expert session, the topic cloud, and the people
 *  worth following.
 *
 *  Placeholders throughout — this is a design pass, not a data layer. */

import type { Tone } from "../components/tones";
import type { GroupArtKind } from "../components/GroupArt";

/** Indonesian thousands separator, so a member count reads the same way the
 *  fluid figures do on the Care page ("1.500 ml"). Abbreviating to "4.2k"
 *  would be the only English number in the app. */
export const count = (n: number) => n.toLocaleString("id-ID");

/* ── People ───────────────────────────────────────────────────────────────── */

export type Person = {
  id: string;
  name: string;
  /** Their standing in the community, not their job title in full. */
  role: string;
  initial: string;
  color: string;
  /** Clinicians the app has checked. Peers are not marked — being unverified
   *  is the normal case here, so it must not read as a demotion. */
  verified?: boolean;
};

export const PEOPLE: Record<string, Person> = {
  anindya: {
    id: "anindya",
    name: "dr. Anindya Rahma",
    role: "Dokter geriatri",
    initial: "A",
    color: "#56785d",
    verified: true,
  },
  bagas: {
    id: "bagas",
    name: "Ns. Bagas Prakoso",
    role: "Perawat home care",
    initial: "B",
    color: "#3f6a95",
    verified: true,
  },
  rina: {
    id: "rina",
    name: "Rina Kusuma, S.Gz",
    role: "Ahli gizi klinis",
    initial: "R",
    color: "#b06c34",
    verified: true,
  },
  sinta: {
    id: "sinta",
    name: "Sinta Dewi",
    role: "Pendamping · 3 tahun",
    initial: "S",
    color: "#8a76bd",
  },
  truman: {
    id: "truman",
    name: "Truman Hadi",
    role: "Pendamping · 1 tahun",
    initial: "T",
    color: "#c98a4a",
  },
};

/* ── Diskusi populer ──────────────────────────────────────────────────────── */

export type Discussion = {
  id: string;
  author: string;
  title: string;
  replies: number;
  /** Two at most: a third tag wraps the card onto a fourth line. */
  tags: { label: string; tone: Tone }[];
};

export const DISCUSSIONS: Discussion[] = [
  {
    id: "d1",
    author: "sinta",
    title: "Cara membujuk lansia yang menolak minum obat, tanpa jadi bertengkar?",
    replies: 120,
    tags: [
      { label: "Obat & Dosis", tone: "lavender" },
      { label: "Lansia", tone: "blue" },
    ],
  },
  {
    id: "d2",
    author: "truman",
    title: "Merawat sambil bekerja penuh waktu — bagaimana kalian membagi hari?",
    replies: 43,
    tags: [
      { label: "Kesehatan Mental", tone: "green" },
      { label: "Rutinitas", tone: "cream" },
    ],
  },
];

/* ── Topik & grup ─────────────────────────────────────────────────────────── */

export type Group = {
  id: string;
  name: string;
  blurb: string;
  members: number;
  art: GroupArtKind;
  tone: Tone;
  /** Groups the caregiver is already in open joined. */
  joined?: boolean;
};

export const GROUPS: Group[] = [
  {
    id: "g1",
    name: "Komunitas Diabetes & Nutrisi",
    blurb: "Menyusun menu harian, membaca label gizi, dan menjaga gula darah tetap stabil.",
    members: 4235,
    art: "nutrition",
    tone: "peach",
  },
  {
    id: "g2",
    name: "Grup Pendamping Lansia",
    blurb: "Untuk yang merawat orang tua di rumah — mobilitas, kamar mandi, dan kesabaran.",
    members: 3180,
    art: "elderly",
    tone: "blue",
    joined: true,
  },
  {
    id: "g3",
    name: "Ruang Tenang Pendamping",
    blurb: "Tempat menaruh lelah. Cerita, keluh, dan cara menjaga diri sendiri tetap utuh.",
    members: 2760,
    art: "mind",
    tone: "green",
  },
  {
    id: "g4",
    name: "Pemulihan Pasca-Stroke",
    blurb: "Latihan harian, terapi wicara, dan menandai kemajuan yang bergerak pelan.",
    members: 1490,
    art: "recovery",
    tone: "lavender",
  },
];

/* ── Sesi ahli ────────────────────────────────────────────────────────────── */

export const LIVE_SESSION = {
  eyebrow: "Sesi langsung",
  title: "Tanya Jawab Ahli: Menjaga Kesehatan Mental Pendamping",
  host: "dr. Anindya Rahma",
  date: "Sabtu, 22 Agu",
  time: "19.00 WIB",
  blurb: "Satu jam bersama ahli geriatri untuk membahas kelelahan pendamping dan cara memulihkannya.",
  cta: "Ikuti Sesi",
};

/* ── Topik populer ────────────────────────────────────────────────────────── */

export const HASHTAGS: { label: string; tone: Tone }[] = [
  { label: "#TipsNutrisi", tone: "peach" },
  { label: "#PerawatanHarian", tone: "green" },
  { label: "#ObatLansia", tone: "lavender" },
  { label: "#ManajemenStres", tone: "blue" },
  { label: "#Demensia", tone: "cream" },
  { label: "#LukaBaring", tone: "peach" },
  { label: "#GiziSeimbang", tone: "green" },
  { label: "#DukunganKeluarga", tone: "lavender" },
];

/* ── Orang untuk diikuti ──────────────────────────────────────────────────── */

export const SUGGESTED = ["anindya", "bagas", "rina", "sinta"];
