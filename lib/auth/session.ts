/**
 * Minimale "Session" für Kaffeekumpel.
 *
 * Statt Magic-Link/OAuth: Wir packen `{ group_id, slug, member_id }` in ein
 * HS256-JWT (via `jose`), signieren mit SESSION_SECRET, legen es als
 * HttpOnly-Cookie mit 90 Tage Ablauf. SameSite=Lax, damit QR→Scan→Beitreten
 * auf demselben Gerät funktioniert.
 *
 * Das JWT ist scoped auf den Slug — wer das Cookie auf Gruppe A klaut, kann
 * nicht Gruppe B manipulieren.
 */

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE_NAME = "kk_session";
const MAX_AGE = 60 * 60 * 24 * 90; // 90 Tage

export interface SessionPayload {
  group_id: string;
  slug: string;
  member_id: string;
  name: string;
}

function secretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    const envKeys = Object.keys(process.env).filter((k) => k.includes("SESSION")).join(",") || "none";
    throw new Error(
      `SESSION_SECRET fehlt oder zu kurz (min. 32). Gefunden: length=${secret?.length ?? "undefined"}, matching_env_keys=[${envKeys}]`,
    );
  }
  return new TextEncoder().encode(secret);
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secretKey());
}

export async function verifySession(
  token: string,
  expectedSlug?: string,
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    const session = payload as unknown as SessionPayload;
    if (expectedSlug && session.slug !== expectedSlug) return null;
    return session;
  } catch {
    return null;
  }
}

export async function setSessionCookie(payload: SessionPayload): Promise<void> {
  const token = await signSession(payload);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE,
    path: "/",
  });
}

export async function readSessionCookie(
  expectedSlug?: string,
): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySession(token, expectedSlug);
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
