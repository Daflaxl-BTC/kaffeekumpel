"use client";

import { useActionState, useTransition } from "react";
import { createGroup } from "./actions";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertCircle, Loader2 } from "lucide-react";

interface ActionState {
  success?: boolean;
  error?: string;
  slug?: string;
  token?: string;
}

export default function NewGroupPage() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(async (prevState, formData) => {
    const result = await createGroup(formData);
    return result as ActionState;
  }, {});

  // Redirect on success
  useEffect(() => {
    if (state.success && state.slug) {
      const url = `/g/${state.slug}`;
      // Set cookie with token if provided
      if (state.token) {
        document.cookie = `session=${state.token}; path=/; max-age=31536000; HttpOnly; SameSite=Lax`;
      }
      router.push(url);
    }
  }, [state.success, state.slug, state.token, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <div className="p-8">
          <h1 className="text-3xl font-bold mb-2 text-gray-900">☕ Neue Kaffeekasse</h1>
          <p className="text-gray-600 mb-6">Für deine WG, dein Büro oder deine Crew.</p>

          {/* Error Alert */}
          {state.error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-900">Fehler beim Erstellen</p>
                <p className="text-sm text-red-800 mt-1">{state.error}</p>
              </div>
            </div>
          )}

          <form action={formAction} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Gruppen-Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="z. B. WG Hauptstr. 42"
                required
                disabled={isPending}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label htmlFor="paypal_handle" className="block text-sm font-medium text-gray-700 mb-1">
                PayPal.me Handle
              </label>
              <input
                id="paypal_handle"
                name="paypal_handle"
                type="text"
                placeholder="z. B. deinname"
                required
                disabled={isPending}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">Dein PayPal.me Username (z. B. paypal.me/deinname)</p>
            </div>

            <Button
              type="submit"
              disabled={isPending}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold py-2 rounded-lg hover:from-orange-600 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Wird erstellt...
                </>
              ) : (
                "Kaffeekasse erstellen"
              )}
            </Button>
          </form>

          <p className="text-xs text-gray-500 text-center mt-4">
            Nach dem Erstellen bekommst du einen QR-Code, den du neben die Kaffeemaschine hängst. Fertig! 🎉
          </p>
        </div>
      </Card>
    </div>
  );
}
