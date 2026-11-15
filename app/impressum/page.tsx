import type { Metadata } from "next";
import Link from "next/link";
import { legalInfo } from "@/lib/legal";

// Angaben kommen zur Laufzeit aus der Umgebung (wichtig für Docker/Hetzner).
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Impressum — Kaffeekumpel",
  description: "Anbieterkennzeichnung gemäß § 5 DDG.",
  robots: { index: true, follow: true },
};

export default function ImpressumPage() {
  const info = legalInfo();
  return (
    <main className="min-h-screen max-w-2xl mx-auto px-6 pt-8 pb-4">
        <Link href="/" className="text-sm text-kaffee-700 hover:underline">
          ← zurück
        </Link>
        <h1 className="text-3xl font-bold text-kaffee-900 mt-2 mb-6">Impressum</h1>

        <section className="max-w-none text-kaffee-900 space-y-2">
          <h2 className="text-lg font-semibold mt-6">Angaben gemäß § 5 DDG</h2>
          <p className="whitespace-pre-line">
            {info.name}
            {"\n"}
            {info.address}
          </p>

          <h2 className="text-lg font-semibold mt-6">Kontakt</h2>
          <p>
            E-Mail:{" "}
            <a className="underline" href={`mailto:${info.email}`}>
              {info.email}
            </a>
            {info.phone && (
              <>
                <br />
                Telefon: {info.phone}
              </>
            )}
          </p>

          {info.vatId && (
            <>
              <h2 className="text-lg font-semibold mt-6">Umsatzsteuer-ID</h2>
              <p>Umsatzsteuer-Identifikationsnummer gemäß § 27a UStG: {info.vatId}</p>
            </>
          )}

          <h2 className="text-lg font-semibold mt-6">
            Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV
          </h2>
          <p className="whitespace-pre-line">
            {info.name}
            {"\n"}
            {info.address}
          </p>

          <h2 className="text-lg font-semibold mt-6">Verbraucherstreitbeilegung</h2>
          <p>
            Wir sind nicht bereit und nicht verpflichtet, an
            Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle
            teilzunehmen.
          </p>

          <h2 className="text-lg font-semibold mt-6">Haftung für Inhalte</h2>
          <p>
            Die Inhalte dieses Dienstes werden mit größtmöglicher Sorgfalt
            erstellt. Für Richtigkeit, Vollständigkeit und Aktualität können wir
            jedoch keine Gewähr übernehmen. Kaffeekumpel wickelt keine Zahlungen
            ab: Überweisungen über PayPal laufen ausschließlich zwischen den
            Nutzerinnen und Nutzern auf der Plattform von PayPal. Für dort
            entstehende Fragen gelten die Bedingungen von PayPal.
          </p>
        </section>
      </main>
  );
}
