"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { saveProfile } from "./actions";

interface Props {
  slug: string;
  defaultName: string;
  defaultEmail: string;
  defaultPaypalHandle: string;
}

type Status = "idle" | "saving" | "saved";

export function ProfileForm({
  slug,
  defaultName,
  defaultEmail,
  defaultPaypalHandle,
}: Props) {
  const [, startTransition] = useTransition();
  const [status, setStatus] = useState<Status>("idle");

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (status !== "idle") return;
    const fd = new FormData(e.currentTarget);
    fd.set("slug", slug);
    setStatus("saving");
    startTransition(async () => {
      try {
        await saveProfile(fd);
        setStatus("saved");
        setTimeout(() => setStatus("idle"), 1800);
      } catch (err) {
        setStatus("idle");
        toast.error(err instanceof Error ? err.message : "Fehler beim Speichern");
      }
    });
  };

  return (
    <form
      onSubmit={submit}
      className="space-y-5 bg-white/80 rounded-2xl p-6 border border-kaffee-100"
    >
      <div>
        <label className="block text-sm font-medium text-kaffee-900 mb-1">
          Name
        </label>
        <input
          name="name"
          defaultValue={defaultName}
          required
          maxLength={50}
          className="w-full rounded-xl border border-kaffee-100 bg-white px-4 py-3"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-kaffee-900 mb-1">
          E-Mail{" "}
          <span className="text-kaffee-700/70 font-normal">(optional)</span>
        </label>
        <input
          name="email"
          type="email"
          defaultValue={defaultEmail}
          maxLength={200}
          placeholder="für Monatsabrechnungen später"
          className="w-full rounded-xl border border-kaffee-100 bg-white px-4 py-3"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-kaffee-900 mb-1">
          PayPal-Handle
        </label>
        <input
          name="paypalHandle"
          defaultValue={defaultPaypalHandle}
          maxLength={40}
          placeholder="felixbredl (ohne @)"
          className="w-full rounded-xl border border-kaffee-100 bg-white px-4 py-3"
        />
        <p className="mt-1 text-xs text-kaffee-700/70">
          Ohne @, nur der Teil nach paypal.me/ — nötig damit andere dir direkt
          was überweisen können.
        </p>
      </div>

      <Button
        type="submit"
        size="lg"
        disabled={status !== "idle"}
        className={`w-full relative overflow-hidden transition-colors ${
          status === "saved" ? "!bg-green-600 hover:!bg-green-600" : ""
        }`}
      >
        <span
          className={`inline-flex items-center gap-2 transition-opacity duration-200 ${
            status === "idle" ? "opacity-100" : "opacity-0"
          }`}
        >
          Speichern
        </span>
        {status === "saving" && (
          <span className="absolute inset-0 flex items-center justify-center">
            <Spinner />
          </span>
        )}
        {status === "saved" && (
          <span className="absolute inset-0 flex items-center justify-center gap-2 text-white">
            <Checkmark />
            <span className="font-medium">Gespeichert</span>
          </span>
        )}
      </Button>
    </form>
  );
}

function Spinner() {
  return (
    <svg
      className="animate-spin h-6 w-6 text-white"
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeOpacity="0.25"
        strokeWidth="3"
      />
      <path
        d="M22 12a10 10 0 0 1-10 10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Checkmark() {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 52 52"
      className="shrink-0"
      aria-hidden
    >
      <circle
        cx="26"
        cy="26"
        r="24"
        fill="none"
        stroke="white"
        strokeWidth="3"
        strokeDasharray="160"
        strokeDashoffset="160"
        style={{
          animation: "kk-check-circle 420ms ease-out forwards",
        }}
      />
      <path
        d="M14 27 L23 36 L39 18"
        fill="none"
        stroke="white"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="48"
        strokeDashoffset="48"
        style={{
          animation: "kk-check-path 360ms 360ms ease-out forwards",
        }}
      />
      <style>{`
        @keyframes kk-check-circle {
          to { stroke-dashoffset: 0; }
        }
        @keyframes kk-check-path {
          to { stroke-dashoffset: 0; }
        }
      `}</style>
    </svg>
  );
}
