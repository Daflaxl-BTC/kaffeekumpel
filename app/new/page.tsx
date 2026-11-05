'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createGroup } from './actions';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Coffee } from 'lucide-react';

export default function NewGroupPage() {
  const router = useRouter();
  const [groupName, setGroupName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (!groupName.trim()) {
        throw new Error('Please enter a group name');
      }

      const result = await createGroup(groupName);

      if (result.success) {
        // Redirect zur neuen Gruppe
        router.push(`/g/${result.slug}`);
      } else {
        throw new Error('Failed to create group');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(message);
      console.error('Failed to create group:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <div className="p-8">
          <div className="flex justify-center mb-6">
            <div className="bg-orange-100 p-3 rounded-full">
              <Coffee className="w-8 h-8 text-orange-600" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">Neue Kaffeekasse</h1>
          <p className="text-center text-gray-600 mb-8">
            Erstelle eine neue Kaffeekasse für deine Crew
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="groupName" className="block text-sm font-medium text-gray-700 mb-2">
                Kassennamen eingeben
              </label>
              <input
                id="groupName"
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="z. B. WG Langer Weg"
                disabled={isLoading}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none disabled:bg-gray-100"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">
                  <strong>Error:</strong> {error}
                </p>
                <p className="text-xs text-red-700 mt-1">
                  Bitte versuche es erneut oder kontaktiere den Support.
                </p>
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading || !groupName.trim()}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Generiere QR-Code...' : 'Kaffeekasse erstellen'}
            </Button>
          </form>

          <p className="text-xs text-gray-500 text-center mt-6">
            💡 Tipp: Der QR-Code wird direkt an der Maschine ausgedruckt.
          </p>
        </div>
      </Card>
    </div>
  );
}
