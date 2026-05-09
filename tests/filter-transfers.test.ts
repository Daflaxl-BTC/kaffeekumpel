import { describe, it, expect } from "vitest";
import { filterAndSortTransfers } from "../components/open-payments/filter-transfers";
import type { Transfer } from "../lib/settlement/calculate";

const t = (
  from: string,
  to: string,
  amount: number,
): Transfer => ({
  from_member_id: from,
  to_member_id: to,
  amount_cents: amount,
});

describe("filterAndSortTransfers", () => {
  it("filtert nicht-involvierte Transfers raus", () => {
    const all = [t("a", "b", 100), t("c", "d", 200)];
    expect(filterAndSortTransfers(all, "a")).toEqual([t("a", "b", 100)]);
  });

  it("Empfänger-Transfers vor Schuldner-Transfers", () => {
    const all = [t("anna", "felix", 50), t("felix", "tom", 100)];
    const sorted = filterAndSortTransfers(all, "felix");
    // felix bekommt 50 (von anna) → kommt zuerst, obwohl Betrag kleiner
    expect(sorted[0]).toEqual(t("anna", "felix", 50));
    expect(sorted[1]).toEqual(t("felix", "tom", 100));
  });

  it("innerhalb gleicher Richtung absteigend nach Betrag", () => {
    const all = [
      t("anna", "felix", 50),
      t("bob", "felix", 200),
      t("felix", "tom", 30),
      t("felix", "carl", 80),
    ];
    const sorted = filterAndSortTransfers(all, "felix");
    expect(sorted.map((x) => x.amount_cents)).toEqual([200, 50, 80, 30]);
  });

  it("0-Beträge werden gefiltert", () => {
    const all = [t("a", "b", 0), t("a", "b", 100)];
    expect(filterAndSortTransfers(all, "a")).toEqual([t("a", "b", 100)]);
  });
});
