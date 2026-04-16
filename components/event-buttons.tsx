"use client";

import { useState, useTransition } from "react";
import { Coffee, Sparkles, Milk } from "lucide-react";
import { toast } from "sonner";
import { tapEvent } from "@/app/g/[slug]/actions";
import { formatEuro } from "@/lib/utils";

interface Props {
  slug: string;
  memberId: string;
  coffeePriceCents: number;
  currency: string;
}

export function EventButtons({ slug, coffeePriceCents, currency }: Props) {
  const [pending, startTransition] = useTransition();
  const [lastTap, setLastTap] = useState<string | null>(null);

  const tap = (type: "coffee" | "cleaning" | "refill") => {
    setLastTap(type);
    startTransition(async () => {
      try {
        await tapEvent({ slug, type });
        if (type === "coffee") toast.success("☕ gebucht");
        if (type === "cleaning") toast.success("🧹 geputzt — du bist ein Schatz");
        if (type === "refill") toast.success("🥛 aufgefüllt");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Fehler");
      }
    });
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      <TapButton
        onClick={() => tap("coffee")}
        disabled={pending}
        highlight={lastTap === "coffee" && pending}
        icon={<Coffee className="w-6 h-6" />}
        title="Kaffee"
        subtitle={formatEuro(coffeePriceCents, currency)}
        tint="bg-kaffee-700 text-white hover:bg-kaffee-900"
      />
      <TapButton
        onClick={() => tap("cleaning")}
        disabled={pending}
        highlight={lastTap === "cleaning" && pending}
        icon={<Sparkles className="w-6 h-6" />}
        title="Geputzt"
        subtitle="setzt Rotation"
        tint="bg-emerald-700 text-white hover:bg-emerald-800"
      />
      <TapButton
        onClick={() => tap("refill")}
        disabled={pending}
        highlight={lastTap === "refill" && pending}
        icon={<Milk className="w-6 h-6" />}
        title="Nachgefüllt"
        subtitle="Milch / Filter"
        tint="bg-sky-700 text-white hover:bg-sky-800"
      />
      <a
        href={`/api/qr/${slug}?format=png`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex flex-col items-center justify-center gap-1 rounded-2xl bg-kaffee-100 text-kaffee-900 px-4 py-6 hover:bg-kaffee-300/60 transition-all"
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
  highlight,
  icon,
  title,
  subtitle,
  tint,
}: {
  onClick: () => void;
  disabled?: boolean;
  highlight?: boolean;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  tint: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-col items-center justify-center gap-1 rounded-2xl px-4 py-6 transition-all active:scale-[0.97] disabled:opacity-60 ${tint} ${
        highlight ? "ring-4 ring-white/40" : ""
      }`}
    >
      {icon}
      <span className="text-base font-semibold">{title}</span>
      <span className="text-xs opacity-80">{subtitle}</span>
    </button>
  );
}
