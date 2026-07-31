import { describe, expect, it } from "vitest";
import {
  clientIpFromHeaders,
  rateLimit,
  sanitizeErrorMsg,
  validateRef,
} from "@/lib/recap/guard";

describe("validateRef", () => {
  it("akzeptiert gültige Monats-Refs", () => {
    expect(validateRef("month", "2026-01")).toBe(true);
    expect(validateRef("month", "2026-12")).toBe(true);
    expect(validateRef("month", "1999-07")).toBe(true);
  });

  it("lehnt fehlerhafte Monats-Refs ab", () => {
    expect(validateRef("month", "2026-13")).toBe(false);
    expect(validateRef("month", "2026-00")).toBe(false);
    expect(validateRef("month", "2026-1")).toBe(false);
    expect(validateRef("month", "26-01")).toBe(false);
    expect(validateRef("month", "")).toBe(false);
    // Path-Traversal / Injection-Versuche
    expect(validateRef("month", "../../etc/passwd")).toBe(false);
    expect(validateRef("month", "2026-01;rm -rf")).toBe(false);
    expect(validateRef("month", "2026")).toBe(false);
  });

  it("akzeptiert gültige Jahres-Refs", () => {
    expect(validateRef("year", "2025")).toBe(true);
    expect(validateRef("year", "1999")).toBe(true);
  });

  it("lehnt fehlerhafte Jahres-Refs ab", () => {
    expect(validateRef("year", "25")).toBe(false);
    expect(validateRef("year", "2025-01")).toBe(false);
    expect(validateRef("year", "abcd")).toBe(false);
    expect(validateRef("year", "")).toBe(false);
  });

  it("kappt zu lange Eingaben", () => {
    expect(validateRef("month", "2026-01-extra")).toBe(false);
    expect(validateRef("year", "20250000")).toBe(false);
  });
});

describe("sanitizeErrorMsg", () => {
  it("leakt keine internen Pfade oder Lib-Namen", () => {
    const aggregate = sanitizeErrorMsg("aggregate");
    const render = sanitizeErrorMsg("render");
    for (const msg of [aggregate, render]) {
      expect(msg).not.toMatch(/\/tmp/);
      expect(msg).not.toMatch(/libnss3/i);
      expect(msg).not.toMatch(/chromium/i);
      expect(msg).not.toMatch(/supabase/i);
      expect(msg).not.toMatch(/error:/i);
      expect(msg.length).toBeLessThan(300);
    }
  });

  it("liefert unterschiedliche Texte je Stage", () => {
    expect(sanitizeErrorMsg("aggregate")).not.toBe(sanitizeErrorMsg("render"));
  });
});

describe("rateLimit", () => {
  it("erlaubt die ersten Anfragen und drosselt dann", () => {
    const key = `test-key-${Math.random()}`;
    const t0 = 1_000_000;
    for (let i = 0; i < 5; i++) {
      expect(rateLimit(key, t0 + i).ok).toBe(true);
    }
    const sixth = rateLimit(key, t0 + 5);
    expect(sixth.ok).toBe(false);
    expect(sixth.retryAfterSec).toBeGreaterThan(0);
    expect(sixth.retryAfterSec).toBeLessThanOrEqual(60);
  });

  it("öffnet nach Ablauf des Fensters wieder", () => {
    const key = `test-key-${Math.random()}`;
    const t0 = 2_000_000;
    for (let i = 0; i < 5; i++) rateLimit(key, t0 + i);
    expect(rateLimit(key, t0 + 5).ok).toBe(false);
    // Nach 61s muss das Fenster gekippt sein
    expect(rateLimit(key, t0 + 61_000).ok).toBe(true);
  });

  it("trennt Buckets pro Schlüssel", () => {
    const a = `a-${Math.random()}`;
    const b = `b-${Math.random()}`;
    const t0 = 3_000_000;
    for (let i = 0; i < 5; i++) rateLimit(a, t0 + i);
    expect(rateLimit(a, t0 + 5).ok).toBe(false);
    expect(rateLimit(b, t0 + 5).ok).toBe(true);
  });
});

describe("clientIpFromHeaders", () => {
  it("nimmt das erste Element aus x-forwarded-for", () => {
    const h = new Headers({
      "x-forwarded-for": "203.0.113.5, 10.0.0.1, 10.0.0.2",
    });
    expect(clientIpFromHeaders(h)).toBe("203.0.113.5");
  });

  it("fällt auf x-real-ip zurück", () => {
    const h = new Headers({ "x-real-ip": "198.51.100.7" });
    expect(clientIpFromHeaders(h)).toBe("198.51.100.7");
  });

  it("liefert 'unknown' wenn nichts da ist", () => {
    expect(clientIpFromHeaders(new Headers())).toBe("unknown");
  });
});
