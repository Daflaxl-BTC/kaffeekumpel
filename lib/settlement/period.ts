/**
 * Server-Helper: aktuelle Abrechnungs-Periode einer Gruppe.
 *
 * Single Source of Truth für /g/[slug] und /g/[slug]/settlement —
 * beide Seiten müssen dieselben Salden & Transfers sehen, sonst gibt es
 * subtile Inkonsistenzen ("Überweisungs-Modal sagt 5,20 €, Stand sagt 5,30 €").
 *
 * Verhalten 1:1 zur bisherigen settlement/page.tsx:
 *   - Period startet beim letzten Settlement (`covered_to`) oder bei
 *     `group.created_at`, wenn noch nie abgerechnet wurde.
 *   - `computeSettlement` läuft nur über aktive Mitglieder (eq active=true) —
 *     identisch zum aktuellen Stand. Salden inaktiver Mitglieder werden
 *     nicht in der UI gezeigt.
 *   - `allMembers` (inkl. inaktive) wird zusätzlich geladen, damit ein
 *     Transfer, der einen mittlerweile inaktiven User involvieren könnte,
 *     trotzdem mit Namen aufgelöst werden kann.
 */

import { supabaseService } from "@/lib/supabase/server";
import {
  computeSettlement,
  type MemberBalance,
  type Transfer,
} from "@/lib/settlement/calculate";

export interface PeriodMember {
  id: string;
  name: string;
  paypal_handle: string | null;
  active: boolean;
  role: string;
  created_at: string;
}

export interface PeriodGroup {
  id: string;
  slug: string;
  name: string;
  currency: string;
  coffee_price_cents: number;
  cleaning_interval_days: number;
  created_at: string;
}

export interface PeriodData {
  group: PeriodGroup;
  coveredFrom: Date;
  members: PeriodMember[]; // nur aktive — UI-Listen
  allMembers: PeriodMember[]; // inkl. inaktive — Lookup für Transfers
  balances: MemberBalance[];
  transfers: Transfer[];
}

export class GroupNotFoundError extends Error {
  constructor(slug: string) {
    super(`Gruppe nicht gefunden: ${slug}`);
    this.name = "GroupNotFoundError";
  }
}

export async function getCurrentPeriodData(slug: string): Promise<PeriodData> {
  const sb = supabaseService();

  const { data: group } = await sb
    .from("groups")
    .select(
      "id, slug, name, currency, coffee_price_cents, cleaning_interval_days, created_at",
    )
    .eq("slug", slug)
    .single();
  if (!group) throw new GroupNotFoundError(slug);

  const { data: lastSettlement } = await sb
    .from("settlements")
    .select("finalized_at, covered_to")
    .eq("group_id", group.id)
    .order("finalized_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const coveredFrom = lastSettlement
    ? new Date(lastSettlement.covered_to)
    : new Date(group.created_at);

  const [{ data: allMembersData }, { data: events }] = await Promise.all([
    sb
      .from("members")
      .select("id, name, paypal_handle, active, role, created_at")
      .eq("group_id", group.id)
      .order("created_at", { ascending: true }),
    sb
      .from("events")
      .select("member_id, type, cost_cents")
      .eq("group_id", group.id)
      .gt("created_at", coveredFrom.toISOString()),
  ]);

  const allMembers: PeriodMember[] = allMembersData ?? [];
  const members = allMembers.filter((m) => m.active);
  const eventList = events ?? [];

  const { balances, transfers } = computeSettlement(
    eventList.map((e) => ({
      member_id: e.member_id,
      type: e.type as "coffee" | "cleaning" | "refill" | "purchase",
      cost_cents: e.cost_cents,
    })),
    group.coffee_price_cents,
    members.map((m) => m.id),
  );

  return {
    group,
    coveredFrom,
    members,
    allMembers,
    balances,
    transfers,
  };
}
