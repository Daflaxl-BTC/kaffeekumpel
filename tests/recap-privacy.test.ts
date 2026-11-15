import { describe, it, expect } from "vitest";
import {
  NAME_PLACEHOLDER,
  buildGroupUserMessage,
  buildMemberUserMessage,
  insertMemberName,
} from "../lib/recap/prompts";
import type { RecapInput } from "../lib/recap/types";

// Datenminimierung beim Monatsrückblick: Weder Personen- noch Gruppennamen
// dürfen an die Anthropic-API gehen (Datenschutzerklärung, Abschnitt Rückblick).

describe("Rückblick ohne Namen", () => {
  it("persönliche Nachricht enthält keinen Namen", () => {
    const msg = buildMemberUserMessage(
      { archetype: "steady", coffees: 12, spend_cents: 450 },
      10,
      40,
      "März 2026",
    );
    expect(msg).not.toContain("Anna");
    expect(JSON.parse(msg)).not.toHaveProperty("name");
  });

  it("Gruppennachricht enthält keinen Gruppennamen", () => {
    const input = {
      group: { name: "WG Anna und Bernd", slug: "H3K7QP", coffee_price_cents: 30, currency: "EUR" },
      members: [],
      period: { label_de: "März 2026", short_label_de: "März" },
      stats: {
        total_coffees: 0,
        total_spend_cents: 0,
        avg_price_cents: 0,
        top_drinker: null,
        top_buyer: null,
        peak_day: null,
        quietest_streak_days: 0,
      },
      daily: [],
    } as unknown as RecapInput;
    const msg = buildGroupUserMessage(input);
    expect(msg).not.toContain("Anna");
    expect(msg).not.toContain("WG");
  });

  it("der Name wird erst nach der Antwort eingesetzt", () => {
    const antwort = `${NAME_PLACEHOLDER}, 12 Tassen im März. Solide.`;
    expect(insertMemberName(antwort, "Anna")).toBe("Anna, 12 Tassen im März. Solide.");
  });
});
