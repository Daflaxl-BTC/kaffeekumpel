/**
 * In-Memory-Rate-Limit, Best-Effort pro Lambda-Instanz.
 *
 * Bewusst kein Redis/Upstash: für unser Volumen (einige 100 Req/Tag)
 * und unsere Threat-Model (dämliche Bots, Loop-Bugs) reicht das.
 * Bei Serverless-Cold-Starts verteilt Vercel Requests über mehrere
 * Instanzen — ein echter Angreifer umgeht das ohnehin. Für ernsthaften
 * DoS-Schutz bräuchten wir Edge-Middleware + Vercel Edge Config oder
 * Upstash Ratelimit.
 */

import { headers } from "next/headers";

type Bucket = { count: number; windowStart: number };
const buckets = new Map<string, Bucket>();

export interface RateLimitOptions {
  /** Key, der die Ratenkappung identifiziert (z. B. IP, IP+action). */
  key: string;
  /** Wie viele Requests im Fenster erlaubt sind. */
  max: number;
  /** Fensterbreite in Millisekunden. */
  windowMs: number;
}

export interface RateLimitResult {
  limited: boolean;
  remaining: number;
  resetInMs: number;
}

export function checkRateLimit(opts: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(opts.key);
  if (!bucket || now - bucket.windowStart > opts.windowMs) {
    buckets.set(opts.key, { count: 1, windowStart: now });
    return {
      limited: false,
      remaining: opts.max - 1,
      resetInMs: opts.windowMs,
    };
  }
  bucket.count += 1;
  return {
    limited: bucket.count > opts.max,
    remaining: Math.max(0, opts.max - bucket.count),
    resetInMs: opts.windowMs - (now - bucket.windowStart),
  };
}

/**
 * Liest die Client-IP aus Next.js Request-Headers.
 * Fallback auf "unknown", damit der Rate-Limit auch hinter unbekannten
 * Proxies greift (alle Requests ohne x-forwarded-for landen im gleichen
 * Bucket — bewusst konservativ).
 */
export async function clientIpFromHeaders(): Promise<string> {
  const h = await headers();
  const fwd = h.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return h.get("x-real-ip") ?? "unknown";
}
