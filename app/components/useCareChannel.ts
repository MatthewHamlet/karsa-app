"use client";

import { useEffect, useRef } from "react";
import { createClient } from "../lib/supabase/client";
import { isSupabaseConfigured } from "../lib/supabase/config";

type CareTable = "care_messages" | "care_relationships";

export function useCareChannel(
  patientId: string | null,
  onChange: () => void,
  table: CareTable = "care_messages",
) {
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  });

  useEffect(() => {
    if (!isSupabaseConfigured() || !patientId) return;

    const supabase = createClient();
    const channel = supabase.channel(`care:${table}:${patientId}`);

    channel
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table,
          filter: `patient_id=eq.${patientId}`,
        },
        () => onChangeRef.current(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [patientId, table]);
}
