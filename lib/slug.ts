/**
 * Crockford Base32 Slug-Generator.
 *
 * Warum Crockford? Es lässt Ziffern/Buchstaben aus, die auf Holzschild-Gravur
 * leicht verwechselbar sind: 0/O, 1/I/L, 8/B. Außerdem case-insensitive dekodierbar.
 *
 * 6 Zeichen → 32^6 = 1.073.741.824 mögliche Slugs. Für 100k Gruppen: Kollisions-
 * Wahrscheinlichkeit (Geburtstag) ≈ 0.5% — wir prüfen beim Anlegen auf Unique
 * und reroll'n notfalls.
 */

const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"; // Kein I, L, O, U
const LEN = 6;

export function generateSlug(): string {
  const out = new Array<string>(LEN);
  // node:crypto oder Web-Crypto je nach Runtime
  const random =
    typeof crypto !== "undefined" && "getRandomValues" in crypto
      ? (size: number) => {
          const arr = new Uint8Array(size);
          crypto.getRandomValues(arr);
          return arr;
        }
      : // eslint-disable-next-line @typescript-eslint/no-require-imports
        (size: number) => new Uint8Array(require("crypto").randomBytes(size));

  const bytes = random(LEN);
  for (let i = 0; i < LEN; i++) {
    out[i] = ALPHABET[bytes[i] % 32];
  }
  return out.join("");
}

/**
 * Normalisiert einen User-Input: Case-insensitive, I→1, L→1, O→0.
 */
export function normalizeSlug(input: string): string {
  return input
    .toUpperCase()
    .replace(/[IL]/g, "1")
    .replace(/O/g, "0")
    .replace(/[^0-9A-HJKMNP-TV-Z]/g, "");
}

export function isValidSlug(s: string): boolean {
  if (s.length !== LEN) return false;
  for (const c of s) if (!ALPHABET.includes(c)) return false;
  return true;
}
