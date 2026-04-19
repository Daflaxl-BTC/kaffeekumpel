"use client";

import { Button } from "@/components/ui/button";

export default function NewGroupError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const isKeyInvalid = error.message === "SUPABASE_KEY_INVALID";

  return (
    <main className="min-h-screen px-6 py-12 max-w-md mx-auto">
      <a
        href="/"
        className="text-sm text-kaffee-700 hover:underline inline-block mb-4"
      >
        ← zurück
      </a>
      <div className="bg-white/80 rounded-2xl p-6 border border-kaffee-100">
        <h1 className="text-2xl font-bold text-kaffee-900 mb-3">
          Das hat gerade nicht geklappt.
        </h1>
        {isKeyInvalid ? (
          <p className="text-kaffee-700 mb-6">
            Die Verbindung zur Datenbank ist aktuell nicht konfiguriert.
            Der Betreiber wurde benachrichtigt — versuch's in ein paar
            Minuten nochmal.
          </p>
        ) : (
          <p className="text-kaffee-700 mb-6">
            Wir konnten deine Gruppe nicht anlegen. Probier es nochmal —
            und wenn's weiter hakt, schreib uns kurz.
          </p>
        )}
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
