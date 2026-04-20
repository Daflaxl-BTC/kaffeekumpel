"use client";

import { useEffect, useRef, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

interface Options {
  groupId: string;
  onInsert: (row: Record<string, unknown>) => void;
}

// Token lebt 1h (siehe /api/realtime-token). 10 Minuten Puffer, dann neu.
const REFRESH_INTERVAL_MS = 50 * 60 * 1000;

async function fetchRealtimeToken(): Promise<string | null> {
  try {
    const res = await fetch("/api/realtime-token", {
      credentials: "include",
      cache: "no-store",
    });
    if (!res.ok) {
      console.warn("[realtime] token fetch failed", res.status, await res.text().catch(() => ""));
      return null;
    }
    const data = (await res.json()) as { token?: string };
    return data.token ?? null;
  } catch (err) {
    console.warn("[realtime] token fetch threw", err);
    return null;
  }
}

/**
 * Abonniert Events-Tabelle gefiltert auf die eigene Gruppe.
 *
 * Seit dem Security-Audit 2026-04-19 ist die events-RLS-Policy auf JWT-Claims
 * gescoped: Der Browser holt vor dem Subscribe ein kurzlebiges JWT über
 * /api/realtime-token und setzt es via `realtime.setAuth()`. Ohne Token sieht
 * die Policy keine group_ids und das Abo bleibt leer.
 *
 * Voraussetzung: Realtime für public.events ist in der Publication.
 */
export function useRealtimeEvents({ groupId, onInsert }: Options) {
  const [connected, setConnected] = useState(false);
  const onInsertRef = useRef(onInsert);
  onInsertRef.current = onInsert;

  useEffect(() => {
    const client = supabaseBrowser();
    let cancelled = false;
    let channel: ReturnType<typeof client.channel> | null = null;
    let refreshTimer: ReturnType<typeof setInterval> | null = null;

    async function start() {
      const token = await fetchRealtimeToken();
      if (cancelled) return;
      if (!token) {
        setConnected(false);
        return;
      }
      await client.realtime.setAuth(token);
      if (cancelled) return;

      channel = client
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
        .subscribe((status, err) => {
          if (status !== "SUBSCRIBED") {
            console.warn("[realtime] subscribe status", status, err);
          }
          setConnected(status === "SUBSCRIBED");
        });

      refreshTimer = setInterval(async () => {
        const fresh = await fetchRealtimeToken();
        if (cancelled || !fresh) return;
        await client.realtime.setAuth(fresh);
      }, REFRESH_INTERVAL_MS);
    }

    start();

    return () => {
      cancelled = true;
      if (refreshTimer) clearInterval(refreshTimer);
      if (channel) client.removeChannel(channel);
    };
  }, [groupId]);

  return { connected };
}
