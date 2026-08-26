"use client";

import { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Home } from "lucide-react";

export default function NewGroupError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error for debugging
    console.error("[/new Error Boundary]", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <div className="p-8">
          <div className="flex items-center justify-center mb-4">
            <AlertCircle className="w-12 h-12 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">Oops! Fehler beim Laden</h1>
          <p className="text-center text-gray-600 mb-6">
            Etwas ist schief gelaufen beim Vorbereiten der Seite. Das ist nicht deine Schuld!
          </p>

          <details className="mb-6 p-3 bg-gray-100 rounded-lg">
            <summary className="cursor-pointer text-sm font-medium text-gray-700">Fehler-Details (für Support)</summary>
            <pre className="mt-2 text-xs text-gray-600 overflow-auto max-h-32 whitespace-pre-wrap break-words">
              {error.message || "Unbekannter Fehler"}
            </pre>
          </details>

          <div className="space-y-3">
            <button
              onClick={reset}
              className="w-full bg-orange-500 text-white font-semibold py-2 rounded-lg hover:bg-orange-600 transition-colors"
            >
              Seite neu laden
            </button>
            <a
              href="/"
              className="w-full block text-center bg-gray-200 text-gray-900 font-semibold py-2 rounded-lg hover:bg-gray-300 transition-colors"
            >
              <Home className="w-4 h-4 inline mr-2" />
              Zur Startseite
            </a>
          </div>
        </div>
      </Card>
    </div>
  );
}
