'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to a logging service (e.g., Sentry, LogRocket)
    console.error('[/new Error]', error.message, error.digest);
  }, [error, error.digest]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <div className="p-6 text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">❌ Etwas ist schief gelaufen</h1>
          <p className="text-gray-600 mb-4">
            Bei der Erstellung der Gruppe trat ein unerwarteter Fehler auf.
          </p>

          <div className="bg-gray-100 rounded-md p-3 mb-4 text-left">
            <p className="text-xs text-gray-700 font-mono break-words">
              {error.message || 'Unbekannter Fehler'}
            </p>
            {error.digest && (
              <p className="text-xs text-gray-500 mt-2">
                Error ID: <code>{error.digest}</code>
              </p>
            )}
          </div>

          <div className="space-y-3">
            <Button
              onClick={reset}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 rounded-md"
            >
              Erneut versuchen
            </Button>

            <Link href="/" className="block">
              <Button variant="outline" className="w-full">
                Zurück zur Startseite
              </Button>
            </Link>
          </div>

          <p className="text-xs text-gray-500 mt-4">
            Wenn das Problem weiterhin besteht, kontaktiere den Support:{' '}
            <a href="mailto:felix.bredl@gmail.com" className="text-orange-600 hover:underline">
              felix.bredl@gmail.com
            </a>
          </p>
        </div>
      </Card>
    </div>
  );
}
