'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { createGroup } from './actions';
import { toast } from 'sonner';

const MAX_RETRIES = 3;
const INITIAL_DELAY_MS = 1000;

/**
 * Berechnet Verzögerung für exponentielles Backoff.
 * @param attempt 0-basiert (0 = 1000ms, 1 = 2000ms, 2 = 4000ms)
 */
function calculateExponentialBackoff(attempt: number): number {
  return INITIAL_DELAY_MS * Math.pow(2, attempt);
}

export default function NewGroupPage() {
  const router = useRouter();
  const [paypalHandle, setPaypalHandle] = useState('');
  const [groupName, setGroupName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await createGroup({
        groupName: groupName.trim() || 'Kaffee-Crew',
        paypalHandle: paypalHandle.trim(),
      });

      if (result.error) {
        setError(result.error);
        setRetryCount(0);
        setLoading(false);
        toast.error(`Fehler: ${result.error}`);
        return;
      }

      if (result.slug) {
        toast.success('Gruppe erstellt! 🎉');
        router.push(`/g/${result.slug}`);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unbekannter Fehler';
      setError(errorMsg);
      setRetryCount(0);
      setLoading(false);
      toast.error(`Fehler: ${errorMsg}`);
    }
  };

  /**
   * Retry-Logik mit exponentiellem Backoff.
   * Wird aufgerufen, wenn der Nutzer auf "Erneut versuchen" klickt.
   */
  const handleRetry = async () => {
    if (retryCount >= MAX_RETRIES) {
      setError('Maximale Versuche erreicht. Bitte kontaktiere den Support.');
      setLoading(false);
      return;
    }

    const nextAttempt = retryCount + 1;
    const delayMs = calculateExponentialBackoff(retryCount);

    setError(null);
    setLoading(true);
    setRetryCount(nextAttempt);

    // Warte exponentiell länger
    await new Promise((resolve) => setTimeout(resolve, delayMs));

    try {
      const result = await createGroup({
        groupName: groupName.trim() || 'Kaffee-Crew',
        paypalHandle: paypalHandle.trim(),
      });

      if (result.error) {
        setError(
          `Versuch ${nextAttempt}/${MAX_RETRIES} fehlgeschlagen: ${result.error}`
        );
        setLoading(false);
        return;
      }

      if (result.slug) {
        toast.success('Gruppe erstellt! 🎉');
        router.push(`/g/${result.slug}`);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unbekannter Fehler';
      setError(`Versuch ${nextAttempt}/${MAX_RETRIES} fehlgeschlagen: ${errorMsg}`);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <div className="p-6">
          <h1 className="text-3xl font-bold text-orange-900 mb-2">☕ Kaffeekumpel</h1>
          <p className="text-gray-600 mb-6">Neue Gruppe erstellen</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gruppenname (optional)
              </label>
              <input
                type="text"
                placeholder="z.B. WG Kaffee-Crew"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                PayPal.me Handle <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="z.B. maxmustermann"
                value={paypalHandle}
                onChange={(e) => setPaypalHandle(e.target.value)}
                disabled={loading}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">
                Dein PayPal.me-Nutzername (z.B. paypal.me/maxmustermann)
              </p>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-700">{error}</p>
                {retryCount < MAX_RETRIES && (
                  <Button
                    type="button"
                    onClick={handleRetry}
                    disabled={loading}
                    variant="outline"
                    className="mt-3 w-full text-red-600 border-red-200 hover:bg-red-100"
                  >
                    {loading
                      ? `Versuche erneut (${retryCount}/${MAX_RETRIES})...`
                      : `Erneut versuchen (${retryCount}/${MAX_RETRIES})`}
                  </Button>
                )}
                {retryCount >= MAX_RETRIES && (
                  <Link href="/" className="block mt-3">
                    <Button variant="outline" className="w-full">
                      Zurück zur Startseite
                    </Button>
                  </Link>
                )}
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading || !paypalHandle.trim()}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 rounded-md"
            >
              {loading && !error ? 'Erstelle Gruppe...' : 'Gruppe erstellen'}
            </Button>
          </form>

          <p className="text-center text-xs text-gray-500 mt-4">
            Hast du bereits eine Gruppe?{' '}
            <Link href="/login" className="text-orange-600 hover:underline">
              Beitreten
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}
