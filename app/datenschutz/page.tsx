import type { Metadata } from "next";
import Link from "next/link";
import { legalInfo } from "@/lib/legal";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = {
  title: "Datenschutz — Kaffeekumpel",
  description:
    "Datenschutzerklärung nach Art. 13 DSGVO — welche Daten Kaffeekumpel verarbeitet und warum.",
  robots: { index: true, follow: true },
};

export default function DatenschutzPage() {
  const info = legalInfo();
  return (
    <>
      <main className="min-h-screen max-w-2xl mx-auto px-6 pt-8 pb-4">
        <Link
          href="/"
          className="text-sm text-kaffee-700 hover:underline"
        >
          ← zurück
        </Link>
        <h1 className="text-3xl font-bold text-kaffee-900 mt-2 mb-6">
          Datenschutzerklärung
        </h1>

        <section className="prose prose-sm max-w-none text-kaffee-900 space-y-4">
          <p className="text-kaffee-700">
            Stand: {new Date().toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" })}
          </p>

          <h2 className="text-lg font-semibold mt-4">
            1. Verantwortlicher
          </h2>
          <p className="whitespace-pre-line">
            {info.name}
            {"\n"}
            {info.address}
            {"\n"}
            E-Mail:{" "}
            <a className="underline" href={`mailto:${info.email}`}>
              {info.email}
            </a>
          </p>

          <h2 className="text-lg font-semibold mt-4">
            2. Welche Daten wir verarbeiten
          </h2>
          <p>Für den Betrieb von Kaffeekumpel verarbeiten wir:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>
              <strong>Gruppenname</strong> (von dir eingegeben)
            </li>
            <li>
              <strong>Dein selbstgewählter Anzeigename</strong> innerhalb der
              Gruppe (kein Klarname erforderlich)
            </li>
            <li>
              <strong>E-Mail-Adresse</strong> (optional, nur wenn du sie im
              Profil angibst — für Monats­abrechnung oder Cross-Device-Login)
            </li>
            <li>
              <strong>PayPal-Handle</strong> (optional, damit andere dir per
              PayPal.me überweisen können — die Zahlung läuft bei PayPal, nicht
              bei uns)
            </li>
            <li>
              <strong>Kaffee- und Einkaufs-Events</strong> (Zeitstempel,
              Eventtyp, Betrag in Cent, ggf. Produktname und Notiz)
            </li>
            <li>
              <strong>IP-Adresse</strong> (kurzzeitig, für Rate-Limiting gegen
              Missbrauch; keine dauerhafte Speicherung)
            </li>
          </ul>

          <h2 className="text-lg font-semibold mt-4">
            3. Rechtsgrundlage &amp; Zweck
          </h2>
          <p>
            Die Verarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. b
            DSGVO (Vertragserfüllung — Bereitstellung des Dienstes) sowie
            Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse am
            funktionierenden Betrieb, u. a. Missbrauchs­schutz).
          </p>

          <h2 className="text-lg font-semibold mt-4">
            4. Cookies &amp; lokale Speicherung
          </h2>
          <p>
            Wir setzen <strong>ein</strong> technisch notwendiges Cookie
            (<code className="px-1 bg-kaffee-100 rounded">kk_session</code>),
            ein signiertes JWT, das merkt, als welches Mitglied du in welcher
            Gruppe eingeloggt bist. Laufzeit: 90 Tage, HttpOnly, SameSite=Lax.
            Kein Tracking-Cookie, keine Werbe-Cookies, kein Analytics. Im
            lokalen Browser-Speicher wird nur die Bestätigung des
            Cookie-Hinweises abgelegt.
          </p>

          <h2 className="text-lg font-semibold mt-4">
            5. Empfänger &amp; Auftragsverarbeiter
          </h2>
          <ul className="list-disc list-inside space-y-1">
            <li>
              <strong>Supabase</strong> (Datenbank &amp; Realtime) — EU-Region
              (Frankfurt). Auftragsverarbeitungsvertrag geschlossen.
            </li>
            <li>
              <strong>Vercel</strong> (Hosting der Webanwendung) — Deployment
              in EU-Regionen.
            </li>
            {info.usesAnthropic && (
              <li>
                <strong>Anthropic</strong> (Claude API, nur für
                PDF-Monatsrückblick-Texte) — Daten werden nur on-demand
                übermittelt, wenn du einen Rückblick herunterlädst.
                Übermittelt werden aggregierte Statistiken (Event-Zahlen,
                keine Klarnamen).
              </li>
            )}
            <li>
              <strong>Resend</strong> (Mail-Versand, nur bei optionaler
              E-Mail-Abrechnung und Magic-Link-Login) — EU-Option aktiviert.
            </li>
            <li>
              <strong>PayPal</strong> — wenn du den PayPal-Button klickst,
              öffnet sich paypal.me mit vorausgefülltem Betrag. Die Zahlung
              findet ausschließlich bei PayPal statt; wir haben keinen Einblick
              in Zahlungsdaten.
            </li>
          </ul>

          <h2 className="text-lg font-semibold mt-4">
            6. Speicherdauer
          </h2>
          <p>
            Daten werden gespeichert, solange die Gruppe aktiv ist. Wenn du
            dein Mitglieds-Profil löschst (Profil-Seite) oder die Gruppe
            gelöscht wird, werden alle zugehörigen Daten gelöscht bzw.
            anonymisiert. Inaktive Gruppen ohne Nutzung länger als 24 Monate
            werden automatisch gelöscht.
          </p>

          <h2 className="text-lg font-semibold mt-4">
            7. Deine Rechte
          </h2>
          <p>Dir stehen zu:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Auskunft (Art. 15 DSGVO)</li>
            <li>Berichtigung (Art. 16 DSGVO)</li>
            <li>Löschung (Art. 17 DSGVO)</li>
            <li>Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
            <li>Datenübertragbarkeit (Art. 20 DSGVO)</li>
            <li>Widerspruch (Art. 21 DSGVO)</li>
            <li>
              Beschwerde bei einer Aufsichtsbehörde (Art. 77 DSGVO) —
              zuständig ist die Landesdatenschutzbeauftragte am Wohnsitz des
              Verantwortlichen.
            </li>
          </ul>
          <p>
            Zur Ausübung reicht eine formlose Nachricht an{" "}
            <a className="underline" href={`mailto:${info.email}`}>
              {info.email}
            </a>
            .
          </p>

          <h2 className="text-lg font-semibold mt-4">
            8. Sicherheit
          </h2>
          <p>
            Transport per TLS, Passwort-freie Authentifizierung per JWT,
            Datenbank-Zugriffe über Row-Level-Security. Schreib-Zugriffe laufen
            ausschließlich serverseitig über einen Service-Key.
          </p>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
