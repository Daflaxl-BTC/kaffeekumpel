"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function GroupError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen px-6 py-12 max-w-md mx-auto">
      <Link
        href="/"
        className="text-sm text-kaffee-700 hover:underline inline-block mb-4"
      >
        ← zur Startseite
      </Link>
      <div className="bg-white/80 rounded-2xl p-6 border border-kaffee-100">
        <h1 className="text-2xl font-bold text-kaffee-900 mb-3">
          Hier hakt gerade was.
        </h1>
        <p className="text-kaffee-700 mb-6">
          Die Gruppenansicht konnte nicht geladen werden. Versuch&apos;s nochmal
          — falls es weiter hakt, schick uns die Ref-Nummer unten.
        </p>
        {error.digest && (
          <p className="text-xs text-kaffee-700/60 mb-4 font-mono">
            Ref: {error.digest}
          </p>
        )}
        <Button onClick={reset} size="lg" className="w-full">
          Nochmal versuchen
        </Button>
      </div>
    </main>
  );
}
