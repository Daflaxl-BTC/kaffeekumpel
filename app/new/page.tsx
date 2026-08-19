'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { createNewGroup } from './actions';
import { useState as useLoadingState } from 'react';

export default function NewGroupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [paypalHandle, setPaypalHandle] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    // Validate input
    if (!groupName.trim()) {
      toast.error('Bitte gib einen Namen für die Kaffeekasse ein');
      return;
    }

    if (!paypalHandle.trim()) {
      toast.error('Bitte gib deinen PayPal.me Handle ein');
      return;
    }

    setLoading(true);

    try {
      const result = await createNewGroup({
        name: groupName.trim(),
        paypal_handle: paypalHandle.trim(),
      });

      if (!result.success || !result.slug) {
        throw new Error(result.error || 'Fehler beim Erstellen der Kaffeekasse');
      }

      toast.success('Kaffeekasse erstellt! Willkommen an Bord!');
      router.push(`/g/${result.slug}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ein unbekannter Fehler ist aufgetreten';
      console.error('Create group error:', error);
      toast.error(errorMessage);
      throw error; // Let error boundary catch it
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50 p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">☕ Neue Kaffeekasse</h1>
          <p className="text-gray-600">Starten Sie eine neue Kaffeekasse für Ihre Gruppe</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="groupName" className="block text-sm font-medium text-gray-700 mb-1">
              Kaffeekasse Name *
            </label>
            <input
              id="groupName"
              type="text"
              placeholder="z.B. WG Mitte oder Büro 3. Stock"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label htmlFor="paypalHandle" className="block text-sm font-medium text-gray-700 mb-1">
              PayPal.me Handle *
            </label>
            <div className="flex">
              <span className="px-4 py-2 bg-gray-100 border border-gray-300 border-r-0 rounded-l-lg text-sm text-gray-600">
                paypal.me/
              </span>
              <input
                id="paypalHandle"
                type="text"
                placeholder="dein-paypal-handle"
                value={paypalHandle}
                onChange={(e) => setPaypalHandle(e.target.value)}
                disabled={loading}
                className="flex-1 px-4 py-2 border border-gray-300 border-l-0 rounded-r-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Wird verwendet für Auszahlungslinks. Siehe paypal.me/dein-handle
            </p>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Wird erstellt...' : 'Kaffeekasse erstellen'}
          </Button>
        </form>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Die Kaffeekasse wird sofort einsatzbereit. Du erhältst einen einzigartigen QR-Code zum Ausdrucken und Aufhängen.
        </p>
      </div>
    </div>
  );
}
