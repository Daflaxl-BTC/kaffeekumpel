/**
 * Browser-seitiger Supabase-Client (anon-Key), ausschließlich für Realtime-
 * Subscriptions. Schreiben darf er nicht — das blockt RLS.
 */

"use client";

import { createBrowserClient } from "@supabase/ssr";

export function supabaseBrowser() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
