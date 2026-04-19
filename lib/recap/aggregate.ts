/**
 * Aggregiert alle Rohdaten für einen Recap aus Supabase in ein
 * vollständig gefülltes `RecapInput` – bis auf die von Claude zu liefernden
 * Felder `headline_title`, `fun_fact` und `members[].personal_comment`,
 * die `generate.ts` danach dranhängt.
 *
 * Ablauf:
 *   1) Zeitraum aus `period + ref` ableiten (Monat oder Jahr).
 *   2) Events + Mitglieder + Gruppe laden.
 *   3) Statistiken, Archetypen, Transfers berechnen.
 *   4) Tages-Serie aufbauen (lückenlos – auch Tage ohne Kaffee).
 *   5) QR als data:-URL erzeugen.
 */

import QRCode from "qrcode";
import { supabaseService } from "@/lib/supabase/server";
import { computeSettlement } from "@/lib/settlement/calculate";
import {
  buildPaypalMeLink,
  isValidPaypalHandle,
} from "@/lib/settlement/paypal";
import type {
  MemberArchetype,
  RecapDailyPoint,
  RecapInput,
  RecapMember,
  RecapPeriod,
  RecapTransfer,
} from "./types";

export interface BuildRecapOpts {
  slug: string;
  period: RecapPeriod;
  /**
   * Referenz für den Zeitraum:
   *   - Monat: "YYYY-MM" (z.B. "2026-03")
   *   - Jahr:  "YYYY"    (z.B. "2025")
   */
  ref: string;
  /** Basis-URL der App, für den QR-Code-Link */
  appUrl: string;
}

// ---------------------------------------------------------------------------
// Periode
// ---------------------------------------------------------------------------

const MONTH_LABELS_DE = [
  "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember",
];

function parsePeriod(period: RecapPeriod, ref: string): {
  from: Date;
  to: Date;
  label_de: string;
  short_label_de: string;
} {
  if (period === "month") {
    const m = /^(\d{4})-(\d{2})$/.exec(ref);
    if (!m) throw new Error(`Ungültige ref für period=month: "${ref}" (erwartet YYYY-MM)`);
    const year = parseInt(m[1], 10);
    const monthIdx = parseInt(m[2], 10) - 1;
    if (monthIdx < 0 || monthIdx > 11) throw new Error(`Ungültiger Monat: ${ref}`);
    const from = new Date(Date.UTC(year, monthIdx, 1));
    const to = new Date(Date.UTC(year, monthIdx + 1, 1));
    const label = `${MONTH_LABELS_DE[monthIdx]} ${year}`;
    return { from, to, label_de: label, short_label_de: MONTH_LABELS_DE[monthIdx] };
  }
  const m = /^(\d{4})$/.exec(ref);
  if (!m) throw new Error(`Ungültige ref für period=year: "${ref}" (erwartet YYYY)`);
  const year = parseInt(m[1], 10);
  const from = new Date(Date.UTC(year, 0, 1));
  const to = new Date(Date.UTC(year + 1, 0, 1));
  return { from, to, label_de: `Jahr ${year}`, short_label_de: String(year) };
}

function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function buildDailySeries(
  events: Array<{ created_at: string; type: string }>,
  from: Date,
  to: Date,
): RecapDailyPoint[] {
  const bucket = new Map<string, number>();
  for (const e of events) {
    if (e.type !== "coffee") continue;
    const day = e.created_at.slice(0, 10);
    bucket.set(day, (bucket.get(day) ?? 0) + 1);
  }
  const out: RecapDailyPoint[] = [];
  const cursor = new Date(from);
  while (cursor < to) {
    const day = isoDay(cursor);
    out.push({ date: day, coffees: bucket.get(day) ?? 0 });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return out;
}

/**
 * Längste Serie aufeinanderfolgender 0-Kaffee-Tage.
 */
function longestQuietStreak(daily: RecapDailyPoint[]): number {
  let best = 0;
  let cur = 0;
  for (const d of daily) {
    if (d.coffees === 0) {
      cur++;
      if (cur > best) best = cur;
    } else {
      cur = 0;
    }
  }
  return best;
}

// ---------------------------------------------------------------------------
// Archetyp-Zuordnung
// ---------------------------------------------------------------------------

function classifyArchetype(args: {
  coffees: number;
  spend_cents: number;
  avgCoffees: number;
  medianCoffees: number;
  spendP75: number;
  daysActiveInPeriod: number;
  totalPeriodDays: number;
}): MemberArchetype {
  const { coffees, spend_cents, avgCoffees, medianCoffees, spendP75,
    daysActiveInPeriod, totalPeriodDays } = args;

  // "new": created_at erst in der zweiten Hälfte des Zeitraums
  if (totalPeriodDays > 0 && daysActiveInPeriod < totalPeriodDays * 0.2) {
    return "new";
  }
  if (coffees === 0) return "abstinent";
  if (coffees <= 2) return "ghost";

  // Supply-Hero: hat überdurchschnittlich eingekauft UND weniger getrunken als Median
  if (spend_cents >= spendP75 && spendP75 > 0 && coffees < medianCoffees) {
    return "supply_hero";
  }

  if (avgCoffees <= 0) return "steady";
  const ratio = coffees / avgCoffees;
  if (ratio >= 1.75) return "heavy";
  if (ratio >= 0.7) return "steady";
  if (ratio >= 0.15) return "light";
  return "ghost";
}

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor(p * sorted.length));
  return sorted[idx];
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

// ---------------------------------------------------------------------------
// Haupt-Funktion
// ---------------------------------------------------------------------------

export async function buildRecapInput(opts: BuildRecapOpts): Promise<RecapInput> {
  const { slug, period, ref, appUrl } = opts;
  const { from, to, label_de, short_label_de } = parsePeriod(period, ref);
  const totalPeriodDays = Math.round(
    (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24),
  );

  const sb = supabaseService();

  const { data: group } = await sb
    .from("groups")
    .select("id, slug, name, coffee_price_cents, currency")
    .eq("slug", slug)
    .single();
  if (!group) throw new Error(`Gruppe mit Slug "${slug}" nicht gefunden`);

  const [{ data: members }, { data: events }] = await Promise.all([
    sb
      .from("members")
      .select("id, name, paypal_handle, created_at")
      .eq("group_id", group.id)
      .eq("active", true)
      .order("created_at", { ascending: true }),
    sb
      .from("events")
      .select("id, member_id, type, cost_cents, created_at")
      .eq("group_id", group.id)
      .gte("created_at", from.toISOString())
      .lt("created_at", to.toISOString())
      .order("created_at", { ascending: true }),
  ]);

  const memberList = members ?? [];
  const eventList = events ?? [];

  // Per-Mitglied: Tassen + Ausgaben
  const coffeesByMember = new Map<string, number>();
  const spendByMember = new Map<string, number>();
  for (const e of eventList) {
    if (e.type === "coffee") {
      coffeesByMember.set(e.member_id, (coffeesByMember.get(e.member_id) ?? 0) + 1);
    } else if (e.type === "purchase" || (e.type === "refill" && e.cost_cents)) {
      const cost = e.cost_cents ?? 0;
      if (cost > 0) {
        spendByMember.set(e.member_id, (spendByMember.get(e.member_id) ?? 0) + cost);
      }
    }
  }

  const coffeeValues = memberList.map((m) => coffeesByMember.get(m.id) ?? 0);
  const spendValues = memberList.map((m) => spendByMember.get(m.id) ?? 0);
  const activeDrinkers = coffeeValues.filter((c) => c > 0);
  const avgCoffees =
    activeDrinkers.length > 0
      ? activeDrinkers.reduce((a, b) => a + b, 0) / activeDrinkers.length
      : 0;
  const medCoffees = median(coffeeValues);
  const spendP75 = percentile(spendValues, 0.75);

  const recapMembers: RecapMember[] = memberList.map((m) => {
    const coffees = coffeesByMember.get(m.id) ?? 0;
    const spend_cents = spendByMember.get(m.id) ?? 0;
    const createdAt = m.created_at ? new Date(m.created_at) : from;
    const effectiveStart = createdAt > from ? createdAt : from;
    const daysActive = Math.max(
      0,
      Math.round((to.getTime() - effectiveStart.getTime()) / (1000 * 60 * 60 * 24)),
    );
    const archetype = classifyArchetype({
      coffees,
      spend_cents,
      avgCoffees,
      medianCoffees: medCoffees,
      spendP75,
      daysActiveInPeriod: daysActive,
      totalPeriodDays,
    });
    return {
      id: m.id,
      name: m.name,
      coffees,
      spend_cents,
      avatar_initial: (m.name?.[0] ?? "?").toUpperCase(),
      archetype,
    };
  });

  // Tages-Serie
  const daily = buildDailySeries(
    eventList.map((e) => ({ created_at: e.created_at, type: e.type })),
    from,
    to,
  );

  // Stats
  const totalCoffees = coffeeValues.reduce((a, b) => a + b, 0);
  const totalSpend = spendValues.reduce((a, b) => a + b, 0);
  const avgPrice =
    totalCoffees > 0 ? Math.round(totalSpend / totalCoffees) : 0;
  const peakDay =
    daily.reduce<RecapDailyPoint | null>(
      (best, d) => (!best || d.coffees > best.coffees ? d : best),
      null,
    );

  const topDrinker =
    recapMembers.reduce<RecapMember | null>(
      (best, m) => (!best || m.coffees > best.coffees ? m : best),
      null,
    ) ?? null;
  const topBuyer =
    recapMembers.reduce<RecapMember | null>(
      (best, m) => (!best || m.spend_cents > best.spend_cents ? m : best),
      null,
    ) ?? null;

  // Settlement (nur für den Zeitraum)
  const memberNameById = new Map(memberList.map((m) => [m.id, m.name]));
  const paypalById = new Map(memberList.map((m) => [m.id, m.paypal_handle]));
  const { transfers } = computeSettlement(
    eventList.map((e) => ({
      member_id: e.member_id,
      type: e.type,
      cost_cents: e.cost_cents,
    })),
    group.coffee_price_cents,
    memberList.map((m) => m.id),
  );

  const currency = (group.currency ?? "EUR") as RecapInput["group"]["currency"];

  const recapTransfers: RecapTransfer[] = transfers.map((t) => {
    const toHandle = paypalById.get(t.to_member_id);
    const paypal_url =
      toHandle && isValidPaypalHandle(toHandle)
        ? buildPaypalMeLink({
            handle: toHandle,
            amount_cents: t.amount_cents,
            currency,
          })
        : null;
    return {
      from_name: memberNameById.get(t.from_member_id) ?? "?",
      to_name: memberNameById.get(t.to_member_id) ?? "?",
      amount_cents: t.amount_cents,
      paypal_url,
    };
  });

  // QR-Code als data URL
  const groupUrl = `${appUrl.replace(/\/+$/, "")}/g/${slug}`;
  const qrBuffer = await QRCode.toBuffer(groupUrl, {
    errorCorrectionLevel: "H",
    type: "png",
    width: 360,
    margin: 1,
    color: { dark: "#2E1D10", light: "#FAF6F1" },
  });
  const qrDataUrl = `data:image/png;base64,${qrBuffer.toString("base64")}`;

  const recap: RecapInput = {
    group: {
      name: group.name,
      slug: group.slug,
      coffee_price_cents: group.coffee_price_cents,
      currency,
    },
    period: {
      type: period,
      from: isoDay(from),
      to: isoDay(to),
      label_de,
      short_label_de,
    },
    stats: {
      total_coffees: totalCoffees,
      total_spend_cents: totalSpend,
      avg_price_cents: avgPrice,
      top_drinker: topDrinker && topDrinker.coffees > 0 ? topDrinker : null,
      top_buyer: topBuyer && topBuyer.spend_cents > 0 ? topBuyer : null,
      peak_day: peakDay && peakDay.coffees > 0 ? peakDay : null,
      quietest_streak_days: longestQuietStreak(daily),
    },
    members: recapMembers,
    transfers: recapTransfers,
    daily,
    headline_title: "", // wird von generate.ts gefüllt
    fun_fact: "",       // wird von generate.ts gefüllt
    qr_data_url: qrDataUrl,
    group_url: groupUrl,
  };

  return recap;
}
