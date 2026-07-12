/**
 * Gemeinsame Helfer für den JSON-API-Layer (`/api/v1/*`).
 *
 * Auth-Modell: Die native App schickt `Authorization: Bearer <jwt>` — dasselbe
 * slug-scoped HS256-JWT, das die Website als HttpOnly-Cookie nutzt (siehe
 * lib/auth/session.ts). `requireSession` akzeptiert beide Wege: Bearer zuerst,
 * sonst Cookie. So teilen Web und App exakt eine Auth-Logik.
 */

import { NextResponse } from "next/server";
import { verifySession, readSessionCookie, type SessionPayload } from "@/lib/auth/session";

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message?: string,
  ) {
    super(message ?? code);
  }
}

function bearerFromHeader(req: Request): string | null {
  const header = req.headers.get("authorization");
  if (!header) return null;
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match ? match[1]!.trim() : null;
}

/**
 * Liest die Session aus Bearer-Token (App) oder Cookie (Web-Fallback).
 * `expectedSlug` erzwingt, dass das Token/Cookie zu genau dieser Gruppe gehört
 * (Cross-Group-Schutz, wie bei der Website).
 */
export async function requireSession(
  req: Request,
  expectedSlug?: string,
): Promise<SessionPayload> {
  const token = bearerFromHeader(req);
  if (token) {
    const session = await verifySession(token, expectedSlug);
    if (!session) throw new ApiError(401, "unauthenticated", "Ungültiges oder abgelaufenes Token");
    return session;
  }

  const cookieSession = await readSessionCookie(expectedSlug);
  if (!cookieSession) throw new ApiError(401, "unauthenticated", "Nicht eingeloggt");
  return cookieSession;
}

/**
 * Wie requireSession, wirft aber nicht — gibt null zurück, wenn weder gültiges
 * Bearer-Token noch Cookie vorliegt. Für Routes mit eigener 401-Antwort.
 */
export async function optionalSession(
  req: Request,
  expectedSlug?: string,
): Promise<SessionPayload | null> {
  try {
    return await requireSession(req, expectedSlug);
  } catch {
    return null;
  }
}

export function jsonOk(data: unknown, status = 200): NextResponse {
  return NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
}

export function jsonError(err: unknown): NextResponse {
  if (err instanceof ApiError) {
    return NextResponse.json(
      { error: err.code, message: err.message },
      { status: err.status },
    );
  }
  if (err instanceof Error && err.name === "ZodError") {
    return NextResponse.json(
      { error: "invalid_input", message: err.message },
      { status: 422 },
    );
  }
  const message = err instanceof Error ? err.message : "Unbekannter Fehler";
  console.error("[api] unhandled error:", message);
  return NextResponse.json({ error: "server_error", message }, { status: 500 });
}
