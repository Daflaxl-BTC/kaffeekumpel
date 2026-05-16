"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { supabaseService } from "@/lib/supabase/server";
import { readSessionCookie, setSessionCookie } from "@/lib/auth/session";
import {
  normalizePaypalHandle,
  isValidPaypalHandle,
} from "@/lib/settlement/paypal";

const Schema = z.object({
  name: z.string().min(1).max(50),
  email: z.string().email().optional().or(z.literal("")),
  paypalHandle: z.string().max(40).optional().or(z.literal("")),
});

export async function saveProfile(
  slug: string,
  input: { name: string; email: string; paypalHandle: string },
) {
  const parsed = Schema.parse(input);

  const handle = parsed.paypalHandle
    ? normalizePaypalHandle(parsed.paypalHandle)
    : "";
  if (handle && !isValidPaypalHandle(handle)) {
    throw new Error(
      "Ungültiger PayPal-Handle (nur Buchstaben/Zahlen, max 20).",
    );
  }

  const session = await readSessionCookie(slug);
  if (!session) throw new Error("Keine Session");

  const sb = supabaseService();
  const { error } = await sb
    .from("members")
    .update({
      name: parsed.name,
      email: parsed.email || null,
      paypal_handle: handle || null,
    })
    .eq("id", session.member_id);
  if (error) throw new Error(error.message);

  await setSessionCookie({ ...session, name: parsed.name });

  revalidatePath(`/g/${slug}`);
  revalidatePath(`/g/${slug}/profile`);
}
