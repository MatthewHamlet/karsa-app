

import { NOW_TIME } from "./dashboard";



export type CareContextType =
  | "medication"
  | "instruction"
  | "event"
  | "note"
  | "record";

export type CareContext = {
  type: CareContextType;
  id: string;
  label: string;
  detail?: string;
};


export function chatHref(context: CareContext) {
  const params = new URLSearchParams({
    tab: "obrolan",
    ref: `${context.type}:${context.id}`,
    label: context.label,
  });
  if (context.detail) params.set("detail", context.detail);
  return `/care?${params.toString()}`;
}


export function caregiverChatHref(caregiver: { id: string; name: string }) {
  return `/care?tab=obrolan&to=${caregiver.id}&name=${encodeURIComponent(caregiver.name)}`;
}

export const CONTEXT_LABEL: Record<CareContextType, string> = {
  medication: "Obat",
  instruction: "Instruksi perawatan",
  event: "Jadwal",
  note: "Catatan perawatan",
  record: "Rekam kesehatan",
};



export const PATIENT = {
  name: "Meimei",
  subtitle: "Profil perawatan",
  status: "Kondisi stabil",
  updatedAt: `Terakhir diperbarui hari ini, ${NOW_TIME}`,
};



export type CareArea = "medication" | "nutrition" | "activity" | "rest";

export type CareItem = {
  id: string;
  label: string;
  detail: string;

  context?: CareContext;
};

export type CareNeed = {
  id: CareArea;
  title: string;
  status: string;

  highlight: { primary: string; secondary: string };
  items: CareItem[];
  context: CareContext;
};

export const CARE_NEEDS: CareNeed[] = [
  {
    id: "medication",
    title: "Obat",
    status: "3 obat aktif",
    highlight: { primary: "Metformin · 500 mg", secondary: "Setelah sarapan" },
    context: { type: "instruction", id: "obat", label: "Obat" },
    items: [
      {
        id: "metformin",
        label: "Metformin",
        detail: "500 mg · Setelah sarapan",
        context: {
          type: "medication",
          id: "metformin",
          label: "Metformin",
          detail: "500 mg · Setelah sarapan",
        },
      },
      {
        id: "amlodipine",
        label: "Amlodipine",
        detail: "5 mg · Setelah makan malam",
        context: {
          type: "medication",
          id: "amlodipine",
          label: "Amlodipine",
          detail: "5 mg · Setelah makan malam",
        },
      },
      {
        id: "vitamin-d",
        label: "Vitamin D3",
        detail: "1000 IU · Setelah sarapan",
        context: {
          type: "medication",
          id: "vitamin-d",
          label: "Vitamin D3",
          detail: "1000 IU · Setelah sarapan",
        },
      },
    ],
  },
  {
    id: "nutrition",
    title: "Nutrisi",
    status: "Panduan makan harian",
    highlight: { primary: "Rendah gula dan garam", secondary: "3 kali makan · 2 camilan" },
    context: { type: "instruction", id: "nutrisi", label: "Nutrisi" },
    items: [
      { id: "n1", label: "Pola makan", detail: "3 kali makan utama dan 2 camilan ringan" },
      { id: "n2", label: "Batasan", detail: "Rendah gula dan garam, hindari gorengan" },
      { id: "n3", label: "Cairan", detail: "6–8 gelas air per hari" },
      { id: "n4", label: "Preferensi", detail: "Lebih menyukai makanan hangat dan berkuah" },
    ],
  },
  {
    id: "activity",
    title: "Aktivitas",
    status: "Anjuran dan pembatasan",
    highlight: { primary: "Jalan pagi 20 menit", secondary: "Hindari angkat beban" },
    context: { type: "instruction", id: "aktivitas", label: "Aktivitas" },
    items: [
      { id: "a1", label: "Dianjurkan", detail: "Jalan pagi 20 menit, didampingi" },
      { id: "a2", label: "Dianjurkan", detail: "Peregangan ringan sore hari" },
      { id: "a3", label: "Dihindari", detail: "Mengangkat beban lebih dari 5 kg" },
      { id: "a4", label: "Dihindari", detail: "Aktivitas berat setelah pukul 18:00" },
    ],
  },
  {
    id: "rest",
    title: "Istirahat",
    status: "Rutinitas tidur dan istirahat",
    highlight: { primary: "Tidur 21:30 · Bangun 05:30", secondary: "Tidur siang 30 menit" },
    context: { type: "instruction", id: "istirahat", label: "Istirahat" },
    items: [
      { id: "r1", label: "Tidur malam", detail: "21:30 – 05:30" },
      { id: "r2", label: "Tidur siang", detail: "30 menit setelah makan siang" },
      { id: "r3", label: "Sebelum tidur", detail: "Hindari layar 1 jam sebelum tidur" },
      { id: "r4", label: "Lingkungan", detail: "Lampu redup, jendela ditutup" },
    ],
  },
];



export type Instruction = { id: string; text: string };

export const INSTRUCTIONS: Instruction[] = [
  { id: "i1", text: "Obat diminum setelah makan." },
  { id: "i2", text: "Hindari aktivitas berat setelah pukul 18:00." },
  { id: "i3", text: "Hubungi tim perawatan bila ada kondisi tidak biasa." },
];



export type Caregiver = {
  id: string;
  name: string;
  role: string;
  presence: "active" | "away";
  presenceLabel: string;
};

export const CARE_TEAM: Caregiver[] = [
  { id: "sinta", name: "Sinta", role: "Perawat utama", presence: "active", presenceLabel: "Aktif" },
  { id: "matthew", name: "Matthew", role: "Keluarga", presence: "active", presenceLabel: "Aktif" },
  {
    id: "truman",
    name: "Truman",
    role: "Keluarga",
    presence: "away",
    presenceLabel: "Terakhir aktif 2 jam lalu",
  },
];



export type PlanChange = {
  id: string;
  date: string;
  title: string;
  detail: string;
  by: string;
};

export const PLAN_HISTORY: PlanChange[] = [
  {
    id: "h1",
    date: "14 Agu",
    title: "Instruksi obat diperbarui",
    detail: "Metformin dipindah ke setelah sarapan",
    by: "Sinta",
  },
  {
    id: "h2",
    date: "12 Agu",
    title: "Preferensi makan ditambahkan",
    detail: "Lebih menyukai makanan hangat dan berkuah",
    by: "Matthew",
  },
  {
    id: "h3",
    date: "08 Agu",
    title: "Anjuran aktivitas diubah",
    detail: "Jalan pagi dikurangi menjadi 20 menit",
    by: "Sinta",
  },
  {
    id: "h4",
    date: "02 Agu",
    title: "Rutinitas istirahat disesuaikan",
    detail: "Tidur siang ditambahkan setelah makan siang",
    by: "Sinta",
  },
  {
    id: "h5",
    date: "27 Jul",
    title: "Vitamin D3 ditambahkan",
    detail: "1000 IU, diminum setelah sarapan",
    by: "Sinta",
  },
  {
    id: "h6",
    date: "19 Jul",
    title: "Profil perawatan dibuat",
    detail: "Rencana awal disusun bersama keluarga",
    by: "Sinta",
  },
];


export const PLAN_HISTORY_PREVIEW = 3;
