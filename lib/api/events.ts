/**
 * Event-Kernlogik — bündelt tapEvent (coffee/cleaning/refill) und addPurchase
 * (purchase mit Produkt-Upsert). Geteilt von Web-Actions und /api/v1-Routes.
 */

import { z } from "zod";
import { supabaseService } from "@/lib/supabase/server";
import type { SessionPayload } from "@/lib/auth/session";
import { ApiError } from "@/lib/api/http";

export const EventInputSchema = z.discriminatedUnion("type", [
  z.object({ type: z.enum(["coffee", "cleaning", "refill"]) }),
  z.object({
    type: z.literal("purchase"),
    productName: z.string().min(1).max(60),
    amountEuro: z.coerce.number().min(0.01).max(10000),
    note: z.string().max(200).optional(),
  }),
]);
export type EventInput = z.infer<typeof EventInputSchema>;

export async function createEvent(session: SessionPayload, input: EventInput): Promise<void> {
  const sb = supabaseService();

  if (input.type !== "purchase") {
    const { error } = await sb.from("events").insert({
      group_id: session.group_id,
      member_id: session.member_id,
      type: input.type,
    });
    if (error) throw new ApiError(500, "db_error", error.message);
    return;
  }

  // Produkt per (group_id + name) upserten
  const { data: existing } = await sb
    .from("products")
    .select("id")
    .eq("group_id", session.group_id)
    .eq("name", input.productName)
    .maybeSingle();

  let productId = existing?.id ?? null;
  if (!productId) {
    const { data: created, error: pErr } = await sb
      .from("products")
      .insert({ group_id: session.group_id, name: input.productName })
      .select("id")
      .single();
    if (pErr || !created) throw new ApiError(500, "db_error", pErr?.message ?? "Produkt-Anlage fehlgeschlagen");
    productId = created.id;
  }

  const cost_cents = Math.round(input.amountEuro * 100);
  const { error } = await sb.from("events").insert({
    group_id: session.group_id,
    member_id: session.member_id,
    type: "purchase",
    product_id: productId,
    cost_cents,
    note: input.note ?? null,
  });
  if (error) throw new ApiError(500, "db_error", error.message);
}
