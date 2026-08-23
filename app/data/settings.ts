/** Everything the caregiver can manage about their own account and the app.
 *
 *  Two levels: a group (Akun, Aplikasi, …) holds items (Profil, Notifikasi, …),
 *  and each item holds the rows you actually change. The landing lists the
 *  items; picking one shows its rows. */

import type { Tone } from "../components/tones";

export type IconKey =
  | "user"
  | "idCard"
  | "bell"
  | "palette"
  | "languages"
  | "careHands"
  | "patientAccess"
  | "privacy"
  | "security"
  | "support"
  | "about";

/** What sits at the end of a row. */
export type Control =
  | { kind: "link" }
  | { kind: "value"; value: string }
  | { kind: "toggle"; enabled: boolean };

export type SettingRow = {
  id: string;
  title: string;
  description?: string;
  control: Control;
};

export type SettingItem = {
  id: string;
  title: string;
  /** Shown under the title on the landing and as the detail subtitle. */
  description: string;
  icon: IconKey;
  rows: SettingRow[];
};

export type SettingGroup = {
  id: string;
  label: string;
  /** One hue per group, so colour tells you where you are. */
  tone: Tone;
  items: SettingItem[];
};

export const ACCOUNT = {
  name: "Meimei Tole tole",
  email: "meimei@karsa.app",
  role: "Pendamping utama",
  initial: "M",
  status: "Aktif",
};

export const SETTINGS: SettingGroup[] = [
  {
    id: "account",
    label: "Akun",
    tone: "green",
    items: [
      {
        id: "profile",
        title: "Profil",
        description: "Nama, email, dan peran pendamping",
        icon: "user",
        rows: [
          { id: "name", title: "Nama lengkap", control: { kind: "value", value: ACCOUNT.name } },
          { id: "email", title: "Email", control: { kind: "value", value: ACCOUNT.email } },
          { id: "role", title: "Peran", control: { kind: "value", value: ACCOUNT.role } },
          { id: "photo", title: "Foto profil", description: "Terlihat oleh tim perawatan", control: { kind: "link" } },
        ],
      },
      {
        id: "personal",
        title: "Informasi pribadi",
        description: "Kontak dan detail pribadi kamu",
        icon: "idCard",
        rows: [
          { id: "phone", title: "Nomor telepon", control: { kind: "value", value: "+62 812 3456 7890" } },
          { id: "birth", title: "Tanggal lahir", control: { kind: "value", value: "12 Mei 1990" } },
          { id: "address", title: "Alamat", control: { kind: "link" } },
          {
            id: "emergency",
            title: "Kontak darurat",
            description: "Dihubungi bila terjadi keadaan mendesak",
            control: { kind: "value", value: "Sinta" },
          },
        ],
      },
    ],
  },
  {
    id: "app",
    label: "Aplikasi",
    tone: "lavender",
    items: [
      {
        id: "appearance",
        title: "Tampilan",
        description: "Terang, gelap, atau mengikuti sistem",
        icon: "palette",
        rows: [
          { id: "theme", title: "Tema", control: { kind: "value", value: "Sistem" } },
          { id: "textsize", title: "Ukuran teks", control: { kind: "value", value: "Sedang" } },
          {
            id: "motion",
            title: "Kurangi animasi",
            description: "Mengikuti pengaturan perangkat",
            control: { kind: "toggle", enabled: false },
          },
        ],
      },
    ],
  },
  {
    id: "care",
    label: "Perawatan",
    tone: "peach",
    items: [
      {
        id: "patient-access",
        title: "Akses pasien",
        description: "Siapa yang bisa melihat dan mengubah perawatan",
        icon: "patientAccess",
        rows: [
          { id: "team", title: "Anggota tim perawatan", control: { kind: "value", value: "3 orang" } },
          { id: "invite", title: "Undang pendamping", control: { kind: "link" } },
          {
            id: "sharing",
            title: "Berbagi data kesehatan",
            description: "Dengan tim perawatan Meimei",
            control: { kind: "toggle", enabled: true },
          },
        ],
      },
    ],
  },
];

/** Flat lookup for the selected item. */
export const SETTING_ITEMS = SETTINGS.flatMap((group) =>
  group.items.map((item) => ({ ...item, groupId: group.id, groupLabel: group.label, tone: group.tone })),
);

export type ResolvedItem = (typeof SETTING_ITEMS)[number];

/* ── Profile rail ─────────────────────────────────────────────────────────── */

export const ACCOUNT_STATS: { label: string; value: string }[] = [
  { label: "Follower", value: "0" },
  { label: "Following", value: "0" },
  { label: "Tim", value: "0" },
];

/** The one warm card in the rail. It nudges the caregiver toward themselves,
 *  not toward the app — the whole page is about their account, so this is the
 *  right place to say the quiet thing. Phrased as an invitation: a caregiver
 *  who has skipped their own rest does not need to be told off about it. */
export const SELF_CARE = {
  title: "Rawat dirimu juga",
  body: "Luangkan 15 menit hari ini untuk diri sendiri. Itu bagian dari merawat, bukan jeda darinya.",
  action: "Lihat Ruang Tenang",
  href: "/community",
};

/* ── Contributions ────────────────────────────────────────────────────────── */

/** What the caregiver has actually put in. The note under each figure is the
 *  point: a bare count of 892 doses says nothing, "98% tepat waktu" is the
 *  sentence they can be proud of. */
export type Contribution = {
  id: string;
  label: string;
  value: string;
  note: string;
  tone: Tone;
};

export const CONTRIBUTIONS: Contribution[] = [
  {
    id: "notes",
    label: "Catatan harian",
    value: "1.284",
    note: "Sejak Desember 2025",
    tone: "green",
  },
  {
    id: "doses",
    label: "Dosis dicatat",
    value: "892",
    note: "98% tepat waktu",
    tone: "lavender",
  },
  {
    id: "replies",
    label: "Balasan di komunitas",
    value: "64",
    note: "Membantu 21 pendamping",
    tone: "peach",
  },
  {
    id: "streak",
    label: "Hari beruntun",
    value: "18",
    note: "Rekor terpanjang 46",
    tone: "blue",
  },
];

/* ── Quick settings ───────────────────────────────────────────────────────── */

/** The few controls worth putting in front of the caregiver without making
 *  them open a section first: the two reminders a day actually runs on, and the
 *  switches that decide who can see Meimei's records.
 *
 *  References, not copies. Each points at a row that already exists further up,
 *  so the switch shown here and the one inside its section are the same switch
 *  — flip it in either place and both agree. */
export const QUICK_SETTINGS: { itemId: string; rowId: string }[] = [
  { itemId: "care-prefs", rowId: "med-reminder" },
  { itemId: "notifications", rowId: "task" },
  { itemId: "care-prefs", rowId: "quiet" },
  { itemId: "patient-access", rowId: "team" },
  { itemId: "patient-access", rowId: "sharing" },
  { itemId: "security", rowId: "twofa" },
];

/* ── Overview cards ───────────────────────────────────────────────────────── */

/** What the right column holds when no section is open. Each action opens a
 *  real settings item, so the card is a shortcut rather than an advert. */
export type OverviewCard = {
  id: string;
  title: string;
  body: string;
  actions: { label: string; target: string; primary?: boolean }[];
};

/** Three, not four: editing the profile already has two pencils and a rail row
 *  pointing at it, and a card repeating that would be the fourth. */
export const OVERVIEW: OverviewCard[] = [
  {
    id: "team",
    title: "Merawat tidak harus sendirian",
    body: "Atur siapa saja yang boleh melihat data Meimei dan seberapa jauh mereka bisa membantu.",
    actions: [
      { label: "Atur Akses Pasien", target: "patient-access", primary: true },
      { label: "Preferensi Perawatan", target: "care-prefs" },
    ],
  },
  {
    id: "safety",
    title: "Data kesehatan itu data paling pribadi",
    body: "Verifikasi dua langkah dan kontrol privasi menjaga catatan Meimei tetap di tangan yang kamu percaya.",
    actions: [
      { label: "Keamanan", target: "security", primary: true },
      { label: "Privasi", target: "privacy" },
    ],
  },
  {
    id: "help",
    title: "Ada yang membingungkan?",
    body: "Pusat bantuan, cara menghubungi tim Karsa, dan detail versi aplikasi yang sedang kamu pakai.",
    actions: [
      { label: "Pusat Bantuan", target: "help", primary: true },
      { label: "Tentang Aplikasi", target: "about" },
    ],
  },
];

/* ── Form options ─────────────────────────────────────────────────────────── */

/** What a caregiver can be to the person they look after. Ordered by how much
 *  of the day it takes, because that is what the list is really asking. */
export const ROLE_OPTIONS = [
  "Pendamping utama",
  "Pendamping pendukung",
  "Keluarga",
  "Perawat profesional",
];

/** Seed values for the profile form. Separate from `ACCOUNT` so editing the
 *  form never mutates the identity the rail reads from. */
export const PROFILE_FIELDS = {
  name: ACCOUNT.name,
  email: ACCOUNT.email,
  role: ACCOUNT.role,
  phone: "+62 812 3456 7890",
  birth: "1990-05-12",
  emergency: "Sinta",
  address: "Jl. Melati No. 24, Bandung",
};
