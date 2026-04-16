"use client";

import { useEffect, useRef, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

interface Options {
  groupId: string;
  onInsert: (row: Record<string, unknown>) => void;
}

/**
 * Abonniert Events-Tabelle gefiltert auf die eigene Gruppe.
 * Voraussetzung: Realtime für public.events aktiviert (Migration erledigt das,
 * manche Selfhost-Stacks brauchen zusätzlich Dashboard-Schalter).
 */
export function useRealtimeEvents({ groupId, onInsert }: Options) {
  const [connected, setConnected] = useState(false);
  const onInsertRef = useRef(onInsert);
  onInsertRef.current = onInsert;

  useEffect(() => {
    const client = supabaseBrowser();
    const channel = client
      .channel(`group:${groupId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "events",
          filter: `group_id=eq.${groupId}`,
        },
        (payload) => {
          onInsertRef.current(payload.new);
        },
      )
      .subscribe((status) => {
        setConnected(status === "SUBSCRIBED");
      });

    return () => {
      client.removeChannel(channel);
    };
  }, [groupId]);

  return { connected };
}
