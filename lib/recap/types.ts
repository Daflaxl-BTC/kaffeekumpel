/**
 * Datenformen für den PDF-Recap (Monat oder Jahr).
 *
 * Die `RecapInput`-Struktur ist die fertig aggregierte Eingabe, die
 * sowohl ins HTML-Template als auch in die Claude-API-Prompts fließt.
 *
 * Beträge immer in Cents (Integer). Keine Floats.
 */

export type RecapPeriod = "month" | "year";

/**
 * Archetyp eines Mitglieds, deterministisch aus Zahlen abgeleitet.
 * Wird Claude als Label mitgegeben, damit die Kommentar-Tonlage
 * konsistent und statistisch begründet ist — statt das Modell
 * frei raten zu lassen, ob jemand "viel" trinkt.
 */
export type MemberArchetype =
  | "heavy"        // >= 1.75× Gruppen-Durchschnitt
  | "steady"       // 0.7× .. 1.75× Durchschnitt
  | "light"        // 0.15× .. 0.7×
  | "ghost"        // 1..2 Tassen im Zeitraum
  | "abstinent"    // 0 Tassen
  | "supply_hero"  // spend_cents im top 25% UND coffees unter Median
  | "new";         // hat im Zeitraum weniger als 20% der Periode dabei gewesen (created_at)

export interface RecapMember {
  id: string;
  name: string;
  coffees: number;
  spend_cents: number; // eigene Einkäufe/Refills, die dieses Mitglied bezahlt hat
  avatar_initial: string;
  archetype: MemberArchetype;
  /** Dynamisch generiert via Claude – gefüllt von generate.ts */
  personal_comment?: string;
}

export interface RecapTransfer {
  from_name: string;
  to_name: string;
  amount_cents: number;
  paypal_url?: string | null;
}

export interface RecapDailyPoint {
  date: string; // ISO "2026-03-14"
  coffees: number;
}

export interface RecapInput {
  group: {
    name: string;
    slug: string;
    coffee_price_cents: number;
    currency: "EUR" | "CHF" | "USD" | "GBP";
  };
  period: {
    type: RecapPeriod;
    /** ISO Start (inkl.), z.B. "2026-03-01" */
    from: string;
    /** ISO Ende (exkl.), z.B. "2026-04-01" */
    to: string;
    /** Menschenlesbar, z.B. "März 2026" oder "Jahr 2025" */
    label_de: string;
    /** Nur der Monat/das Jahr – Nutzung in Titeln, z.B. "März" oder "2025" */
    short_label_de: string;
  };

  stats: {
    total_coffees: number;
    total_spend_cents: number;
    avg_price_cents: number;
    top_drinker: RecapMember | null;
    top_buyer: RecapMember | null;
    peak_day: RecapDailyPoint | null;
    quietest_streak_days: number;
  };

  members: RecapMember[];
  transfers: RecapTransfer[];
  daily: RecapDailyPoint[];

  /** Dynamisch generiert via Claude */
  headline_title: string;
  fun_fact: string;

  /** Data-URL eines PNG-QR-Codes */
  qr_data_url: string;
  group_url: string;
}
