"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { supabaseService } from "@/lib/supabase/server";
import { readSessionCookie, setSessionCookie } from "@/lib/auth/session";
import { normalizePaypalHandle, isValidPaypalHandle } from "@/lib/settlement/paypal";

const Schema = z.object({
  slug: z.string().min(6).max(6),
  name: z.string().min(1).max(50),
  email: z.string().email().optional().or(z.literal("")),
  paypalHandle: z.string().max(40).optional().or(z.literal("")),
});

export async function saveProfile(formData: FormData) {
  const input = Schema.parse({
    slug: formData.get("slug"),
    name: formData.get("name"),
    email: formData.get("email") ?? "",
    paypalHandle: formData.get("paypalHandle") ?? "",
  });

  const session = await readSessionCookie(input.slug);
  if (!session) throw new Error("Keine Session");

  const handle = input.paypalHandle ? normalizePaypalHandle(input.paypalHandle) : "";
  if (handle && !isValidPaypalHandle(handle)) {
    throw new Error("Ungültiger PayPal-Handle (nur Buchstaben/Zahlen, max 20).");
  }

  const sb = supabaseService();
  const { error } = await sb
    .from("members")
    .update({
      name: input.name,
      email: input.email || null,
      paypal_handle: handle || null,
    })
    .eq("id", session.member_id);
  if (error) throw new Error(error.message);

  await setSessionCookie({ ...session, name: input.name });

  revalidatePath(`/g/${input.slug}`);
  revalidatePath(`/g/${input.slug}/profile`);
}
