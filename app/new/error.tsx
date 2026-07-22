'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to console for debugging
    console.error('[/new Error Boundary]', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <div className="p-6 text-center">
          <h1 className="text-2xl font-bold text-red-700 mb-2">Fehler beim Erstellen</h1>
          <p className="text-gray-600 text-sm mb-4">
            Es gab ein Problem bei der Erstellung deiner Kaffeekasse.
          </p>

          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded text-left">
            <p className="text-xs text-red-600 font-mono break-words">
              {error.message || 'Unbekannter Fehler'}
            </p>
            {error.digest && (
              <p className="text-xs text-gray-500 mt-2">ID: {error.digest}</p>
            )}
          </div>

          <div className="space-y-2">
            <Button
              onClick={reset}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white"
            >
              Nochmal versuchen
            </Button>
            <Button
              onClick={() => (window.location.href = '/')}
              variant="outline"
              className="w-full"
            >
              Zur Startseite
            </Button>
          </div>

          <p className="text-xs text-gray-500 mt-4">
            Wenn der Fehler wiederholt auftritt, kontaktiere uns:
            <br />
            felix.bredl@gmail.com
          </p>
        </div>
      </Card>
    </div>
  );
}
