'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function CreateGroupError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error server-side for monitoring
    console.error('Create group error:', {
      message: error.message,
      stack: error.stack,
      digest: error.digest,
      timestamp: new Date().toISOString(),
    });
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50 p-4">
      <div className="w-full max-w-md">
        {/* Error Icon & Header */}
        <div className="flex flex-col items-center gap-4 mb-8">
          <div className="p-3 bg-red-100 rounded-full">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Oops! Etwas ist schiefgelaufen</h1>
            <p className="text-gray-600">
              Wir konnten deine Kaffeekasse nicht erstellen. Bitte versuche es erneut.
            </p>
          </div>
        </div>

        {/* Error Details (Development Only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-6 p-4 bg-gray-100 rounded-lg border border-gray-300">
            <p className="text-xs font-mono text-gray-700 break-words">
              <span className="font-bold">Error:</span> {error.message}
            </p>
            {error.digest && (
              <p className="text-xs font-mono text-gray-600 mt-2">
                <span className="font-bold">Digest:</span> {error.digest}
              </p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={reset}
            className="w-full px-4 py-3 bg-amber-600 text-white font-medium rounded-lg hover:bg-amber-700 transition-colors flex items-center justify-center gap-2"
          >
            Erneut versuchen
          </button>
          <Link href="/">
            <Button variant="outline" className="w-full">
              Zurück zur Startseite
            </Button>
          </Link>
        </div>

        {/* Help Text */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Wenn das Problem weiterhin besteht, kontaktiere uns unter{' '}
          <a href="mailto:felix.bredl@gmail.com" className="text-amber-600 hover:underline">
            felix.bredl@gmail.com
          </a>
        </p>
      </div>
    </div>
  );
}
