import { describe, it, expect } from "vitest";
import {
  buildPaypalMeLink,
  isValidPaypalHandle,
  normalizePaypalHandle,
} from "../lib/settlement/paypal";

describe("isValidPaypalHandle", () => {
  it("akzeptiert normale Handles", () => {
    expect(isValidPaypalHandle("felixbredl")).toBe(true);
    expect(isValidPaypalHandle("anna99")).toBe(true);
  });
  it("lehnt Sonderzeichen ab", () => {
    expect(isValidPaypalHandle("felix-bredl")).toBe(false);
    expect(isValidPaypalHandle("felix.bredl")).toBe(false);
    expect(isValidPaypalHandle("felix@bredl")).toBe(false);
  });
  it("lehnt leere / zu lange Handles ab", () => {
    expect(isValidPaypalHandle("")).toBe(false);
    expect(isValidPaypalHandle("a".repeat(21))).toBe(false);
  });
});

describe("normalizePaypalHandle", () => {
  it("entfernt paypal.me URL", () => {
    expect(normalizePaypalHandle("https://paypal.me/felixbredl")).toBe("felixbredl");
    expect(normalizePaypalHandle("http://www.paypal.me/anna99")).toBe("anna99");
  });
  it("entfernt führendes @", () => {
    expect(normalizePaypalHandle("@felix")).toBe("felix");
  });
  it("trimmt und trailt path", () => {
    expect(normalizePaypalHandle("  felixbredl/5,00EUR  ")).toBe("felixbredl");
  });
});

describe("buildPaypalMeLink", () => {
  it("baut den richtigen Link", () => {
    const url = buildPaypalMeLink({ handle: "felixbredl", amount_cents: 520 });
    expect(url).toBe("https://paypal.me/felixbredl/5,20EUR");
  });

  it("formatiert 0-Cents korrekt", () => {
    const url = buildPaypalMeLink({ handle: "anna", amount_cents: 1000 });
    expect(url).toBe("https://paypal.me/anna/10,00EUR");
  });

  it("handle wird URL-enkodiert", () => {
    // (wir lehnen invalide ohnehin ab, aber wenn durch wären…)
    expect(() => buildPaypalMeLink({ handle: "a b", amount_cents: 100 })).toThrow();
  });

  it("lehnt nicht-positive Beträge ab", () => {
    expect(() => buildPaypalMeLink({ handle: "a", amount_cents: 0 })).toThrow();
    expect(() => buildPaypalMeLink({ handle: "a", amount_cents: -5 })).toThrow();
  });

  it("respektiert Währung", () => {
    const url = buildPaypalMeLink({
      handle: "anna",
      amount_cents: 150,
      currency: "CHF",
    });
    expect(url).toBe("https://paypal.me/anna/1,50CHF");
  });
});
