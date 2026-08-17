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
        id: "notifications",
        title: "Notifikasi",
        description: "Pengingat, tugas, dan pembaruan aktivitas",
        icon: "bell",
        rows: [
          {
            id: "task",
            title: "Pengingat tugas",
            description: "Sebelum tugas harian jatuh tempo",
            control: { kind: "toggle", enabled: true },
          },
          {
            id: "activity",
            title: "Pembaruan aktivitas",
            description: "Saat pendamping lain mencatat sesuatu",
            control: { kind: "toggle", enabled: true },
          },
          {
            id: "messages",
            title: "Pesan grup",
            description: "Percakapan tim perawatan",
            control: { kind: "toggle", enabled: true },
          },
          {
            id: "digest",
            title: "Ringkasan harian",
            description: "Dikirim setiap pagi pukul 07:00",
            control: { kind: "toggle", enabled: false },
          },
        ],
      },
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
      {
        id: "language",
        title: "Bahasa",
        description: "Bahasa aplikasi dan format waktu",
        icon: "languages",
        rows: [
          { id: "lang", title: "Bahasa aplikasi", control: { kind: "value", value: "Indonesia" } },
          { id: "time", title: "Format waktu", control: { kind: "value", value: "24 jam" } },
          { id: "region", title: "Wilayah", control: { kind: "value", value: "Indonesia" } },
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
        id: "care-prefs",
        title: "Preferensi perawatan",
        description: "Cara Karsa mengingatkan tugas perawatan",
        icon: "careHands",
        rows: [
          { id: "med-reminder", title: "Pengingat obat", control: { kind: "toggle", enabled: true } },
          {
            id: "quiet",
            title: "Jam tenang",
            description: "Tidak ada notifikasi pada rentang ini",
            control: { kind: "value", value: "22:00 – 05:00" },
          },
          { id: "units", title: "Satuan", control: { kind: "value", value: "Metrik" } },
        ],
      },
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
  {
    id: "privacy",
    label: "Privasi & keamanan",
    tone: "blue",
    items: [
      {
        id: "privacy",
        title: "Privasi",
        description: "Kelola data dan izin aplikasi",
        icon: "privacy",
        rows: [
          { id: "data", title: "Data saya", control: { kind: "link" } },
          { id: "download", title: "Unduh salinan data", control: { kind: "link" } },
          {
            id: "analytics",
            title: "Bantu tingkatkan Karsa",
            description: "Berbagi data penggunaan anonim",
            control: { kind: "toggle", enabled: false },
          },
        ],
      },
      {
        id: "security",
        title: "Keamanan",
        description: "Kata sandi dan keamanan akun",
        icon: "security",
        rows: [
          { id: "password", title: "Kata sandi", control: { kind: "value", value: "Diubah 3 bulan lalu" } },
          {
            id: "twofa",
            title: "Verifikasi dua langkah",
            description: "Lapisan keamanan tambahan saat masuk",
            control: { kind: "toggle", enabled: false },
          },
          { id: "devices", title: "Perangkat terhubung", control: { kind: "value", value: "2" } },
        ],
      },
    ],
  },
  {
    id: "support",
    label: "Bantuan",
    tone: "cream",
    items: [
      {
        id: "help",
        title: "Bantuan & dukungan",
        description: "Pusat bantuan dan kontak tim Karsa",
        icon: "support",
        rows: [
          { id: "center", title: "Pusat bantuan", control: { kind: "link" } },
          { id: "contact", title: "Hubungi kami", control: { kind: "link" } },
          { id: "report", title: "Laporkan masalah", control: { kind: "link" } },
        ],
      },
      {
        id: "about",
        title: "Tentang aplikasi",
        description: "Versi, syarat, dan kebijakan privasi",
        icon: "about",
        rows: [
          { id: "version", title: "Versi aplikasi", control: { kind: "value", value: "1.0.0" } },
          { id: "terms", title: "Syarat & ketentuan", control: { kind: "link" } },
          { id: "policy", title: "Kebijakan privasi", control: { kind: "link" } },
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
