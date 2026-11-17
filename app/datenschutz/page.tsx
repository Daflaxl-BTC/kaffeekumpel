import Link from "next/link";
import { privacyHostingText } from "@/lib/hosting";

export const metadata = {
  title: "Datenschutz — Kaffeekumpel",
  description: "Datenschutzerklärung nach Art. 13 DSGVO.",
};

/**
 * Datenschutzerklärung. Beschreibt die Datenflüsse, wie sie im Code stehen
 * (Stand 15.11.2026). Jede Änderung an Datenflüssen (neuer Dienst, neue
 * Felder, Magic Link, E-Mail-Versand) muss hier nachgezogen werden.
 */

function Abschnitt({ titel, children }: { titel: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-2">{titel}</h2>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

export default function DatenschutzPage() {
  // Abschnitt 4 hängt vom Betriebsort ab (HOSTING_PROVIDER, siehe lib/hosting.ts).
  const hosting = privacyHostingText();
  return (
    <main className="min-h-screen px-6 py-12 max-w-2xl mx-auto text-kaffee-900">
      <Link href="/" className="text-sm text-kaffee-700 hover:underline inline-block mb-4">
        ← zurück
      </Link>
      <h1 className="text-3xl font-bold mb-2">Datenschutzerklärung</h1>
      <p className="text-sm text-kaffee-800 mb-8">Stand: {hosting.stand}</p>

      <section className="space-y-8 leading-relaxed">
        <Abschnitt titel="1. Verantwortlicher">
          <p>
            Felix Ventures, Felix Georg Bredl
            <br />
            c/o Autorenglück #43669, Albert-Einstein-Str. 47, 02977 Hoyerswerda, Deutschland
            <br />
            E-Mail:{" "}
            <a className="underline underline-offset-4" href="mailto:felix.ventures.contact@proton.me">
              felix.ventures.contact@proton.me
            </a>
            , Telefon: +49 151 19784023
          </p>
          <p>Weitere Angaben stehen im <Link className="underline underline-offset-4" href="/impressum">Impressum</Link>.</p>
        </Abschnitt>

        <Abschnitt titel="2. Was Kaffeekumpel verarbeitet">
          <p>
            Kaffeekumpel funktioniert ohne Benutzerkonto. Gespeichert wird nur, was ihr selbst eintragt:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>der Name der Gruppe, der Kaffeepreis und die Währung,</li>
            <li>der Name, den jedes Mitglied wählt (ein Spitzname genügt),</li>
            <li>freiwillig eine E-Mail-Adresse und ein PayPal-Name im eigenen Profil,</li>
            <li>Einträge mit Zeitpunkt: getrunkene Kaffees, Einkäufe mit Betrag, Nachfüllen, Putzen,</li>
            <li>Abrechnungen und die daraus folgenden Überweisungen zwischen Mitgliedern.</li>
          </ul>
          <p>
            Zweck ist allein die Kaffeekasse: Strichliste, Putzplan und Abrechnung innerhalb eurer
            Gruppe. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO, die Nutzung des Dienstes. Trägt ein
            Mitglied den Namen einer anderen Person ein, stützen wir die Verarbeitung auf Art. 6 Abs. 1
            lit. f DSGVO; unser berechtigtes Interesse ist die gemeinsame Abrechnung, die ohne Namen
            nicht möglich wäre.
          </p>
          <p>
            Wer den sechsstelligen Gruppencode oder den QR-Code kennt, kann der Gruppe beitreten und
            ihre Einträge sehen. Gebt den Code deshalb nur an Personen weiter, die zur Gruppe gehören.
          </p>
        </Abschnitt>

        <Abschnitt titel="3. Cookie">
          <p>
            Damit ihr nicht bei jedem Besuch erneut beitreten müsst, setzt Kaffeekumpel ein einziges
            Cookie namens <code>kk_session</code>. Es enthält in signierter Form den Gruppencode und eure
            Mitglieds-Kennung, ist für Skripte nicht lesbar und läuft nach 90 Tagen ab. Es ist für den
            Dienst unbedingt erforderlich (§ 25 Abs. 2 Nr. 2 TDDDG); eine Einwilligung ist dafür nicht
            nötig. Andere Cookies, Analyse- oder Werbewerkzeuge setzen wir nicht ein.
          </p>
        </Abschnitt>

        <Abschnitt titel="4. Hosting und Datenbank">
          {hosting.paragraphs.map((text) => (
            <p key={text.slice(0, 32)}>{text}</p>
          ))}
        </Abschnitt>

        <Abschnitt titel="5. Monatsrückblick (PDF)">
          <p>
            Wenn ein Mitglied den Rückblick als PDF abruft, lassen wir Überschrift, eine Anekdote und
            kurze persönliche Sätze von einem KI-Modell der Anthropic PBC, 548 Market St, PMB 90375,
            San Francisco, CA 94104, USA, formulieren. Dafür übermitteln wir nur Kennzahlen: Zeitraum, Anzahl
            der Mitglieder, Tassen, Beträge und Tagesverläufe. Namen von Personen und den Namen der
            Gruppe übermitteln wir nicht; den Namen setzen wir erst nach der Antwort bei uns ein.
          </p>
          <p>
            Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO; unser berechtigtes Interesse ist ein
            unterhaltsamer Rückblick auf Abruf. Die Übermittlung in die USA stützt sich auf die
            EU-Standardvertragsklauseln (Art. 46 Abs. 2 lit. c DSGVO). Ohne diese Funktion zu nutzen,
            geht nichts an Anthropic.
          </p>
        </Abschnitt>

        <Abschnitt titel="6. Bezahlen über PayPal">
          <p>
            Kaffeekumpel wickelt keine Zahlungen ab. Bei einer Abrechnung erzeugen wir einen Link auf
            paypal.me mit dem PayPal-Namen der empfangenden Person und dem Betrag. Erst wenn ihr den
            Link öffnet, verarbeitet PayPal (Europe) S.à r.l. et Cie, S.C.A., 22-24 Boulevard Royal, 2449
            Luxembourg, eure Daten nach seiner eigenen Datenschutzerklärung.
          </p>
        </Abschnitt>

        <Abschnitt titel="7. Speicherdauer">
          <p>
            Die Daten einer Gruppe speichern wir, solange die Gruppe genutzt wird. Auf Wunsch löschen wir
            eine Gruppe oder einzelne Angaben vollständig; schreibt uns dazu an die oben genannte
            Adresse. IP-Adressen nutzen wir sonst nur kurz im Arbeitsspeicher, um zu viele Anfragen in
            kurzer Zeit abzuwehren; gespeichert werden sie dabei nicht.
          </p>
        </Abschnitt>

        <Abschnitt titel="8. Eure Rechte">
          <p>
            Ihr habt das Recht auf Auskunft (Art. 15 DSGVO), Berichtigung (Art. 16), Löschung (Art. 17),
            Einschränkung der Verarbeitung (Art. 18) und Datenübertragbarkeit (Art. 20). Soweit wir uns
            auf berechtigte Interessen stützen, könnt ihr der Verarbeitung aus Gründen, die sich aus eurer
            besonderen Situation ergeben, widersprechen (Art. 21). Eine E-Mail an die oben genannte
            Adresse genügt.
          </p>
          <p>
            Ihr könnt euch außerdem bei einer Datenschutz-Aufsichtsbehörde beschweren, etwa beim
            Bayerischen Landesamt für Datenschutzaufsicht, Promenade 18, 91522 Ansbach,{" "}
            <a className="underline underline-offset-4" href="https://www.lda.bayern.de" rel="noopener noreferrer">
              www.lda.bayern.de
            </a>
            .
          </p>
        </Abschnitt>
      </section>
    </main>
  );
}
