"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { supabaseService } from "@/lib/supabase/server";
import { readSessionCookie } from "@/lib/auth/session";
import { computeSettlement } from "@/lib/settlement/calculate";

const FinalizeSchema = z.object({
  slug: z.string().min(6).max(6),
});

export async function finalizeSettlement(formData: FormData) {
  const input = FinalizeSchema.parse({ slug: formData.get("slug") });
  const session = await readSessionCookie(input.slug);
  if (!session) throw new Error("Nicht eingeloggt");

  const sb = supabaseService();

  const { data: me } = await sb
    .from("members")
    .select("role")
    .eq("id", session.member_id)
    .single();
  if (me?.role !== "admin") throw new Error("Nur Admins dürfen abrechnen");

  const { data: group } = await sb
    .from("groups")
    .select("id, coffee_price_cents, created_at")
    .eq("slug", input.slug)
    .single();
  if (!group) throw new Error("Gruppe nicht gefunden");

  const { data: lastSettlement } = await sb
    .from("settlements")
    .select("covered_to")
    .eq("group_id", group.id)
    .order("finalized_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const coveredFrom = lastSettlement
    ? new Date(lastSettlement.covered_to)
    : new Date(group.created_at);
  const coveredTo = new Date();

  const [{ data: members }, { data: events }] = await Promise.all([
    sb.from("members").select("id").eq("group_id", group.id),
    sb
      .from("events")
      .select("member_id, type, cost_cents")
      .eq("group_id", group.id)
      .gt("created_at", coveredFrom.toISOString())
      .lte("created_at", coveredTo.toISOString()),
  ]);

  const memberIds = (members ?? []).map((m) => m.id);
  const eventList = (events ?? []).map((e) => ({
    member_id: e.member_id,
    type: e.type as "coffee" | "cleaning" | "refill" | "purchase",
    cost_cents: e.cost_cents,
  }));

  const { transfers } = computeSettlement(
    eventList,
    group.coffee_price_cents,
    memberIds,
  );

  const { data: settlement, error: sErr } = await sb
    .from("settlements")
    .insert({
      group_id: group.id,
      finalized_by_id: session.member_id,
      covered_from: coveredFrom.toISOString(),
      covered_to: coveredTo.toISOString(),
    })
    .select("id")
    .single();
  if (sErr || !settlement) throw new Error(sErr?.message ?? "Settlement failed");

  if (transfers.length > 0) {
    const { error: dErr } = await sb.from("debts").insert(
      transfers.map((t) => ({
        settlement_id: settlement.id,
        from_member_id: t.from_member_id,
        to_member_id: t.to_member_id,
        amount_cents: t.amount_cents,
      })),
    );
    if (dErr) throw new Error(dErr.message);
  }

  revalidatePath(`/g/${input.slug}/settlement`);
  revalidatePath(`/g/${input.slug}`);
}

const MarkPaidSchema = z.object({
  slug: z.string().min(6).max(6),
  debtId: z.string().uuid(),
});

export async function markDebtAsPaid(formData: FormData) {
  const input = MarkPaidSchema.parse({
    slug: formData.get("slug"),
    debtId: formData.get("debtId"),
  });
  const session = await readSessionCookie(input.slug);
  if (!session) throw new Error("Nicht eingeloggt");

  const sb = supabaseService();
  const { error } = await sb
    .from("debts")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("id", input.debtId)
    .eq("from_member_id", session.member_id);
  if (error) throw new Error(error.message);

  revalidatePath(`/g/${input.slug}/settlement`);
}
