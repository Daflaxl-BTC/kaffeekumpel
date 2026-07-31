/**
 * Sicherheits-Helper für die Recap-Route.
 *
 *   - validateRef:        Eingangs-Validierung für ?ref (Defense-in-Depth
 *                         zur regex-Prüfung in aggregate.ts).
 *   - sanitizeErrorMsg:   Verhindert, dass interne Pfade, Stack-Traces oder
 *                         Library-Namen ans Frontend leaken (z. B.
 *                         "/tmp/chromium", "libnss3.so", DB-Keys).
 *   - rateLimit:          Simple In-Memory-Drossel pro (slug, IP) – schützt
 *                         Claude-Token-Budget und Lambda-Kosten gegen
 *                         versehentliche Loop-Klicks oder Skript-Kiddies.
 *                         Im Lambda-Kontext lebt der Counter pro Instanz;
 *                         das ist absichtlich pragmatisch und kein DDoS-
 *                         Schutz – dafür sitzt Vercel/Cloudflare davor.
 */

const REF_MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;
const REF_YEAR = /^\d{4}$/;

export function validateRef(period: "month" | "year", ref: string): boolean {
  if (typeof ref !== "string" || ref.length > 7) return false;
  return period === "month" ? REF_MONTH.test(ref) : REF_YEAR.test(ref);
}

/**
 * Liefert eine Fehlermeldung, die dem User im Toast angezeigt werden darf,
 * ohne interne Details (Pfade, Lib-Namen, Stack-Frames, Keys) zu leaken.
 */
export function sanitizeErrorMsg(stage: "aggregate" | "render"): string {
  if (stage === "aggregate") {
    return "Wir konnten die Daten für diesen Zeitraum gerade nicht zusammenstellen. Versuch es in ein paar Minuten erneut.";
  }
  return "Das PDF konnte gerade nicht erzeugt werden. Versuch es in ein paar Minuten erneut – wenn's wieder passiert, melde dich.";
}

// ---------------------------------------------------------------------------
// Rate-Limit
// ---------------------------------------------------------------------------

interface Bucket {
  count: number;
  windowStart: number;
}

const RATE_WINDOW_MS = 60_000; // 1 Minute
const RATE_MAX = 5; // 5 Recaps pro Minute pro (slug, IP)

const buckets = new Map<string, Bucket>();

export function rateLimit(key: string, now = Date.now()): {
  ok: boolean;
  retryAfterSec: number;
} {
  // Best-effort GC: alte Buckets aufräumen, damit die Map nicht wächst.
  if (buckets.size > 1000) {
    for (const [k, b] of buckets) {
      if (now - b.windowStart > RATE_WINDOW_MS) buckets.delete(k);
    }
  }
  const b = buckets.get(key);
  if (!b || now - b.windowStart > RATE_WINDOW_MS) {
    buckets.set(key, { count: 1, windowStart: now });
    return { ok: true, retryAfterSec: 0 };
  }
  if (b.count >= RATE_MAX) {
    const retryAfterSec = Math.max(
      1,
      Math.ceil((RATE_WINDOW_MS - (now - b.windowStart)) / 1000),
    );
    return { ok: false, retryAfterSec };
  }
  b.count += 1;
  return { ok: true, retryAfterSec: 0 };
}

/**
 * Holt die Client-IP best-effort aus den Standard-Proxy-Headern. Nur für
 * Rate-Limit-Schlüssel-Bildung gedacht – für Auth-Entscheidungen NICHT
 * geeignet, da spoofbar.
 */
export function clientIpFromHeaders(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return headers.get("x-real-ip") ?? "unknown";
}
