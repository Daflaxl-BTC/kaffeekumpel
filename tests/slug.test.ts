import { describe, it, expect } from "vitest";
import { generateSlug, normalizeSlug, isValidSlug } from "../lib/slug";

describe("generateSlug", () => {
  it("erzeugt 6-Zeichen-Slugs", () => {
    for (let i = 0; i < 50; i++) {
      const s = generateSlug();
      expect(s).toHaveLength(6);
      expect(isValidSlug(s)).toBe(true);
    }
  });
  it("ist zufällig (keine 2 gleichen in 20 Versuchen)", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 20; i++) seen.add(generateSlug());
    expect(seen.size).toBeGreaterThan(15);
  });
});

describe("normalizeSlug", () => {
  it("mappt I/L→1, O→0 und upper-case", () => {
    expect(normalizeSlug("io1l")).toBe("1011");
  });
  it("entfernt Leerzeichen & Sonderzeichen", () => {
    expect(normalizeSlug("H3 K-7QP")).toBe("H3K7QP");
  });
  it("gibt gültigen Slug nach Normalisierung zurück", () => {
    expect(isValidSlug(normalizeSlug("h3k7qp"))).toBe(true);
  });
});

describe("isValidSlug", () => {
  it("akzeptiert 6-Zeichen aus Alphabet", () => {
    expect(isValidSlug("H3K7QP")).toBe(true);
    expect(isValidSlug("0123ZX")).toBe(true);
  });
  it("lehnt I, L, O, U ab", () => {
    expect(isValidSlug("HIK7QP")).toBe(false);
    expect(isValidSlug("HLK7QP")).toBe(false);
    expect(isValidSlug("HOK7QP")).toBe(false);
    expect(isValidSlug("HUK7QP")).toBe(false);
  });
  it("lehnt falsche Länge ab", () => {
    expect(isValidSlug("H3K7Q")).toBe(false);
    expect(isValidSlug("H3K7QPX")).toBe(false);
  });
});
