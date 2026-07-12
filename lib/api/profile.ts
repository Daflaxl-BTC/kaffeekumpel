/**
 * Profil-Kernlogik — geteilt von Web-Action und /api/v1-Route.
 * Gibt den (evtl. geänderten) Namen zurück, damit der Web-Aufrufer sein
 * Session-Cookie aktualisieren kann.
 */

import { z } from "zod";
import { supabaseService } from "@/lib/supabase/server";
import { normalizePaypalHandle, isValidPaypalHandle } from "@/lib/settlement/paypal";
import type { SessionPayload } from "@/lib/auth/session";
import { ApiError } from "@/lib/api/http";

export const ProfileSchema = z.object({
  name: z.string().min(1).max(50),
  email: z.string().email().optional().or(z.literal("")),
  paypalHandle: z.string().max(40).optional().or(z.literal("")),
});
export type ProfileInput = z.infer<typeof ProfileSchema>;

export async function saveProfileCore(
  session: SessionPayload,
  input: ProfileInput,
): Promise<{ name: string; paypal_handle: string | null }> {
  const parsed = ProfileSchema.parse(input);

  const handle = parsed.paypalHandle ? normalizePaypalHandle(parsed.paypalHandle) : "";
  if (handle && !isValidPaypalHandle(handle)) {
    throw new ApiError(422, "invalid_paypal_handle", "Ungültiger PayPal-Handle (nur Buchstaben/Zahlen, max 20).");
  }

  const sb = supabaseService();
  const { error } = await sb
    .from("members")
    .update({ name: parsed.name, email: parsed.email || null, paypal_handle: handle || null })
    .eq("id", session.member_id);
  if (error) throw new ApiError(500, "db_error", error.message);

  return { name: parsed.name, paypal_handle: handle || null };
}
