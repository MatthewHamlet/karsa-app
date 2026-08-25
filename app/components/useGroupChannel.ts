"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "../lib/supabase/client";
import { isSupabaseConfigured } from "../lib/supabase/config";


export type Typist = { id: string; name: string; initial: string; color: string };


const TYPING_TTL = 3000;

const PING_EVERY = 1200;


export function useGroupChannel({
  groupId,
  me,
  onChange,
}: {
  groupId: string | null;

  me: Typist | null;

  onChange: () => void;
}) {
  const [typists, setTypists] = useState<Typist[]>([]);


  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const meRef = useRef(me);
  meRef.current = me;


  const seen = useRef(new Map<string, { at: number; who: Typist }>());
  const send = useRef<((event: "typing" | "stopped", who: Typist) => void) | null>(null);
  const lastPing = useRef(0);

  useEffect(() => {
    if (!isSupabaseConfigured() || !groupId) {
      setTypists([]);
      return;
    }

    const supabase = createClient();
    const channel = supabase.channel(`group:${groupId}`, {
      config: { broadcast: { self: false } },
    });

    channel
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "community_group_messages",
          filter: `group_id=eq.${groupId}`,
        },
        () => {

          onChangeRef.current();
        },
      )
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        const who = payload as Typist;
        if (!who?.id) return;
        seen.current.set(who.id, { at: Date.now(), who });
        setTypists([...seen.current.values()].map((entry) => entry.who));
      })
      .on("broadcast", { event: "stopped" }, ({ payload }) => {
        const who = payload as { id?: string };
        if (!who?.id) return;
        seen.current.delete(who.id);
        setTypists([...seen.current.values()].map((entry) => entry.who));
      })
      .subscribe();

    send.current = (event, who) => {
      channel.send({ type: "broadcast", event, payload: who });
    };


    const sweep = window.setInterval(() => {
      const cutoff = Date.now() - TYPING_TTL;
      let changed = false;
      for (const [id, entry] of seen.current) {
        if (entry.at < cutoff) {
          seen.current.delete(id);
          changed = true;
        }
      }
      if (changed) setTypists([...seen.current.values()].map((entry) => entry.who));
    }, 1000);

    return () => {
      window.clearInterval(sweep);
      send.current = null;
      seen.current.clear();
      setTypists([]);

      supabase.removeChannel(channel);
    };
  }, [groupId]);


  const notifyTyping = useCallback(() => {
    const who = meRef.current;
    if (!who || !send.current) return;

    const now = Date.now();
    if (now - lastPing.current < PING_EVERY) return;
    lastPing.current = now;
    send.current("typing", who);
  }, []);


  const notifyStopped = useCallback(() => {
    const who = meRef.current;
    if (!who || !send.current) return;

    lastPing.current = 0;
    send.current("stopped", who);
  }, []);

  return { typists, notifyTyping, notifyStopped };
}
