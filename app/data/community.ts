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
  /** The opening lines, clamped to two on the card. A title alone makes every
   *  thread look equally worth opening; the first sentence is what tells a
   *  caregiver whether this is their problem. */
  snippet: string;
  /** Pre-formatted rather than a timestamp: a real `Date` renders in the
   *  server's timezone and then the browser's, and the two disagree. */
  age: string;
  replies: number;
  upvotes: number;
  /** What this thread is about, for the search box and the topic chips. Kept
   *  beside the thread rather than derived from its title so a search for
   *  "demensia" finds the thread that never says the word. */
  keywords: string[];
  /** Two at most: a third tag wraps the card onto a fourth line. */
  tags: { label: string; tone: Tone }[];
};

export const DISCUSSIONS: Discussion[] = [
  {
    id: "d1",
    author: "sinta",
    title: "Cara membujuk lansia yang menolak minum obat, tanpa jadi bertengkar?",
    snippet:
      "Ibu saya selalu menolak Metformin paginya. Kalau dipaksa dia marah, kalau dibiarkan gula darahnya naik. Ada yang pernah menghadapi ini dan menemukan cara yang tidak bikin dua-duanya lelah?",
    age: "2 jam yang lalu",
    replies: 120,
    upvotes: 45,
    keywords: ["obat", "lansia", "demensia", "rutinitas"],
    tags: [
      { label: "Obat & Dosis", tone: "lavender" },
      { label: "Lansia", tone: "blue" },
    ],
  },
  {
    id: "d2",
    author: "truman",
    title: "Merawat sambil bekerja penuh waktu — bagaimana kalian membagi hari?",
    snippet:
      "Saya kerja sampai jam 5, lalu langsung menyiapkan makan malam dan obat. Jam 10 baru bisa duduk. Sudah tiga bulan begini dan mulai terasa. Bagaimana kalian mengatur jamnya?",
    age: "5 jam yang lalu",
    replies: 43,
    upvotes: 28,
    keywords: ["stres", "rutinitas", "dukungan", "kesehatan mental"],
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
  /** Same job as a thread's: what the group is about, in the words a caregiver
   *  would actually type. */
  keywords: string[];
  art: GroupArtKind;
  tone: Tone;
  /** Groups the caregiver is already in open joined. */
  joined?: boolean;
};

export const GROUPS: Group[] = [
  {
    id: "g1",
    name: "Komunitas Diabetes & Nutrisi",
    keywords: ["nutrisi", "gizi", "diabetes", "resep"],
    blurb: "Menyusun menu harian, membaca label gizi, dan menjaga gula darah tetap stabil.",
    members: 4235,
    art: "nutrition",
    tone: "peach",
  },
  {
    id: "g2",
    name: "Grup Pendamping Lansia",
    keywords: ["lansia", "perawatan harian", "mobilitas", "demensia"],
    blurb: "Untuk yang merawat orang tua di rumah — mobilitas, kamar mandi, dan kesabaran.",
    members: 3180,
    art: "elderly",
    tone: "blue",
    joined: true,
  },
  {
    id: "g3",
    name: "Ruang Tenang Pendamping",
    keywords: ["stres", "kesehatan mental", "dukungan", "lelah"],
    blurb: "Tempat menaruh lelah. Cerita, keluh, dan cara menjaga diri sendiri tetap utuh.",
    members: 2760,
    art: "mind",
    tone: "green",
  },
  {
    id: "g4",
    name: "Pemulihan Pasca-Stroke",
    keywords: ["stroke", "terapi", "perawatan harian", "latihan"],
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

/** `term` is what the chip actually searches for — the hashtag is how it's
 *  written, not how anyone types. Without it "#ObatLansia" would only ever
 *  match a thread that spelled it as one word. */
export type Hashtag = { label: string; term: string; threads: number; tone: Tone };

export const HASHTAGS: Hashtag[] = [
  { label: "#TipsNutrisi", term: "nutrisi", threads: 214, tone: "peach" },
  { label: "#PerawatanHarian", term: "perawatan harian", threads: 186, tone: "green" },
  { label: "#ObatLansia", term: "obat", threads: 120, tone: "lavender" },
  { label: "#ManajemenStres", term: "stres", threads: 98, tone: "blue" },
  { label: "#Demensia", term: "demensia", threads: 74, tone: "cream" },
  { label: "#LukaBaring", term: "luka baring", threads: 41, tone: "peach" },
  { label: "#GiziSeimbang", term: "gizi", threads: 37, tone: "green" },
  { label: "#DukunganKeluarga", term: "dukungan", threads: 29, tone: "lavender" },
];

/* ── Search ───────────────────────────────────────────────────────────────── */

/** One matcher for the search box and the topic chips, so a chip and the words
 *  it puts in the box can never disagree about what they find. Case- and
 *  hash-insensitive; an empty query matches everything rather than nothing. */
export const matches = (query: string, haystack: (string | undefined)[]) => {
  const q = query.trim().toLowerCase().replace(/^#/, "");
  if (!q) return true;
  return haystack.some((field) => field?.toLowerCase().includes(q));
};

/* Everything an item can be found by, flattened in one place.
 *
 *  The `?? []` are not decoration. Spreading a field straight into an array
 *  literal means one absent property throws `not iterable` *during render*, and
 *  a filter that cannot find a keyword takes down the entire page instead of
 *  quietly matching less. That is exactly what happened while these fields were
 *  being added and the dev server was serving a half-updated module — and it is
 *  what would happen again the first time this data comes from a request. */
export const discussionText = (thread: Discussion) => [
  thread.title,
  thread.snippet,
  ...(thread.keywords ?? []),
  ...(thread.tags ?? []).map((tag) => tag.label),
];

export const groupText = (group: Group) => [
  group.name,
  group.blurb,
  ...(group.keywords ?? []),
];

/* ── Orang untuk diikuti ──────────────────────────────────────────────────── */

export const SUGGESTED = ["anindya", "bagas", "rina", "sinta"];
