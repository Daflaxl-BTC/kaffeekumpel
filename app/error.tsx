"use client";

import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen px-6 py-12 max-w-md mx-auto">
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <h1 className="text-lg font-bold text-red-900 mb-2">
          Etwas ist schief gelaufen
        </h1>
        <p className="text-sm text-red-900 mb-3">
          {error.message || "Unbekannter Fehler"}
        </p>
        {error.digest && (
          <p className="text-xs font-mono text-red-700/80 mb-4">
            Digest: {error.digest}
          </p>
        )}
        <div className="flex gap-2">
          <button
            onClick={reset}
            className="rounded-xl bg-red-900 text-white px-4 py-2 text-sm"
          >
            Erneut versuchen
          </button>
          <Link
            href="/"
            className="rounded-xl border border-red-300 text-red-900 px-4 py-2 text-sm"
          >
            Zur Startseite
          </Link>
        </div>
      </div>
    </main>
  );
}
