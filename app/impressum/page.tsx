import Link from "next/link";

export const metadata = {
  title: "Impressum — Kaffeekumpel",
  description: "Anbieterkennzeichnung nach § 5 DDG und § 18 Abs. 2 MStV.",
};

/**
 * Impressum. Angaben identisch mit felixventures.de, quickalert.eu und
 * planumplants.de (Stand 15.11.2026): öffentliche Anschrift über die
 * c/o-Zustelladresse, nicht die Geschäftsadresse laut Gewerbeanmeldung.
 */
export default function ImpressumPage() {
  return (
    <main className="min-h-screen px-6 py-12 max-w-2xl mx-auto text-kaffee-900">
      <Link
        href="/"
        className="text-sm text-kaffee-700 hover:underline inline-block mb-4"
      >
        ← zurück
      </Link>
      <h1 className="text-3xl font-bold mb-8">Impressum</h1>

      <section className="space-y-8 leading-relaxed">
        <div>
          <h2 className="text-lg font-semibold mb-2">Angaben gemäß § 5 DDG</h2>
          <p>
            Felix Ventures, Felix Georg Bredl
            <br />
            Einzelunternehmen
            <br />
            c/o Autorenglück #43669
            <br />
            Albert-Einstein-Str. 47
            <br />
            02977 Hoyerswerda
            <br />
            Deutschland
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">Kontakt</h2>
          <p>
            Telefon:{" "}
            <a className="underline underline-offset-4" href="tel:+4915119784023">
              +49 151 19784023
            </a>
            <br />
            E-Mail:{" "}
            <a
              className="underline underline-offset-4"
              href="mailto:felix.ventures.contact@proton.me"
            >
              felix.ventures.contact@proton.me
            </a>
          </p>
          <p className="mt-2 text-sm text-kaffee-800">
            Maßgeblich für rechtsverbindliche Zustellungen im Sinne des § 5 DDG
            ist{" "}
            <a className="underline underline-offset-4" href="mailto:felix-bredl@gmx.de">
              felix-bredl@gmx.de
            </a>
            .
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">Steuerliche Angaben</h2>
          <p>Umsatzsteuer-Identifikationsnummer gemäß § 27a UStG: DE461810782</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">
            Redaktionell verantwortlich (§ 18 Abs. 2 MStV)
          </h2>
          <p>
            Felix Georg Bredl
            <br />
            c/o Autorenglück #43669, Albert-Einstein-Str. 47, 02977 Hoyerswerda,
            Deutschland
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">
            Verbraucherstreitbeilegung / Universalschlichtungsstelle
          </h2>
          <p className="text-kaffee-800">
            Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren
            vor einer Verbraucherschlichtungsstelle teilzunehmen. Hinweis: Die
            frühere EU-Plattform zur Online-Streitbeilegung (OS-Plattform) wurde
            eingestellt.
          </p>
        </div>

        <p>
          Hinweise zum Umgang mit euren Daten stehen in der{" "}
          <Link className="underline underline-offset-4" href="/datenschutz">
            Datenschutzerklärung
          </Link>
          .
        </p>
      </section>
    </main>
  );
}
