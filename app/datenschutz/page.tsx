import type { Metadata } from "next";
import Link from "next/link";
import { legalInfo } from "@/lib/legal";

// Angaben kommen zur Laufzeit aus der Umgebung (wichtig für Docker/Hetzner).
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Datenschutz — Kaffeekumpel",
  description:
    "Datenschutzerklärung nach Art. 13 DSGVO: welche Daten Kaffeekumpel verarbeitet und warum.",
  robots: { index: true, follow: true },
};

const STAND = "15. November 2026";

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="text-lg font-semibold mt-6">{children}</h2>;
}

export default function DatenschutzPage() {
  const info = legalInfo();
  const selfHosted = info.hosting === "hetzner";
  return (
    <main className="min-h-screen max-w-2xl mx-auto px-6 pt-8 pb-4">
        <Link href="/" className="text-sm text-kaffee-700 hover:underline">
          ← zurück
        </Link>
        <h1 className="text-3xl font-bold text-kaffee-900 mt-2 mb-6">Datenschutzerklärung</h1>

        <section className="max-w-none text-kaffee-900 space-y-3">
          <p className="text-kaffee-700">Stand: {STAND}</p>

          <H2>1. Verantwortlicher</H2>
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

          <H2>2. Welche Daten wir verarbeiten</H2>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>Name der Kaffeekasse</strong>, den du beim Anlegen eingibst.
            </li>
            <li>
              <strong>Anzeigename</strong> innerhalb der Kaffeekasse. Ein Klarname ist nicht nötig.
            </li>
            <li>
              <strong>E-Mail-Adresse</strong>, freiwillig im Profil. Sie wird derzeit nur
              gespeichert und nicht für den Versand genutzt.
            </li>
            <li>
              <strong>PayPal-Name</strong>, freiwillig im Profil, damit andere dir über
              paypal.me Geld senden können.
            </li>
            <li>
              <strong>Einträge</strong>: Kaffee, Einkäufe, Putzdienste und Abrechnungen mit
              Zeitpunkt, Art, Betrag in Cent und gegebenenfalls Produktname.
            </li>
            <li>
              <strong>Technische Zugriffsdaten</strong>: IP-Adresse, Zeitpunkt und
              aufgerufene Adresse in den Server-Protokollen des Hostings sowie kurzzeitig im
              Arbeitsspeicher zur Begrenzung von Missbrauch.
            </li>
          </ul>

          <H2>3. Zwecke und Rechtsgrundlagen</H2>
          <p>
            Wir verarbeiten diese Daten, um dir die Kaffeekasse bereitzustellen (Art. 6
            Abs. 1 lit. b DSGVO). Die technischen Zugriffsdaten verarbeiten wir aus unserem
            berechtigten Interesse an einem sicheren und stabilen Betrieb (Art. 6 Abs. 1
            lit. f DSGVO).
          </p>

          <H2>4. Cookies</H2>
          <p>
            Wir setzen ein einziges, technisch notwendiges Cookie (
            <code className="px-1 bg-kaffee-100 rounded">kk_session</code>). Es merkt sich,
            als welches Mitglied du in welcher Kaffeekasse angemeldet bist, und läuft nach 90
            Tagen ab. Es gibt keine Tracking-, Analyse- oder Werbe-Cookies. Für technisch
            notwendige Cookies ist keine Einwilligung erforderlich (§ 25 Abs. 2 Nr. 2 TDDDG).
          </p>

          <H2>5. Hosting und Empfänger</H2>
          <ul className="list-disc pl-5 space-y-1">
            {selfHosted ? (
              <li>
                <strong>Hetzner Online GmbH</strong>, Industriestr. 25, 91710 Gunzenhausen:
                Betrieb von Webanwendung und Datenbank auf Servern in Deutschland. Mit Hetzner
                besteht ein Vertrag zur Auftragsverarbeitung nach Art. 28 DSGVO.
              </li>
            ) : (
              <>
                <li>
                  <strong>Supabase</strong> (Datenbank): Speicherung in der Region Frankfurt am
                  Main. Mit Supabase besteht ein Vertrag zur Auftragsverarbeitung nach Art. 28
                  DSGVO.
                </li>
                <li>
                  <strong>Vercel</strong> (Auslieferung der Webanwendung): Die Serverfunktionen
                  laufen in Frankfurt am Main. Vercel ist ein Unternehmen mit Sitz in den USA;
                  eine Übermittlung in die USA stützt sich auf den Angemessenheitsbeschluss der
                  EU-Kommission für zertifizierte Unternehmen (EU-US Data Privacy Framework,
                  Art. 45 DSGVO) beziehungsweise Standardvertragsklauseln (Art. 46 DSGVO).
                </li>
              </>
            )}
            {info.usesAnthropic && (
              <li>
                <strong>Anthropic</strong> (KI-Texte im PDF-Rückblick): Nur wenn jemand einen
                Rückblick herunterlädt, senden wir Kennzahlen wie Tassenzahlen und Beträge an
                Anthropic in den USA. Namen der Kaffeekasse und der Mitglieder werden dabei durch
                Platzhalter ersetzt und erst auf unserem Server wieder eingesetzt. Grundlage der
                Übermittlung sind Standardvertragsklauseln (Art. 46 DSGVO).
              </li>
            )}
            <li>
              <strong>PayPal</strong>: Tippst du auf einen PayPal-Knopf, öffnet sich paypal.me
              mit vorausgefülltem Betrag. Die Zahlung findet ausschließlich bei PayPal statt; wir
              erhalten keine Zahlungsdaten.
            </li>
          </ul>

          <H2>6. Speicherdauer</H2>
          <p>
            Wir speichern die Daten, solange die Kaffeekasse genutzt wird. Auf Wunsch löschen
            wir ein Mitglied oder eine ganze Kaffeekasse; eine kurze Nachricht an{" "}
            <a className="underline" href={`mailto:${info.email}`}>
              {info.email}
            </a>{" "}
            genügt. Server-Protokolle werden vom Hosting nach kurzer Zeit automatisch gelöscht.
          </p>

          <H2>7. Deine Rechte</H2>
          <p>
            Du hast das Recht auf Auskunft (Art. 15), Berichtigung (Art. 16), Löschung (Art.
            17), Einschränkung der Verarbeitung (Art. 18), Datenübertragbarkeit (Art. 20) und
            Widerspruch (Art. 21 DSGVO). Eine formlose Nachricht an die oben genannte Adresse
            genügt.
          </p>
          <p>
            Du kannst dich außerdem bei einer Datenschutz-Aufsichtsbehörde beschweren (Art. 77
            DSGVO). Zuständig für uns ist das Bayerische Landesamt für Datenschutzaufsicht,
            Promenade 18, 91522 Ansbach.
          </p>

          <H2>8. Sicherheit</H2>
          <p>
            Alle Verbindungen sind per TLS verschlüsselt. Die Datenbank ist mit
            Zeilenberechtigungen abgesichert; Schreibzugriffe laufen ausschließlich über
            unseren Server.
          </p>
        </section>
      </main>
  );
}
