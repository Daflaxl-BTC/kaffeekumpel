/**
 * Server-Client mit service_role-Key.
 * NIEMALS in Client-Komponenten oder per Client-Action ausliefern.
 * RLS wird mit diesem Client bypassed — also wirklich nur im Server-Kontext nutzen.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

/**
 * URL, über die der Server Supabase erreicht. Auf Hetzner zeigt
 * SUPABASE_INTERNAL_URL direkt auf Kong im Docker-Netz (http://kong:8000);
 * nach außen gibt Caddy nur /realtime/v1 frei. Ohne die Variable (Vercel)
 * gilt wie bisher NEXT_PUBLIC_SUPABASE_URL.
 */
export function supabaseServerUrl(env: Record<string, string | undefined> = process.env): string | undefined {
  const internal = env.SUPABASE_INTERNAL_URL?.trim();
  return internal ? internal : env.NEXT_PUBLIC_SUPABASE_URL;
}

export function supabaseService(): SupabaseClient {
  if (cached) return cached;

  const url = supabaseServerUrl();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL oder SUPABASE_SERVICE_ROLE_KEY fehlt in .env.local",
    );
  }

  cached = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
