"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { saveProfile } from "./actions";

interface Props {
  slug: string;
  initialName: string;
  initialEmail: string;
  initialPaypal: string;
}

export function ProfileForm({
  slug,
  initialName,
  initialEmail,
  initialPaypal,
}: Props) {
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [paypal, setPaypal] = useState(initialPaypal);
  const [pending, startTransition] = useTransition();
  const [justSaved, setJustSaved] = useState(false);

  const dirty =
    name !== initialName ||
    email !== initialEmail ||
    paypal !== initialPaypal;

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!dirty || pending) return;

    startTransition(async () => {
      try {
        await saveProfile(slug, {
          name: name.trim(),
          email: email.trim(),
          paypalHandle: paypal.trim(),
        });
        toast.success("Gespeichert ☕");
        setJustSaved(true);
        setTimeout(() => setJustSaved(false), 2000);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Fehler");
      }
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-5 bg-white rounded-2xl p-6 border border-kaffee-100 shadow-sm"
    >
      <Field label="Name">
        <input
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={50}
          className="w-full rounded-xl border border-kaffee-100 bg-white px-4 py-3 focus:outline-none focus:border-kaffee-500 focus:ring-2 focus:ring-kaffee-500/20 transition-colors"
        />
      </Field>

      <Field
        label={
          <>
            E-Mail{" "}
            <span className="text-kaffee-700 font-normal">(optional)</span>
          </>
        }
      >
        <input
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          maxLength={200}
          placeholder="für Monatsabrechnungen später"
          className="w-full rounded-xl border border-kaffee-100 bg-white px-4 py-3 focus:outline-none focus:border-kaffee-500 focus:ring-2 focus:ring-kaffee-500/20 transition-colors"
        />
      </Field>

      <Field label="PayPal-Handle">
        <input
          name="paypalHandle"
          value={paypal}
          onChange={(e) => setPaypal(e.target.value)}
          maxLength={40}
          placeholder="felixbredl (ohne @)"
          className="w-full rounded-xl border border-kaffee-100 bg-white px-4 py-3 focus:outline-none focus:border-kaffee-500 focus:ring-2 focus:ring-kaffee-500/20 transition-colors"
        />
        <p className="mt-1.5 text-xs text-kaffee-800">
          Ohne @, nur der Teil nach paypal.me/ — nötig damit andere dir
          direkt was überweisen können.
        </p>
      </Field>

      <Button
        type="submit"
        size="lg"
        loading={pending}
        disabled={!dirty && !justSaved}
        className="w-full"
      >
        {justSaved ? (
          <>
            <Check className="w-5 h-5" strokeWidth={3} />
            Gespeichert
          </>
        ) : pending ? (
          "Speichert…"
        ) : dirty ? (
          "Speichern"
        ) : (
          "Keine Änderungen"
        )}
      </Button>
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-kaffee-900 mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}
