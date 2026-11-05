// Crockford Base32 Alphabet für Slugs (ohne 0, O, 1, I, L zur Vermeidung von Verwechslungen)
const CROCKFORD_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

/**
 * Validiert, dass ein Slug dem Crockford Base32 Standard entspricht.
 */
function isValidCrockfordSlug(slug: string): boolean {
  if (!slug || slug.length !== 6) return false;
  return /^[0123456789ABCDEFGHJKMNPQRSTVWXYZ]{6}$/.test(slug.toUpperCase());
}

/**
 * Generiert einen 6-stelligen Crockford Base32 Slug.
 * Wirft Error bei ungültiger Generierung (für Retry-Logik in actions.ts).
 */
export function generateSlug(): string {
  try {
    // 6 Zeichen * ~5.32 Bits pro Zeichen = ~32 Bits Entropie
    const randomValues = new Uint8Array(4);
    crypto.getRandomValues(randomValues);

    const num = new DataView(randomValues.buffer).getUint32(0);
    let slug = '';

    let temp = num;
    for (let i = 0; i < 6; i++) {
      slug = CROCKFORD_ALPHABET[temp % 32] + slug;
      temp = Math.floor(temp / 32);
    }

    // Defensive Validierung
    if (!isValidCrockfordSlug(slug)) {
      throw new Error(`Generated slug '${slug}' failed validation`);
    }

    return slug;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Slug generation failed: ${message}`);
  }
}

/**
 * Dekodiert einen Crockford Base32 Slug zu einer Dezimalzahl (für Debugging).
 */
export function decodeSlug(slug: string): number {
  if (!isValidCrockfordSlug(slug)) {
    throw new Error(`Invalid slug format: '${slug}'`);
  }

  let num = 0;
  for (const char of slug.toUpperCase()) {
    const index = CROCKFORD_ALPHABET.indexOf(char);
    if (index === -1) {
      throw new Error(`Invalid character in slug: '${char}'`);
    }
    num = num * 32 + index;
  }

  return num;
}
