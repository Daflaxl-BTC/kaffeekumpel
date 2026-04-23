"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LoginError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[login error]", error);
  }, [error]);

  return (
    <main className="min-h-screen px-6 py-12 max-w-md mx-auto">
      <div className="bg-white/80 rounded-2xl p-6 border border-kaffee-100">
        <h1 className="text-2xl font-bold text-kaffee-900 mb-3">
          Login hat nicht geklappt.
        </h1>
        <p className="text-kaffee-700 mb-6">
          Der Scanner oder die Code-Eingabe ist gestolpert. Probier's
          nochmal — oder geh direkt zu deiner Gruppen-URL.
        </p>
        {error.digest && (
          <p className="text-xs text-kaffee-700/60 mb-4 font-mono">
            Ref: {error.digest}
          </p>
        )}
        <div className="flex gap-2">
          <Button onClick={reset} size="lg" className="flex-1">
            Nochmal
          </Button>
          <Link href="/" className="flex-1">
            <Button variant="secondary" size="lg" className="w-full">
              Startseite
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
