"use client";

import { useState, useTransition } from "react";
import { Coffee, Sparkles, Milk, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { tapEvent } from "@/app/g/[slug]/actions";
import { formatEuro } from "@/lib/utils";

interface Props {
  slug: string;
  memberId: string;
  coffeePriceCents: number;
  currency: string;
}

type TapType = "coffee" | "cleaning" | "refill";

export function EventButtons({ slug, coffeePriceCents, currency }: Props) {
  const [pending, startTransition] = useTransition();
  const [activeTap, setActiveTap] = useState<TapType | null>(null);
  const [justDone, setJustDone] = useState<TapType | null>(null);

  const tap = (type: TapType) => {
    if (pending) return;
    setActiveTap(type);
    startTransition(async () => {
      try {
        await tapEvent({ slug, type });
        if (type === "coffee") toast.success("☕ gebucht");
        if (type === "cleaning")
          toast.success("🧹 geputzt — du bist ein Schatz");
        if (type === "refill") toast.success("🥛 aufgefüllt");
        setJustDone(type);
        setTimeout(() => setJustDone((prev) => (prev === type ? null : prev)), 1400);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Fehler");
      } finally {
        setActiveTap(null);
      }
    });
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      <TapButton
        onClick={() => tap("coffee")}
        disabled={pending}
        loading={activeTap === "coffee"}
        success={justDone === "coffee"}
        icon={<Coffee className="w-6 h-6" />}
        title="Kaffee"
        subtitle={formatEuro(coffeePriceCents, currency)}
        tint="bg-kaffee-700 text-white hover:bg-kaffee-900"
      />
      <TapButton
        onClick={() => tap("cleaning")}
        disabled={pending}
        loading={activeTap === "cleaning"}
        success={justDone === "cleaning"}
        icon={<Sparkles className="w-6 h-6" />}
        title="Geputzt"
        subtitle="setzt Rotation"
        tint="bg-leaf text-white hover:bg-leaf-dark"
      />
      <TapButton
        onClick={() => tap("refill")}
        disabled={pending}
        loading={activeTap === "refill"}
        success={justDone === "refill"}
        icon={<Milk className="w-6 h-6" />}
        title="Nachgefüllt"
        subtitle="Milch / Filter"
        tint="bg-kaffee-500 text-white hover:bg-kaffee-600"
      />
      <a
        href={`/api/qr/${slug}?format=png`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex flex-col items-center justify-center gap-1 rounded-2xl bg-kaffee-100 text-kaffee-900 border-2 border-dashed border-kaffee-300 px-4 py-6 hover:bg-kaffee-200 hover:border-kaffee-500 transition-all"
      >
        <span className="text-xs font-medium text-kaffee-700">QR-Code</span>
        <span className="text-base font-semibold">zum Schild</span>
      </a>
    </div>
  );
}

function TapButton({
  onClick,
  disabled,
  loading,
  success,
  icon,
  title,
  subtitle,
  tint,
}: {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  success?: boolean;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  tint: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-busy={loading || undefined}
      className={`relative overflow-hidden flex flex-col items-center justify-center gap-1 rounded-2xl px-4 py-6 transition-all duration-150 active:scale-[0.96] disabled:opacity-60 disabled:cursor-not-allowed ${tint} ${
        loading ? "ring-4 ring-white/50" : ""
      } ${success ? "ring-4 ring-white/70" : ""}`}
    >
      {/* Success-Pulse-Overlay */}
      {success && (
        <span
          aria-hidden="true"
          className="absolute inset-0 bg-white/25 animate-tap-pulse pointer-events-none"
        />
      )}
      <div className="relative w-6 h-6 flex items-center justify-center">
        {loading ? (
          <Loader2 className="w-6 h-6 animate-spin" />
        ) : success ? (
          <Check className="w-6 h-6" strokeWidth={3} />
        ) : (
          icon
        )}
      </div>
      <span className="relative text-base font-semibold">{title}</span>
      <span className="relative text-xs opacity-80">{subtitle}</span>
    </button>
  );
}
