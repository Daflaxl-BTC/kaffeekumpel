"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[root error]", error);
  }, [error]);

  return (
    <main className="min-h-screen px-6 py-12 max-w-md mx-auto">
      <div className="bg-white/80 rounded-2xl p-6 border border-kaffee-100">
        <div className="text-3xl mb-2">☕💥</div>
        <h1 className="text-2xl font-bold text-kaffee-900 mb-3">
          Hoppla — da ist was schiefgelaufen.
        </h1>
        <p className="text-kaffee-700 mb-6">
          Kein Drama. Entweder kurz neu laden oder zurück zur Startseite.
          Falls das Problem bleibt, schreib uns.
        </p>
        {error.digest && (
          <p className="text-xs text-kaffee-700/60 mb-4 font-mono">
            Ref: {error.digest}
          </p>
        )}
        <div className="flex gap-2">
          <Button onClick={reset} size="lg" className="flex-1">
            Nochmal versuchen
          </Button>
          <a href="/" className="flex-1">
            <Button variant="secondary" size="lg" className="w-full">
              Zur Startseite
            </Button>
          </a>
        </div>
      </div>
    </main>
  );
}
