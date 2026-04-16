/**
 * PayPal.me Deep-Link Builder.
 *
 * Warum kein echter PayPal-API-Checkout? → Wir wären Finanzdienstleister,
 * bräuchten BaFin-Registrierung, KYC, usw. Als reiner "Link-Opener" sind wir
 * ein Notizbuch, das "Felix schuldet Anna 5,20 €" sagt und dann paypal.me/anna
 * aufmacht — das ist null regulatorisches Risiko.
 *
 * Format: https://paypal.me/<HANDLE>/<BETRAG><CURRENCY>
 * Beispiel: https://paypal.me/felixbredl/5,20EUR
 *
 * PayPal akzeptiert sowohl Komma als auch Punkt als Dezimaltrenner,
 * wir nehmen Komma (deutsches Standard).
 */

const HANDLE_RE = /^[A-Za-z0-9]{1,20}$/;

export function isValidPaypalHandle(handle: string): boolean {
  return HANDLE_RE.test(handle);
}

export interface PaypalLinkInput {
  handle: string;
  amount_cents: number;
  currency?: "EUR" | "CHF" | "USD" | "GBP";
}

/**
 * Normalisiert einen Handle: entfernt Leerzeichen, führende "@" oder URL-Prefix.
 */
export function normalizePaypalHandle(input: string): string {
  return input
    .trim()
    .replace(/^https?:\/\/(www\.)?paypal\.me\//i, "")
    .replace(/^@/, "")
    .replace(/\/.*$/, "");
}

export function buildPaypalMeLink({
  handle,
  amount_cents,
  currency = "EUR",
}: PaypalLinkInput): string {
  if (!isValidPaypalHandle(handle)) {
    throw new Error(`Ungültiger PayPal-Handle: "${handle}"`);
  }
  if (!Number.isInteger(amount_cents) || amount_cents <= 0) {
    throw new Error(`Betrag muss positiv und in Cents sein: ${amount_cents}`);
  }

  const euros = Math.floor(amount_cents / 100);
  const cents = amount_cents % 100;
  const amountStr = `${euros},${cents.toString().padStart(2, "0")}`;

  return `https://paypal.me/${encodeURIComponent(handle)}/${amountStr}${currency}`;
}
