/**
 * Tests für getCurrentPeriodData.
 *
 * Wir mocken `@/lib/supabase/server` per `vi.mock`, damit kein echter
 * Supabase-Client gebraucht wird. Der Mock kennt nur die Calls, die
 * `getCurrentPeriodData` tatsächlich macht — er ist nicht generisch.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";

interface Fixtures {
  groups: {
    id: string;
    slug: string;
    name: string;
    currency: string;
    coffee_price_cents: number;
    cleaning_interval_days: number;
    created_at: string;
  }[];
  settlements: {
    group_id: string;
    finalized_at: string;
    covered_to: string;
  }[];
  members: {
    id: string;
    group_id: string;
    name: string;
    paypal_handle: string | null;
    active: boolean;
    role: string;
    created_at: string;
  }[];
  events: {
    group_id: string;
    member_id: string;
    type: "coffee" | "cleaning" | "refill" | "purchase";
    cost_cents: number | null;
    created_at: string;
  }[];
}

let fixtures: Fixtures;

vi.mock("@/lib/supabase/server", () => ({
  supabaseService: () => buildMockClient(() => fixtures),
}));

// Minimaler Fluent-Builder, der genau die Aufrufkette aus period.ts beherrscht.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildMockClient(getFx: () => Fixtures): any {
  return {
    from(table: keyof Fixtures) {
      const filters: { col: string; val: unknown; op: "eq" | "gt" }[] = [];
      let orderCol: string | null = null;
      let orderAsc = true;
      let limitN: number | null = null;

      const apply = () => {
        let rows = (getFx()[table] as Record<string, unknown>[]).slice();
        for (const f of filters) {
          if (f.op === "eq") rows = rows.filter((r) => r[f.col] === f.val);
          else if (f.op === "gt")
            rows = rows.filter((r) => (r[f.col] as string) > (f.val as string));
        }
        if (orderCol) {
          const col = orderCol;
          rows.sort((a, b) => {
            const av = a[col] as string;
            const bv = b[col] as string;
            if (av === bv) return 0;
            return (av > bv ? 1 : -1) * (orderAsc ? 1 : -1);
          });
        }
        if (limitN !== null) rows = rows.slice(0, limitN);
        return rows;
      };

      const builder = {
        select() {
          return builder;
        },
        eq(col: string, val: unknown) {
          filters.push({ col, val, op: "eq" });
          return builder;
        },
        gt(col: string, val: unknown) {
          filters.push({ col, val, op: "gt" });
          return builder;
        },
        order(col: string, opts?: { ascending?: boolean }) {
          orderCol = col;
          orderAsc = opts?.ascending !== false;
          return builder;
        },
        limit(n: number) {
          limitN = n;
          return builder;
        },
        async single() {
          const rows = apply();
          return rows.length > 0
            ? { data: rows[0], error: null }
            : { data: null, error: { message: "not found" } };
        },
        async maybeSingle() {
          const rows = apply();
          return { data: rows[0] ?? null, error: null };
        },
        then(resolve: (v: { data: unknown[]; error: null }) => unknown) {
          resolve({ data: apply(), error: null });
        },
      };
      return builder;
    },
  };
}

beforeEach(() => {
  fixtures = {
    groups: [],
    settlements: [],
    members: [],
    events: [],
  };
});

async function loadHelper() {
  const mod = await import("../lib/settlement/period");
  return mod;
}

describe("getCurrentPeriodData", () => {
  it("wirft GroupNotFoundError bei unbekanntem Slug", async () => {
    const { getCurrentPeriodData, GroupNotFoundError } = await loadHelper();
    await expect(getCurrentPeriodData("DOES99")).rejects.toBeInstanceOf(
      GroupNotFoundError,
    );
  });

  it("Gruppe ohne Events: balances alle 0, transfers leer", async () => {
    fixtures.groups = [
      {
        id: "g1",
        slug: "ABC123",
        name: "Test",
        currency: "EUR",
        coffee_price_cents: 30,
        cleaning_interval_days: 7,
        created_at: "2026-01-01T00:00:00Z",
      },
    ];
    fixtures.members = [
      {
        id: "m1",
        group_id: "g1",
        name: "Anna",
        paypal_handle: null,
        active: true,
        role: "member",
        created_at: "2026-01-01T00:00:00Z",
      },
      {
        id: "m2",
        group_id: "g1",
        name: "Bob",
        paypal_handle: "bob",
        active: true,
        role: "admin",
        created_at: "2026-01-01T00:00:00Z",
      },
    ];

    const { getCurrentPeriodData } = await loadHelper();
    const period = await getCurrentPeriodData("ABC123");

    expect(period.group.id).toBe("g1");
    expect(period.members).toHaveLength(2);
    expect(period.balances.every((b) => b.balance_cents === 0)).toBe(true);
    expect(period.transfers).toEqual([]);
    expect(period.coveredFrom.toISOString()).toBe("2026-01-01T00:00:00.000Z");
  });

  it("3 Mitglieder, 5 Kaffees, 1 Kauf: erwarteter Transfer", async () => {
    fixtures.groups = [
      {
        id: "g1",
        slug: "ABC123",
        name: "Test",
        currency: "EUR",
        coffee_price_cents: 30,
        cleaning_interval_days: 7,
        created_at: "2026-01-01T00:00:00Z",
      },
    ];
    fixtures.members = ["felix", "anna", "tom"].map((id, i) => ({
      id,
      group_id: "g1",
      name: id,
      paypal_handle: id === "felix" ? "felixbredl" : null,
      active: true,
      role: i === 0 ? "admin" : "member",
      created_at: `2026-01-0${i + 1}T00:00:00Z`,
    }));
    fixtures.events = [
      {
        group_id: "g1",
        member_id: "felix",
        type: "purchase",
        cost_cents: 1299,
        created_at: "2026-04-01T10:00:00Z",
      },
      ...Array.from({ length: 3 }, (_, i) => ({
        group_id: "g1",
        member_id: "felix" as const,
        type: "coffee" as const,
        cost_cents: null,
        created_at: `2026-04-02T0${i}:00:00Z`,
      })),
      ...Array.from({ length: 5 }, (_, i) => ({
        group_id: "g1",
        member_id: "anna" as const,
        type: "coffee" as const,
        cost_cents: null,
        created_at: `2026-04-03T0${i}:00:00Z`,
      })),
    ];

    const { getCurrentPeriodData } = await loadHelper();
    const period = await getCurrentPeriodData("ABC123");

    // Felix: +1299 - 3*30 = +1209; Anna: -150; Tom: 0
    const felixB = period.balances.find((b) => b.member_id === "felix")!;
    const annaB = period.balances.find((b) => b.member_id === "anna")!;
    expect(felixB.balance_cents).toBe(1209);
    expect(annaB.balance_cents).toBe(-150);

    // Anna schuldet Felix 150 (Greedy gleicht aus, Felix' Überschuss
    // wird auf den Schuldsaldo zurechtgeschnitten).
    expect(period.transfers).toHaveLength(1);
    expect(period.transfers[0]).toEqual({
      from_member_id: "anna",
      to_member_id: "felix",
      amount_cents: 150,
    });
  });

  it("Gruppe nach Settlement: coveredFrom == letztes covered_to", async () => {
    fixtures.groups = [
      {
        id: "g1",
        slug: "ABC123",
        name: "Test",
        currency: "EUR",
        coffee_price_cents: 30,
        cleaning_interval_days: 7,
        created_at: "2026-01-01T00:00:00Z",
      },
    ];
    fixtures.settlements = [
      {
        group_id: "g1",
        finalized_at: "2026-04-30T12:00:00Z",
        covered_to: "2026-04-30T12:00:00Z",
      },
    ];
    fixtures.members = [
      {
        id: "m1",
        group_id: "g1",
        name: "Anna",
        paypal_handle: null,
        active: true,
        role: "member",
        created_at: "2026-01-01T00:00:00Z",
      },
    ];
    // Event vor dem Settlement → wird ausgefiltert (gt covered_to)
    fixtures.events = [
      {
        group_id: "g1",
        member_id: "m1",
        type: "coffee",
        cost_cents: null,
        created_at: "2026-04-01T00:00:00Z",
      },
    ];

    const { getCurrentPeriodData } = await loadHelper();
    const period = await getCurrentPeriodData("ABC123");

    expect(period.coveredFrom.toISOString()).toBe("2026-04-30T12:00:00.000Z");
    // Event vor Settlement zählt nicht — Saldo bleibt 0
    expect(period.balances[0].balance_cents).toBe(0);
  });

  it("inaktive Mitglieder: in members ausgeblendet, in allMembers enthalten", async () => {
    fixtures.groups = [
      {
        id: "g1",
        slug: "ABC123",
        name: "Test",
        currency: "EUR",
        coffee_price_cents: 30,
        cleaning_interval_days: 7,
        created_at: "2026-01-01T00:00:00Z",
      },
    ];
    fixtures.members = [
      {
        id: "m1",
        group_id: "g1",
        name: "Aktiv",
        paypal_handle: null,
        active: true,
        role: "member",
        created_at: "2026-01-01T00:00:00Z",
      },
      {
        id: "m2",
        group_id: "g1",
        name: "Inaktiv",
        paypal_handle: null,
        active: false,
        role: "member",
        created_at: "2026-01-01T00:00:00Z",
      },
    ];

    const { getCurrentPeriodData } = await loadHelper();
    const period = await getCurrentPeriodData("ABC123");

    expect(period.members.map((m) => m.id)).toEqual(["m1"]);
    expect(period.allMembers.map((m) => m.id).sort()).toEqual(["m1", "m2"]);
  });
});
