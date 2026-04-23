import { NextResponse, type NextRequest } from "next/server";
import { SignJWT } from "jose";
import { readSessionCookie } from "@/lib/auth/session";
import { checkRateLimit } from "@/lib/rate-limit";

/**
 * Gibt ein kurzlebiges JWT (HS256, 1h) zurück, mit dem der Browser-Realtime-
 * Client seinen Channel authentisieren kann. Die events-RLS-Policy liest
 * `app_metadata.group_ids` aus dem JWT und lässt nur Updates passen, die
 * zu einer dieser Gruppen gehören.
 *
 * Ohne gültiges Session-Cookie → 401. Ohne SUPABASE_JWT_SECRET → 500.
 *
 * Rate-Limit: 6 Requests pro Minute pro IP (in-memory, Best-Effort pro
 * Lambda-Instanz). Kein harter DoS-Schutz, nur ein Bremspedal gegen
 * aus-Versehen-Loops im Browser.
 */

export const runtime = "nodejs";

const TOKEN_TTL_SECONDS = 60 * 60; // 1h

function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

function jwtSecret(): Uint8Array {
  const secret = process.env.SUPABASE_JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "SUPABASE_JWT_SECRET fehlt oder zu kurz. Holen aus Supabase Dashboard → Settings → API → JWT Secret.",
    );
  }
  return new TextEncoder().encode(secret);
}

export async function GET(req: NextRequest) {
  const ip = clientIp(req);
  const rl = checkRateLimit({
    key: `realtime-token:${ip}`,
    max: 6,
    windowMs: 60_000,
  });
  if (rl.limited) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const session = await readSessionCookie();
  if (!session) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  let secret: Uint8Array;
  try {
    secret = jwtSecret();
  } catch (err) {
    console.error("[realtime-token] signing secret missing:", err);
    return NextResponse.json({ error: "misconfigured" }, { status: 500 });
  }

  const nowSec = Math.floor(Date.now() / 1000);
  const token = await new SignJWT({
    role: "authenticated",
    app_metadata: { group_ids: [session.group_id] },
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(session.member_id)
    .setAudience("authenticated")
    .setIssuer("supabase")
    .setIssuedAt(nowSec)
    .setExpirationTime(nowSec + TOKEN_TTL_SECONDS)
    .sign(secret);

  return NextResponse.json(
    { token, expires_in: TOKEN_TTL_SECONDS },
    {
      headers: {
        "Cache-Control": "private, no-store",
      },
    },
  );
}
