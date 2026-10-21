"use client";

import { useRouter } from "next/navigation";

export default function NewGroupError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white p-4 flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-red-500">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Fehler</h1>
          <p className="text-gray-600 mb-6">
            Beim Erstellen der Gruppe ist ein Fehler aufgetreten.
          </p>

          <details className="mb-6 p-3 bg-gray-100 rounded text-xs text-gray-700 overflow-auto max-h-24">
            <summary className="cursor-pointer font-semibold mb-2">
              Technische Details
            </summary>
            <code>{error.message || "Unbekannter Fehler"}</code>
            {error.digest && (
              <>
                <br />
                <code>Digest: {error.digest}</code>
              </>
            )}
          </details>

          <div className="flex gap-3">
            <button
              onClick={reset}
              className="flex-1 py-2 px-4 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg transition-colors"
            >
              Erneut versuchen
            </button>
            <button
              onClick={() => router.push("/")}
              className="flex-1 py-2 px-4 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold rounded-lg transition-colors"
            >
              Startseite
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
