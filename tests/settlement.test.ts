import { describe, it, expect } from "vitest";
import {
  calculateBalances,
  minimizeTransfers,
  computeSettlement,
} from "../lib/settlement/calculate";

describe("calculateBalances", () => {
  it("leerer Fall: alle bei 0", () => {
    const b = calculateBalances([], 30, ["a", "b"]);
    expect(b).toEqual([
      { member_id: "a", balance_cents: 0 },
      { member_id: "b", balance_cents: 0 },
    ]);
  });

  it("Kaffee kostet den Trinker", () => {
    const b = calculateBalances(
      [{ member_id: "a", type: "coffee" }, { member_id: "a", type: "coffee" }],
      30,
      ["a", "b"],
    );
    expect(b.find((x) => x.member_id === "a")?.balance_cents).toBe(-60);
    expect(b.find((x) => x.member_id === "b")?.balance_cents).toBe(0);
  });

  it("Einkauf macht den Käufer Gläubiger", () => {
    const b = calculateBalances(
      [{ member_id: "b", type: "purchase", cost_cents: 1299 }],
      30,
      ["a", "b"],
    );
    expect(b.find((x) => x.member_id === "b")?.balance_cents).toBe(1299);
  });

  it("cleaning + kostenloses refill sind kostenneutral", () => {
    const b = calculateBalances(
      [
        { member_id: "a", type: "cleaning" },
        { member_id: "a", type: "refill" },
      ],
      30,
      ["a"],
    );
    expect(b[0].balance_cents).toBe(0);
  });

  it("refill mit Kosten wirkt wie purchase", () => {
    const b = calculateBalances(
      [{ member_id: "a", type: "refill", cost_cents: 499 }],
      30,
      ["a"],
    );
    expect(b[0].balance_cents).toBe(499);
  });
});

describe("minimizeTransfers", () => {
  it("3 Personen: größter Schuldner → größter Gläubiger", () => {
    const t = minimizeTransfers([
      { member_id: "a", balance_cents: 300 },
      { member_id: "b", balance_cents: -200 },
      { member_id: "c", balance_cents: -100 },
    ]);
    expect(t).toHaveLength(2);
    // Summe aller abs Transfers == Summe aller |Salden| / 2
    const total = t.reduce((s, x) => s + x.amount_cents, 0);
    expect(total).toBe(300);
    // a empfängt alles
    const toA = t.filter((x) => x.to_member_id === "a");
    expect(toA.reduce((s, x) => s + x.amount_cents, 0)).toBe(300);
  });

  it("Ausgeglichener Fall: keine Transfers", () => {
    const t = minimizeTransfers([
      { member_id: "a", balance_cents: 0 },
      { member_id: "b", balance_cents: 0 },
    ]);
    expect(t).toEqual([]);
  });

  it("Summen-Property: Schuldner zahlen = Gläubiger empfangen", () => {
    const balances = [
      { member_id: "a", balance_cents: 450 },
      { member_id: "b", balance_cents: -200 },
      { member_id: "c", balance_cents: -250 },
    ];
    const t = minimizeTransfers(balances);
    const outflow = new Map<string, number>();
    const inflow = new Map<string, number>();
    for (const x of t) {
      outflow.set(x.from_member_id, (outflow.get(x.from_member_id) ?? 0) + x.amount_cents);
      inflow.set(x.to_member_id, (inflow.get(x.to_member_id) ?? 0) + x.amount_cents);
    }
    expect(outflow.get("b")).toBe(200);
    expect(outflow.get("c")).toBe(250);
    expect(inflow.get("a")).toBe(450);
  });
});

describe("computeSettlement (end-to-end)", () => {
  it("Classic-WG-Szenario", () => {
    const events = [
      // Felix kauft Bohnen für 12,99 €
      { member_id: "felix", type: "purchase" as const, cost_cents: 1299 },
      // Felix trinkt 3 Kaffee
      ...Array.from({ length: 3 }, () => ({ member_id: "felix", type: "coffee" as const })),
      // Anna trinkt 10 Kaffee
      ...Array.from({ length: 10 }, () => ({ member_id: "anna", type: "coffee" as const })),
      // Tom trinkt 5 Kaffee
      ...Array.from({ length: 5 }, () => ({ member_id: "tom", type: "coffee" as const })),
    ];

    const { balances, transfers } = computeSettlement(events, 30, [
      "felix",
      "anna",
      "tom",
    ]);

    const bfelix = balances.find((b) => b.member_id === "felix")!;
    const banna = balances.find((b) => b.member_id === "anna")!;
    const btom = balances.find((b) => b.member_id === "tom")!;

    // Felix: 1299 - 3*30 = 1209
    expect(bfelix.balance_cents).toBe(1209);
    // Anna: -10*30 = -300
    expect(banna.balance_cents).toBe(-300);
    // Tom: -5*30 = -150
    expect(btom.balance_cents).toBe(-150);

    // Summe muss 1299 - 18*30 = 1299 - 540 = 759 sein  (Felix hat mehr gekauft als verbraucht)
    const sum = balances.reduce((s, b) => s + b.balance_cents, 0);
    expect(sum).toBe(759);
    // Felix kriegt mehr als er trank: fairer "Schuldner zahlt Gläubiger" funktioniert nicht mehr 1:1 weil es einen Überschuss gibt.
    // minimizeTransfers korrigiert Felix' balance auf 450 (entspricht Annas 300 + Toms 150).
    expect(transfers.reduce((s, t) => s + t.amount_cents, 0)).toBe(450);
  });
});
