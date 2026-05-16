import Link from "next/link";
import { Coffee, QrCode, HandCoins, ScanLine, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlantLeft, PlantRight } from "@/components/plants";

export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-kaffee-100 via-kaffee-200 to-kaffee-300">
      {/* Pflanzen-Dekor */}
      <PlantLeft className="pointer-events-none absolute bottom-0 left-0 z-0 h-[90vh] max-h-[780px] w-[150px] -translate-x-[70px] opacity-55 sm:w-[220px] sm:-translate-x-[60px] sm:opacity-75 lg:w-[340px] lg:-translate-x-[40px] lg:opacity-90" />
      <PlantRight className="pointer-events-none absolute bottom-0 right-0 z-0 h-[90vh] max-h-[780px] w-[150px] translate-x-[70px] opacity-55 sm:w-[220px] sm:translate-x-[60px] sm:opacity-75 lg:w-[340px] lg:translate-x-[40px] lg:opacity-90" />

      {/* Dezenter Login-Zugang oben rechts — konkurriert nicht mit dem Haupt-CTA */}
      <div className="relative z-20 flex justify-end px-6 pt-6">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 rounded-full bg-kaffee-50/70 px-4 py-2 text-sm font-medium text-kaffee-900 backdrop-blur-sm transition-colors hover:bg-kaffee-50"
        >
          <ScanLine className="w-4 h-4" /> Schon dabei? Einloggen
        </Link>
      </div>

      <section className="relative z-10 max-w-2xl mx-auto px-6 pt-12 pb-8 text-center sm:pt-16">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-kaffee-800 text-white mb-6 text-3xl shadow-lg shadow-kaffee-800/25">
          ☕
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-kaffee-900 mb-4">
          Die Kaffeekasse, die sich selber führt.
        </h1>
        <p className="text-lg text-kaffee-800 mb-8">
          QR-Code neben die Maschine, ein Tap pro Kaffee, Ende des Monats ein
          Klick zur PayPal-Überweisung. Kein Account, keine App, keine
          Strichliste mehr, die keiner pflegt.
        </p>

        <Link href="/new">
          <Button size="xl">Kostenlose Gruppe anlegen →</Button>
        </Link>
        <p className="mt-4 text-sm text-kaffee-800">
          Dauert 60 Sekunden. Kein Login. Du musst nur einmal deinen Namen
          eintippen.
        </p>

        {/* Trust-Signals direkt im Sichtbereich statt versteckt im Footer */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2 text-sm">
          <TrustPill>Kein Login</TrustPill>
          <TrustPill>DSGVO-konform</TrustPill>
          <TrustPill>EU-Hosting</TrustPill>
          <TrustPill>Open Source</TrustPill>
        </div>
      </section>

      <section className="relative z-10 max-w-4xl mx-auto px-6 py-12">
        <div className="grid sm:grid-cols-3 gap-6">
          <Step
            icon={<QrCode className="w-6 h-6" />}
            title="1. Gruppe anlegen"
            body="Name eintippen, fertig. Du bekommst einen Link und einen QR-Code."
          />
          <Step
            icon={<Coffee className="w-6 h-6" />}
            title="2. QR an die Maschine"
            body="Als Aufkleber, auf einem Holzschild, egal. Wer dazu kommt, scannt einmal und trägt seinen Namen ein."
          />
          <Step
            icon={<HandCoins className="w-6 h-6" />}
            title="3. Abrechnung in 1 Klick"
            body="Jeder sieht, wer wem was schuldet. PayPal.me-Button öffnet die Zahlung direkt."
          />
        </div>
      </section>

      {/* Zweite CTA-Chance — fängt Nutzer ab, die durchgescrollt haben */}
      <section className="relative z-10 max-w-2xl mx-auto px-6 pt-4 pb-16 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-kaffee-900 mb-3">
          Bereit? Deine Kasse ist in 60 Sekunden da.
        </h2>
        <p className="text-base text-kaffee-800 mb-6">
          Kein Account, keine Kreditkarte, keine Verpflichtung.
        </p>
        <Link href="/new">
          <Button size="xl">Jetzt Gruppe anlegen →</Button>
        </Link>
      </section>

      <footer className="relative z-10 px-6 py-8 text-center text-sm text-kaffee-800">
        Fragen?{" "}
        <a
          className="underline underline-offset-4 hover:text-kaffee-900"
          href="mailto:felix.bredl@gmail.com"
        >
          felix.bredl@gmail.com
        </a>
      </footer>
    </main>
  );
}

function Step({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border border-kaffee-800/10 bg-kaffee-50 p-6 shadow-md shadow-kaffee-800/10">
      <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-kaffee-700 text-white mb-3">
        {icon}
      </div>
      <h3 className="font-semibold text-kaffee-900 mb-2">{title}</h3>
      <p className="text-sm text-kaffee-800">{body}</p>
    </div>
  );
}

function TrustPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-kaffee-50/80 px-3 py-1 text-kaffee-900">
      <Check className="w-3.5 h-3.5 text-leaf" strokeWidth={3} />
      {children}
    </span>
  );
}
