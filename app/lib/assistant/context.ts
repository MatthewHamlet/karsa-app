import { createClient } from "../supabase/server";
import { isSupabaseConfigured } from "../supabase/config";
import { getSessionProfile } from "../profile";
import { getMyPatientRecord, getMyPatients } from "../care/queries";
import { jakartaDateString, jakartaToday, longDateLabel } from "../care/time";

export type AssistantContext = {
  patientId: string;
  patientName: string;
  viewerName: string;
  viewerRole: "caregiver" | "patient";
  system: string;
};

const MOOD_WORD: Record<string, string> = {
  great: "senang sekali",
  good: "senang",
  okay: "biasa saja",
  low: "kurang baik",
  verylow: "sedih",
};

const READING_WORD: Record<string, string> = {
  blood_pressure: "tekanan darah",
  blood_sugar: "gula darah",
  oxygen: "saturasi oksigen",
  heart_rate: "detak jantung",
  temperature: "suhu tubuh",
  weight: "berat badan",
  fluid: "asupan cairan",
  sleep_minutes: "durasi tidur",
};

const GUARDRAILS = `
ATURAN YANG TIDAK BOLEH DILANGGAR:
- Kamu BUKAN dokter. Jangan pernah mendiagnosis, menyimpulkan penyakit, atau menilai hasil pemeriksaan sebagai "normal"/"berbahaya".
- Jangan pernah menyarankan menambah, mengurangi, mengganti, atau menghentikan obat. Itu hanya boleh diputuskan dokter.
- Jangan mengarang data. Kalau informasinya tidak ada di KONTEKS di bawah, katakan kamu tidak tahu dan sarankan mengeceknya di aplikasi.
- Untuk tanda bahaya (nyeri dada, sesak berat, pingsan, kejang, pendarahan, bicara pelo, lemah sebelah badan), langsung minta hubungi 119 atau ke IGD. Jangan menenangkan atau menunda.
- Jangan meminta atau mengulang data pribadi sensitif di luar yang sudah ada di konteks.
- Kalau ditanya hal di luar perawatan, jawab singkat dan arahkan kembali dengan ramah.
`.trim();

const VOICE = `
Kamu adalah Arsa, maskot pendamping di aplikasi perawatan keluarga bernama Karsa.

Gaya bicara:
- Bahasa Indonesia sehari-hari yang hangat, sopan, dan sederhana. Hindari istilah medis rumit.
- Singkat. 2-4 kalimat untuk pertanyaan biasa. Jangan menulis esai.
- Boleh memakai emoji sesekali, secukupnya, jangan berlebihan.
- Sapa dengan nama kalau terasa pas, jangan setiap kalimat.
- Kalau pengguna sedang lelah atau sedih, akui perasaannya dulu sebelum memberi saran.
- Tulis teks polos saja. Jangan pakai markdown: tanpa **tebal**, tanpa judul, tanpa daftar bernomor atau bertanda bintang. Gelembung chat menampilkan tanda bintang apa adanya.
`.trim();

export async function buildAssistantContext(): Promise<AssistantContext | null> {
  if (!isSupabaseConfigured()) return null;

  const me = await getSessionProfile();
  if (!me) return null;

  const supabase = await createClient();
  const today = jakartaToday();
  const todayString = jakartaDateString();

  let patientId: string | null = null;
  let patientName = "";

  if (me.role === "patient") {
    const record = await getMyPatientRecord();
    if (record) {
      patientId = record.id;
      patientName = record.display_name;
    }
  } else {
    const patients = await getMyPatients();
    const active = patients.find((p) => p.status === "active") ?? patients[0];
    if (active) {
      patientId = active.patientId;
      patientName = active.displayName;
    }
  }

  if (!patientId) return null;

  const since = new Date(Date.now() - 7 * 86400_000).toISOString();

  const [tasks, done, meds, moods, readings, notes] = await Promise.all([
    supabase
      .from("daily_tasks")
      .select("label, hint")
      .eq("patient_id", patientId)
      .eq("active", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("task_completions")
      .select("task_id")
      .eq("patient_id", patientId)
      .eq("done_on", todayString),
    supabase
      .from("medications")
      .select("name, dose, rule, times")
      .eq("patient_id", patientId)
      .eq("active", true),
    supabase
      .from("mood_entries")
      .select("mood, note, recorded_at")
      .eq("patient_id", patientId)
      .gte("recorded_at", since)
      .order("recorded_at", { ascending: false })
      .limit(5),
    supabase
      .from("health_readings")
      .select("kind, value, value_secondary, recorded_at")
      .eq("patient_id", patientId)
      .gte("recorded_at", since)
      .order("recorded_at", { ascending: false })
      .limit(12),
    supabase
      .from("care_notes")
      .select("body")
      .eq("patient_id", patientId)
      .order("sort_order", { ascending: true }),
  ]);

  const taskList = (tasks.data ?? []).map(
    (t) => `- ${t.label}${t.hint ? ` (${t.hint})` : ""}`,
  );
  const doneCount = (done.data ?? []).length;

  const medList = (meds.data ?? []).map((m) => {
    const times = ((m.times as string[]) ?? []).join(", ");
    return `- ${m.name}${m.dose ? ` ${m.dose}` : ""}${m.rule ? ` — ${m.rule}` : ""}${
      times ? ` — jam ${times}` : ""
    }`;
  });

  const moodList = (moods.data ?? []).map((row) => {
    const label = MOOD_WORD[row.mood as string] ?? (row.mood as string);
    const note = (row.note as string | null)?.trim();
    return `- ${label}${note ? ` — "${note}"` : ""}`;
  });

  const readingList = (readings.data ?? []).map((row) => {
    const kind = READING_WORD[row.kind as string] ?? (row.kind as string);
    const value =
      row.value_secondary !== null
        ? `${row.value}/${row.value_secondary}`
        : String(row.value);
    return `- ${kind}: ${value}`;
  });

  const noteList = (notes.data ?? []).map((n) => `- ${n.body}`);

  const section = (title: string, lines: string[], empty: string) =>
    `${title}\n${lines.length > 0 ? lines.join("\n") : empty}`;

  const system = [
    VOICE,
    GUARDRAILS,
    "KONTEKS (data nyata dari aplikasi, per hari ini):",
    `Hari ini: ${longDateLabel(today)}.`,
    `Kamu sedang berbicara dengan: ${me.fullName} (${
      me.role === "patient" ? "pasien sendiri" : "pendamping"
    }).`,
    `Pasien yang dirawat: ${patientName}.`,
    "",
    section("Tugas harian:", taskList, "- belum ada tugas harian yang diatur"),
    `Sudah dicentang hari ini: ${doneCount} dari ${taskList.length}.`,
    "",
    section("Obat aktif:", medList, "- belum ada obat terdaftar"),
    "",
    section("Catatan perasaan 7 hari terakhir:", moodList, "- belum ada catatan"),
    "",
    section("Catatan kesehatan 7 hari terakhir:", readingList, "- belum ada catatan"),
    "",
    section("Instruksi perawatan yang berlaku:", noteList, "- belum ada instruksi"),
    "",
    "Jawab hanya berdasarkan konteks di atas dan pengetahuan umum yang aman. Kalau ditanya angka atau jadwal yang tidak ada di atas, katakan belum tercatat.",
  ].join("\n");

  return {
    patientId,
    patientName,
    viewerName: me.fullName,
    viewerRole: me.role,
    system,
  };
}
