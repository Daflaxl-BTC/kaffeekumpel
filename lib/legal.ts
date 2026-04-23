/**
 * Zentrale Quelle der Wahrheit für Impressum-/Datenschutz-Angaben.
 * Werte kommen aus Umgebungsvariablen (Vercel Project Settings → Environment),
 * damit kein Privatname im Git-History landet.
 *
 * Fehlende Pflichtfelder werden als sichtbares Platzhalter-Warn-String
 * gerendert — fällt im Review sofort auf und verhindert stillen Launch
 * mit leerem Impressum.
 */

const MISSING = "⚠ BITTE IN VERCEL-ENV AUSFÜLLEN";

export interface LegalInfo {
  name: string;
  address: string;
  email: string;
  phone: string | null;
  usesAnthropic: boolean;
}

export function legalInfo(): LegalInfo {
  return {
    name: process.env.IMPRESSUM_NAME?.trim() || MISSING,
    address: process.env.IMPRESSUM_ADDRESS?.trim() || MISSING,
    email: process.env.IMPRESSUM_EMAIL?.trim() || "felix.bredl@gmail.com",
    phone: process.env.IMPRESSUM_PHONE?.trim() || null,
    usesAnthropic: Boolean(process.env.ANTHROPIC_API_KEY?.trim()),
  };
}
