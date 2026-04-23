"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { requestMagicLink } from "./magic-actions";

export function MagicLinkForm({
  slug,
  defaultEmail,
}: {
  slug: string;
  defaultEmail: string;
}) {
  const [state, action, pending] = useActionState(requestMagicLink, null);

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="slug" value={slug} />
      <div>
        <label className="block text-sm font-medium text-kaffee-900 mb-1">
          E-Mail-Adresse
        </label>
        <input
          name="email"
          type="email"
          required
          defaultValue={defaultEmail}
          placeholder="felix@example.com"
          className="w-full rounded-xl border border-kaffee-100 bg-white px-4 py-3"
        />
      </div>
      <Button type="submit" size="md" disabled={pending}>
        {pending ? "Sende…" : "Login-Link senden"}
      </Button>
      {state && (
        <p
          className={
            state.ok
              ? "text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg p-3"
              : "text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg p-3"
          }
        >
          {state.message}
        </p>
      )}
      <p className="text-xs text-kaffee-700/70">
        Der Link ist 30 Minuten gültig und funktioniert nur für dein Profil
        in dieser Gruppe. Gut für: Handy verloren, neuer Laptop, Inkognito-
        Modus.
      </p>
    </form>
  );
}
