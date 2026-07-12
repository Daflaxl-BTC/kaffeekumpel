/**
 * Settlement-Kernlogik — geteilt von Web-Actions und /api/v1-Routes.
 * Nutzt die reine Rechenlogik aus lib/settlement/* (nur dünn hier exponiert).
 */

import { supabaseService } from "@/lib/supabase/server";
import { computeSettlement } from "@/lib/settlement/calculate";
import { buildPaypalMeLink } from "@/lib/settlement/paypal";
import type { SessionPayload } from "@/lib/auth/session";
import { ApiError } from "@/lib/api/http";
import type { GroupRow, MemberRow, EventRow, SettlementSnapshot } from "@/lib/api/types";

async function loadGroupAndPeriod(slug: string) {
  const sb = supabaseService();
  const { data: groupRaw } = await sb
    .from("groups")
    .select("id, slug, coffee_price_cents, currency, created_at")
    .eq("slug", slug)
    .single();
  if (!groupRaw) throw new ApiError(404, "group_not_found", "Gruppe nicht gefunden");
  const group = groupRaw as Pick<GroupRow, "id" | "slug" | "coffee_price_cents" | "currency" | "created_at">;

  const { data: lastSettlement } = await sb
    .from("settlements")
    .select("covered_to")
    .eq("group_id", group.id)
    .order("finalized_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const coveredFrom = lastSettlement ? new Date(lastSettlement.covered_to) : new Date(group.created_at);
  return { sb, group, coveredFrom };
}

/** Lesezustand des aktuellen Abrechnungszeitraums — spiegelt settlement/page.tsx. */
export async function getSettlementSnapshot(session: SessionPayload): Promise<SettlementSnapshot> {
  const { sb, group, coveredFrom } = await loadGroupAndPeriod(session.slug);

  const [{ data: members }, { data: events }] = await Promise.all([
    sb.from("members").select("*").eq("group_id", group.id).eq("active", true),
    sb.from("events").select("*").eq("group_id", group.id).gt("created_at", coveredFrom.toISOString()),
  ]);

  const memberList = (members ?? []) as MemberRow[];
  const eventList = (events ?? []) as EventRow[];

  const { balances, transfers } = computeSettlement(
    eventList.map((e) => ({ member_id: e.member_id, type: e.type, cost_cents: e.cost_cents })),
    group.coffee_price_cents,
    memberList.map((m) => m.id),
  );

  const byId = new Map(memberList.map((m) => [m.id, m]));
  const isAdmin = byId.get(session.member_id)?.role === "admin";

  return {
    covered_from: coveredFrom.toISOString(),
    balances: balances.map((b) => ({ ...b, name: byId.get(b.member_id)?.name ?? "?" })),
    transfers: transfers.map((t) => {
      const to = byId.get(t.to_member_id);
      const paypalReady = to?.paypal_handle;
      return {
        ...t,
        from_name: byId.get(t.from_member_id)?.name ?? "?",
        to_name: to?.name ?? "?",
        paypal_url: paypalReady
          ? buildPaypalMeLink({ handle: to!.paypal_handle!, amount_cents: t.amount_cents, currency: group.currency })
          : null,
      };
    }),
    is_admin: isAdmin,
  };
}

/** Schließt den aktuellen Zeitraum ab (nur Admin). */
export async function finalizeSettlementCore(session: SessionPayload): Promise<{ settlement_id: string; transfers: number }> {
  const { sb, group, coveredFrom } = await loadGroupAndPeriod(session.slug);

  const { data: me } = await sb.from("members").select("role").eq("id", session.member_id).single();
  if (me?.role !== "admin") throw new ApiError(403, "forbidden", "Nur Admins dürfen abrechnen");

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

  const memberIds = ((members ?? []) as { id: string }[]).map((m) => m.id);
  const eventList = ((events ?? []) as Pick<EventRow, "member_id" | "type" | "cost_cents">[]).map((e) => ({
    member_id: e.member_id,
    type: e.type,
    cost_cents: e.cost_cents,
  }));

  const { transfers } = computeSettlement(eventList, group.coffee_price_cents, memberIds);

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
  if (sErr || !settlement) throw new ApiError(500, "settlement_failed", sErr?.message ?? "Settlement fehlgeschlagen");

  if (transfers.length > 0) {
    const { error: dErr } = await sb.from("debts").insert(
      transfers.map((t) => ({
        settlement_id: settlement.id,
        from_member_id: t.from_member_id,
        to_member_id: t.to_member_id,
        amount_cents: t.amount_cents,
      })),
    );
    if (dErr) throw new ApiError(500, "db_error", dErr.message);
  }

  return { settlement_id: settlement.id, transfers: transfers.length };
}

/** Markiert eine Schuld als bezahlt — nur der Schuldner selbst. */
export async function markDebtPaidCore(session: SessionPayload, debtId: string): Promise<void> {
  const sb = supabaseService();
  const { error } = await sb
    .from("debts")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("id", debtId)
    .eq("from_member_id", session.member_id);
  if (error) throw new ApiError(500, "db_error", error.message);
}
