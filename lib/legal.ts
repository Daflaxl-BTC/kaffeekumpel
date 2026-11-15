/**
 * Zentrale Quelle für Impressum- und Datenschutz-Angaben.
 *
 * Name und Anschrift kommen aus Umgebungsvariablen (Hosting-Settings), damit
 * keine Privatanschrift in der öffentlichen Git-Historie landet.
 *
 * Fehlt ein Pflichtfeld, wird ein deutlich sichtbarer Warnhinweis gerendert —
 * das fällt in jeder Vorschau sofort auf und verhindert einen stillen Launch
 * mit leerem Impressum.
 */

const MISSING = "⚠ Angabe fehlt: Umgebungsvariable setzen";

export const DEFAULT_CONTACT_EMAIL = "felix.ventures.contact@proton.me";

export interface LegalInfo {
  /** z. B. "Felix Ventures, Inhaber Felix Bredl" */
  name: string;
  /** mehrzeilig, z. B. "Straße 1\n80000 München" */
  address: string;
  email: string;
  phone: string | null;
  /** USt-IdNr. nach § 27a UStG, falls vorhanden */
  vatId: string | null;
  usesAnthropic: boolean;
  /** "hetzner" = App und Datenbank selbst betrieben in Deutschland; sonst Vercel + Supabase Cloud */
  hosting: "hetzner" | "vercel";
}

export function legalInfo(): LegalInfo {
  return {
    name: process.env.IMPRESSUM_NAME?.trim() || MISSING,
    address: (process.env.IMPRESSUM_ADDRESS?.trim() || MISSING).replace(/\\n/g, "\n"),
    email: process.env.IMPRESSUM_EMAIL?.trim() || DEFAULT_CONTACT_EMAIL,
    phone: process.env.IMPRESSUM_PHONE?.trim() || null,
    vatId: process.env.IMPRESSUM_VAT_ID?.trim() || null,
    usesAnthropic: Boolean(process.env.ANTHROPIC_API_KEY?.trim()),
    hosting: process.env.HOSTING_PROVIDER?.trim() === "hetzner" ? "hetzner" : "vercel",
  };
}
