/**
 * Wo läuft Kaffeekumpel? Steuert alle Texte, die vom Betriebsort abhängen
 * (Datenschutzerklärung, später Werbeaussagen wie „Server in Deutschland“).
 *
 * HOSTING_PROVIDER=hetzner setzt das Docker-Image (Dockerfile) selbst.
 * Auf Vercel ist die Variable ungesetzt → "vercel". Damit kann der
 * Datenschutztext nie „Deutschland“ versprechen, solange die Seite noch bei
 * Vercel läuft, und nie „Vercel“ nennen, sobald sie auf Hetzner läuft.
 *
 * Der Wert wird beim Build gelesen (die Datenschutzseite ist statisch).
 */

export type HostingProvider = "vercel" | "hetzner";

export function hostingProvider(value: string | undefined = process.env.HOSTING_PROVIDER): HostingProvider {
  return value?.trim().toLowerCase() === "hetzner" ? "hetzner" : "vercel";
}

export interface PrivacyHostingText {
  /** „Stand“ der Datenschutzerklärung in dieser Variante. */
  stand: string;
  /** Absätze für Abschnitt 4 „Hosting und Datenbank“. */
  paragraphs: string[];
}

const VERCEL: PrivacyHostingText = {
  stand: "15. November 2026",
  paragraphs: [
    "Die Website läuft bei der Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, USA. Die " +
      "Serverfunktionen laufen im Rechenzentrum Frankfurt am Main. Beim Aufruf verarbeitet Vercel " +
      "technisch notwendige Zugriffsdaten wie IP-Adresse, Zeitpunkt, aufgerufene Adresse und " +
      "Browserangaben, um die Seite auszuliefern und vor Angriffen zu schützen (Art. 6 Abs. 1 lit. f " +
      "DSGVO). Diese Protokolle bewahrt Vercel nur kurzfristig für Betrieb und Sicherheit auf.",
    "Die Daten der Gruppen liegen in einer Datenbank der Supabase Inc. auf Servern in Frankfurt am " +
      "Main (Region eu-central-1). Für die Live-Aktualisierung der Strichliste verbindet sich euer " +
      "Browser direkt mit Supabase; dabei sieht Supabase eure IP-Adresse.",
    "Beide Anbieter arbeiten als Auftragsverarbeiter nach Art. 28 DSGVO. Weil beide Unternehmen " +
      "ihren Sitz in den USA haben, ist ein Zugriff aus den USA nicht ausgeschlossen. Grundlage dafür " +
      "ist der Angemessenheitsbeschluss zum EU-US Data Privacy Framework, soweit der Anbieter dort " +
      "zertifiziert ist, sonst die EU-Standardvertragsklauseln (Art. 46 Abs. 2 lit. c DSGVO).",
  ],
};

// Muss zu Caddyfile (kein `log`-Block → kein Zugriffsprotokoll) und
// scripts/hetzner/backup.sh (KEEP_DAYS=14) passen. Wer dort etwas ändert,
// ändert diesen Text mit.
const HETZNER: PrivacyHostingText = {
  stand: "17. November 2026",
  paragraphs: [
    "Website und Datenbank laufen auf einem eigenen Server, den wir bei der Hetzner Online GmbH, " +
      "Industriestr. 25, 91710 Gunzenhausen, Deutschland, mieten. Der Server steht in einem " +
      "Rechenzentrum in Deutschland. Beim Aufruf verarbeitet der Server technisch notwendige " +
      "Zugriffsdaten wie IP-Adresse, Zeitpunkt, aufgerufene Adresse und Browserangaben, um die Seite " +
      "auszuliefern und vor Angriffen zu schützen (Art. 6 Abs. 1 lit. f DSGVO). Ein Zugriffsprotokoll " +
      "mit IP-Adressen führen wir nicht.",
    "Die Daten der Gruppen liegen in einer Datenbank auf demselben Server. Wir betreiben sie selbst " +
      "mit der quelloffenen Software Supabase; die Supabase Inc. hat darauf keinen Zugriff. Für die " +
      "Live-Aktualisierung der Strichliste verbindet sich euer Browser direkt mit diesem Server.",
    "Hetzner arbeitet als Auftragsverarbeiter nach Art. 28 DSGVO. Für Hosting und Datenbank " +
      "übermitteln wir keine Daten in Länder außerhalb der EU. Sicherungskopien der Datenbank " +
      "erstellen wir jede Nacht und bewahren sie 14 Tage auf, ebenfalls in Deutschland. Löschen wir " +
      "eine Gruppe, verschwindet sie deshalb spätestens 14 Tage später auch aus den Sicherungen.",
  ],
};

export function privacyHostingText(provider: HostingProvider = hostingProvider()): PrivacyHostingText {
  return provider === "hetzner" ? HETZNER : VERCEL;
}
