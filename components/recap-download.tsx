"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";

type Period = "month" | "year";

interface Props {
  slug: string;
}

const MONTH_LABELS_DE = [
  "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember",
];

/**
 * Liefert die letzten 12 abgeschlossenen Monate (ref + Label).
 */
function recentMonths(): Array<{ ref: string; label: string }> {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth(); // 0..11 (aktueller Monat)
  const out: Array<{ ref: string; label: string }> = [];
  for (let i = 1; i <= 12; i++) {
    const d = new Date(Date.UTC(y, m - i, 1));
    const yy = d.getUTCFullYear();
    const mm = d.getUTCMonth();
    out.push({
      ref: `${yy}-${String(mm + 1).padStart(2, "0")}`,
      label: `${MONTH_LABELS_DE[mm]} ${yy}`,
    });
  }
  return out;
}

function recentYears(): Array<{ ref: string; label: string }> {
  const y = new Date().getUTCFullYear();
  return [y - 1, y - 2, y - 3].map((yr) => ({
    ref: String(yr),
    label: String(yr),
  }));
}

export function RecapDownload({ slug }: Props) {
  const [period, setPeriod] = useState<Period>("month");
  const months = useMemo(recentMonths, []);
  const years = useMemo(recentYears, []);
  const defaultRef = period === "month" ? months[0].ref : years[0].ref;
  const [ref, setRef] = useState<string>(defaultRef);
  const [pending, startTransition] = useTransition();

  // Beim Wechsel des Periodentyps: Ref auf ersten Eintrag setzen
  function onPeriodChange(p: Period) {
    setPeriod(p);
    setRef(p === "month" ? months[0].ref : years[0].ref);
  }

  function onDownload() {
    startTransition(async () => {
      const url = `/api/recap/${slug}?period=${period}&ref=${encodeURIComponent(ref)}`;
      try {
        const res = await fetch(url);
        if (!res.ok) {
          const msg = await res.text();
          toast.error(`Rückblick fehlgeschlagen: ${msg.slice(0, 200)}`);
          return;
        }
        const blob = await res.blob();
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `kaffeekumpel-${slug}-${ref}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(a.href);
        toast.success("Rückblick runtergeladen ☕");
      } catch (err) {
        toast.error(
          `Netzwerkfehler: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    });
  }

  const options = period === "month" ? months : years;

  return (
    <Card>
      <CardTitle>Monats-/Jahresrückblick</CardTitle>
      <p className="mt-1 text-xs text-kaffee-700">
        PDF mit Kennzahlen, Chart, Abrechnung und einem persönlichen
        Kommentar pro Mitglied – generiert von Claude.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <div className="inline-flex rounded-lg bg-kaffee-100 p-1">
          <button
            type="button"
            onClick={() => onPeriodChange("month")}
            className={`px-3 py-1 text-sm rounded-md transition ${
              period === "month"
                ? "bg-white text-kaffee-900 shadow-sm"
                : "text-kaffee-700"
            }`}
          >
            Monat
          </button>
          <button
            type="button"
            onClick={() => onPeriodChange("year")}
            className={`px-3 py-1 text-sm rounded-md transition ${
              period === "year"
                ? "bg-white text-kaffee-900 shadow-sm"
                : "text-kaffee-700"
            }`}
          >
            Jahr
          </button>
        </div>

        <select
          value={ref}
          onChange={(e) => setRef(e.target.value)}
          className="px-3 py-1.5 text-sm rounded-lg bg-white border border-kaffee-200 text-kaffee-900"
        >
          {options.map((o) => (
            <option key={o.ref} value={o.ref}>
              {o.label}
            </option>
          ))}
        </select>

        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={onDownload}
          disabled={pending}
        >
          {pending ? "Generiere ..." : "Rückblick als PDF"}
        </Button>
      </div>

      <p className="mt-2 text-[11px] text-kaffee-600">
        Erste Generierung kann 10–30 Sek dauern – Claude schreibt für jede:n
        in eurer Gruppe einen eigenen Einzeiler.
      </p>
    </Card>
  );
}
