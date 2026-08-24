import { cache } from "react";
import { createClient } from "../supabase/server";
import { isSupabaseConfigured } from "../supabase/config";
import { MONTHS_SHORT, calendarDayOf } from "../care/time";

export type ScanMedicine = {
  id: string;
  name: string;
  dose: string;
  rule: string;
  times: string[];
};

export type ScannedPrescription = {
  id: string;
  clinic: string;
  doctor: string;
  date: string;
  status: "aktif" | "selesai";
  medicines: ScanMedicine[];
  imageUrl: string | null;
};

export const getPrescriptions = cache(
  async (patientId: string, limit = 20): Promise<ScannedPrescription[]> => {
    if (!isSupabaseConfigured() || !patientId) return [];

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("prescriptions")
      .select("id, clinic, doctor, image_path, scanned_at")
      .eq("patient_id", patientId)
      .order("scanned_at", { ascending: false })
      .limit(limit);

    if (error || !data || data.length === 0) return [];

    const ids = data.map((row) => row.id as string);
    const { data: meds } = await supabase
      .from("medications")
      .select("id, prescription_id, name, dose, rule, times, active")
      .in("prescription_id", ids);

    const byPrescription = new Map<string, ScanMedicine[]>();
    const activeBy = new Map<string, boolean>();

    for (const row of meds ?? []) {
      const key = row.prescription_id as string;
      byPrescription.set(key, [
        ...(byPrescription.get(key) ?? []),
        {
          id: row.id as string,
          name: row.name as string,
          dose: (row.dose as string) ?? "",
          rule: (row.rule as string) ?? "",
          times: (row.times as string[]) ?? [],
        },
      ]);
      if (row.active) activeBy.set(key, true);
    }

    const paths = data
      .map((row) => row.image_path as string | null)
      .filter((path): path is string => Boolean(path));

    const signed = new Map<string, string>();
    if (paths.length > 0) {
      const { data: urls } = await supabase.storage
        .from("prescriptions")
        .createSignedUrls(paths, 3600);
      paths.forEach((path, i) => {
        const url = urls?.[i]?.signedUrl;
        if (url) signed.set(path, url);
      });
    }

    return data.map((row) => {
      const id = row.id as string;
      const day = calendarDayOf(row.scanned_at as string);
      const path = row.image_path as string | null;
      return {
        id,
        clinic: (row.clinic as string) || "Tanpa nama klinik",
        doctor: (row.doctor as string) || "",
        date: `${day.d} ${MONTHS_SHORT[day.m]} ${day.y}`,
        status: activeBy.get(id) ? ("aktif" as const) : ("selesai" as const),
        medicines: byPrescription.get(id) ?? [],
        imageUrl: path ? (signed.get(path) ?? null) : null,
      };
    });
  },
);
