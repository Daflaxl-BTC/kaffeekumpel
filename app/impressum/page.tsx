import type { Metadata } from "next";
import Link from "next/link";
import { legalInfo } from "@/lib/legal";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = {
  title: "Impressum — Kaffeekumpel",
  description: "Anbieterkennzeichnung gemäß § 5 DDG (ehem. TMG).",
  robots: { index: true, follow: true },
};

export default function ImpressumPage() {
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
          Impressum
        </h1>

        <section className="prose prose-sm max-w-none text-kaffee-900">
          <h2 className="text-lg font-semibold mt-6 mb-2">
            Angaben gemäß § 5 DDG
          </h2>
          <p className="whitespace-pre-line">
            {info.name}
            {"\n"}
            {info.address}
          </p>

          <h2 className="text-lg font-semibold mt-6 mb-2">Kontakt</h2>
          <p>
            E-Mail:{" "}
            <a
              className="underline"
              href={`mailto:${info.email}`}
            >
              {info.email}
            </a>
            {info.phone && (
              <>
                <br />
                Telefon: {info.phone}
              </>
            )}
          </p>

          <h2 className="text-lg font-semibold mt-6 mb-2">
            Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV
          </h2>
          <p className="whitespace-pre-line">
            {info.name}
            {"\n"}
            {info.address}
          </p>

          <h2 className="text-lg font-semibold mt-6 mb-2">
            EU-Streitschlichtung
          </h2>
          <p>
            Die Europäische Kommission stellt eine Plattform zur
            Online-Streitbeilegung (OS) bereit:{" "}
            <a
              href="https://ec.europa.eu/consumers/odr"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              https://ec.europa.eu/consumers/odr
            </a>
            . Wir sind weder bereit noch verpflichtet, an
            Streitbeilegungsverfahren vor einer
            Verbraucher­schlichtungsstelle teilzunehmen.
          </p>

          <h2 className="text-lg font-semibold mt-6 mb-2">Haftung</h2>
          <p>
            Die Inhalte dieses Dienstes werden mit größtmöglicher Sorgfalt
            erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität kann
            jedoch keine Gewähr übernommen werden. Kaffeekumpel wickelt keine
            Zahlungen ab — PayPal-Überweisungen laufen ausschließlich zwischen
            den Nutzern über die PayPal-Plattform. Für dort entstehende
            Streitigkeiten sind die PayPal-Nutzungsbedingungen maßgeblich.
          </p>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
