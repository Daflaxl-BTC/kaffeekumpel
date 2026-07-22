'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const TIMEOUT_MS = 10000; // 10 second timeout

interface CreateGroupInput {
  name: string;
  location: string;
  paypalHandle?: string;
}

export default function NewGroupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateGroupInput>({
    name: '',
    location: '',
    paypalHandle: '',
  });

  const validateInput = (data: CreateGroupInput): string | null => {
    if (!data.name?.trim()) {
      return 'Gruppennamen eingeben';
    }
    if (data.name.length > 100) {
      return 'Gruppenname zu lang (max. 100 Zeichen)';
    }
    if (!data.location?.trim()) {
      return 'Ort eingeben';
    }
    if (data.location.length > 100) {
      return 'Ort zu lang (max. 100 Zeichen)';
    }
    if (data.paypalHandle && !/^[a-zA-Z0-9._-]+$/.test(data.paypalHandle)) {
      return 'PayPal-Handle ungültig (nur Buchstaben, Zahlen, ., _, -)';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client-side validation
    const validationError = validateInput(formData);
    if (validationError) {
      setError(validationError);
      toast.error(validationError);
      return;
    }

    setIsLoading(true);

    try {
      // Wrap in timeout promise
      const createGroupWithTimeout = Promise.race([
        fetch('/api/v1/groups', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name.trim(),
            location: formData.location.trim(),
            paypal_handle: formData.paypalHandle?.trim() || null,
          }),
          credentials: 'include', // Ensure cookies are sent
        }),
        new Promise<Response>((_, reject) =>
          setTimeout(
            () => reject(new Error('Anfrage timeout (10s) — versuchen Sie es später erneut')),
            TIMEOUT_MS
          )
        ),
      ]);

      const response = (await createGroupWithTimeout) as Response;

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.error || `Fehler beim Erstellen der Gruppe (${response.status})`;
        throw new Error(errorMsg);
      }

      const data = await response.json();
      const slug = data.slug;

      if (!slug) {
        throw new Error('Ungültige Server-Antwort (kein Slug)');
      }

      // Redirect to new group
      toast.success('Gruppe erstellt!');
      router.push(`/g/${slug}`);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten';
      setError(errorMessage);
      console.error('[CreateGroup] Error:', err);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Neue Kaffeekasse</h1>
          <p className="text-gray-600 text-sm mb-6">Erstelle deine erste Kaffee-Gruppe</p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gruppenname
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="z.B. Büro Kaffee"
                disabled={isLoading}
                maxLength={100}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ort
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="z.B. 3. Stock"
                disabled={isLoading}
                maxLength={100}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                PayPal-Handle (optional)
              </label>
              <input
                type="text"
                value={formData.paypalHandle}
                onChange={(e) => setFormData({ ...formData, paypalHandle: e.target.value })}
                placeholder="z.B. dein.name"
                disabled={isLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:bg-gray-100"
              />
              <p className="text-xs text-gray-500 mt-1">Für PayPal-Zahlungslinks</p>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium py-2 rounded-lg transition"
            >
              {isLoading ? 'Erstelle Gruppe...' : 'Gruppe erstellen'}
            </Button>
          </form>

          <p className="text-xs text-gray-500 text-center mt-4">
            Die Gruppe erhält einen QR-Code, den du neben die Kaffeemaschine hängst.
          </p>
        </div>
      </Card>
    </div>
  );
}
