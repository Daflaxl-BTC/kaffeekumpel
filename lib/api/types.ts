/**
 * DB-Row- und API-Response-Typen für den JSON-Layer.
 * Der Supabase-Client ist untypisiert (`select("*")` → any), deshalb casten
 * wir die Rows hier in explizite Formen — das ist zugleich der Vertrag, gegen
 * den die native iOS-App dekodiert.
 */

import type { EventType, MemberBalance, Transfer } from "@/lib/settlement/calculate";
import type { CleaningStatus } from "@/lib/cleaning";

export interface GroupRow {
  id: string;
  slug: string;
  name: string;
  coffee_price_cents: number;
  currency: "EUR" | "CHF" | "USD" | "GBP";
  cleaning_interval_days: number;
  created_at: string;
}

export interface MemberRow {
  id: string;
  group_id: string;
  name: string;
  email: string | null;
  paypal_handle: string | null;
  role: "admin" | "member";
  active: boolean;
  created_at: string;
  last_seen_at: string;
}

export interface EventRow {
  id: string;
  group_id: string;
  member_id: string;
  type: EventType;
  product_id: string | null;
  cost_cents: number | null;
  note: string | null;
  created_at: string;
}

export interface ProductRow {
  id: string;
  group_id: string;
  name: string;
  created_at: string;
}

/** Öffentliches Mitglied (ohne PII) — für Join-Liste. */
export interface PublicMember {
  id: string;
  name: string;
  role: "admin" | "member";
}

export interface GroupSnapshot {
  group: {
    slug: string;
    name: string;
    coffee_price_cents: number;
    currency: GroupRow["currency"];
    cleaning_interval_days: number;
  };
  me: { member_id: string; name: string };
  members: PublicMember[];
  events: EventRow[];
  products: ProductRow[];
  balances: MemberBalance[];
  cleaning: CleaningStatus;
}

export interface SettlementTransfer extends Transfer {
  from_name: string;
  to_name: string;
  /** paypal.me-Deep-Link, falls Empfänger einen Handle hinterlegt hat. */
  paypal_url: string | null;
}

export interface SettlementSnapshot {
  covered_from: string;
  balances: (MemberBalance & { name: string })[];
  transfers: SettlementTransfer[];
  is_admin: boolean;
}
