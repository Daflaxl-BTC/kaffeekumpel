'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Logge den Fehler für Debugging
    console.error('New group page error:', error);
  }, [error]);

  if (!mounted) {
    return null;
  }

  const isDev = process.env.NODE_ENV === 'development';

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <div className="p-8">
          <div className="flex justify-center mb-6">
            <div className="bg-red-100 p-3 rounded-full">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">Oops!</h1>
          <p className="text-center text-gray-600 mb-6">
            Es gab einen Fehler beim Erstellen der Kaffeekasse.
          </p>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-800 font-medium mb-2">Fehlerdetails:</p>
            <p className="text-sm text-red-700 font-mono break-words">{error.message}</p>
            {isDev && error.digest && (
              <p className="text-xs text-red-600 mt-2">Digest: {error.digest}</p>
            )}
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => reset()}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 rounded-lg transition-colors"
            >
              Erneut versuchen
            </Button>
            <Button
              onClick={() => window.location.href = '/'}
              variant="outline"
              className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 font-medium py-2 rounded-lg transition-colors"
            >
              Zur Startseite
            </Button>
          </div>

          <p className="text-xs text-gray-500 text-center mt-6">
            Wenn der Fehler weiterhin auftritt, kontaktiere bitte den Support.
          </p>
        </div>
      </Card>
    </div>
  );
}
