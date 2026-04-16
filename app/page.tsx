import Link from "next/link";
import { Coffee, QrCode, HandCoins } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-kaffee-50 to-kaffee-100">
      <section className="px-6 pt-20 pb-12 text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-kaffee-700 text-white mb-6 text-3xl">
          ☕
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-kaffee-900 mb-4">
          Die Kaffeekasse, die sich selber führt.
        </h1>
        <p className="text-lg text-kaffee-700 mb-8">
          QR-Code neben die Maschine, ein Tap pro Kaffee, Ende des Monats ein
          Klick zur PayPal-Überweisung. Kein Account, keine App, keine
          Strichliste mehr, die keiner pflegt.
        </p>
        <Link href="/new">
          <Button size="xl">Kostenlose Gruppe anlegen →</Button>
        </Link>
        <p className="mt-4 text-sm text-kaffee-700/70">
          Dauert 60 Sekunden. Kein Login. Du musst nur einmal deinen Namen
          eintippen.
        </p>
      </section>

      <section className="px-6 py-12 max-w-4xl mx-auto">
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

      <footer className="px-6 py-12 text-center text-sm text-kaffee-700/70">
        Open Source, DSGVO-konform, EU-Hosting. Fragen?{" "}
        <a className="underline" href="mailto:felix.bredl@gmail.com">
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
    <div className="bg-white/80 rounded-2xl p-6 border border-kaffee-100 shadow-sm">
      <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-kaffee-700 text-white mb-3">
        {icon}
      </div>
      <h3 className="font-semibold text-kaffee-900 mb-2">{title}</h3>
      <p className="text-sm text-kaffee-700">{body}</p>
    </div>
  );
}
