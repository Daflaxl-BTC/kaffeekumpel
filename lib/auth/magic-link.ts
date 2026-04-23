/**
 * Magic-Link für Cross-Device-Login.
 *
 * Flow:
 *  1. Mitglied klickt auf Profil "Per E-Mail auf anderes Gerät übertragen".
 *  2. Wir signieren ein kurzlebiges (30min) JWT `{ kind: "magic", member_id, group_id, slug }`
 *     mit SESSION_SECRET und mailen den Link /g/<slug>/magic?t=<jwt>.
 *  3. Neues Gerät öffnet den Link → /g/<slug>/magic-Route verifiziert das JWT,
 *     setzt das reguläre Session-Cookie und leitet in die Gruppe weiter.
 *
 * Wir benutzen `jose` (bereits verwendet für Session-Cookie) — ein Secret weniger.
 * Das kind-Claim verhindert, dass jemand ein Session-JWT als Magic-Link wiederverwendet.
 */

import { SignJWT, jwtVerify } from "jose";

const MAGIC_TTL_SECONDS = 30 * 60; // 30 Minuten

interface MagicPayload {
  kind: "magic";
  group_id: string;
  slug: string;
  member_id: string;
  name: string;
}

function secretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET fehlt oder zu kurz (min. 32).");
  }
  return new TextEncoder().encode(secret);
}

export async function signMagicToken(
  payload: Omit<MagicPayload, "kind">,
): Promise<string> {
  return await new SignJWT({ ...payload, kind: "magic" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAGIC_TTL_SECONDS}s`)
    .sign(secretKey());
}

export async function verifyMagicToken(
  token: string,
): Promise<MagicPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    const p = payload as unknown as MagicPayload;
    if (p.kind !== "magic") return null;
    if (!p.group_id || !p.slug || !p.member_id) return null;
    return p;
  } catch {
    return null;
  }
}
