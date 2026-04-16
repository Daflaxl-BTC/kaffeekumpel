import type { CleaningStatus } from "@/lib/cleaning";
import { Sparkles } from "lucide-react";

interface Props {
  status: CleaningStatus;
  currentMemberId: string;
  groupSlug: string;
}

export function CleaningBanner({ status, currentMemberId }: Props) {
  const { next_up, urgency, days_since_last, last_cleaned_by } = status;
  if (!next_up) return null;

  const youAreNext = next_up.id === currentMemberId;
  const tint =
    urgency === "overdue"
      ? "bg-red-50 border-red-200 text-red-900"
      : urgency === "due_soon"
        ? "bg-amber-50 border-amber-200 text-amber-900"
        : "bg-emerald-50 border-emerald-200 text-emerald-900";

  return (
    <div className={`rounded-2xl border px-4 py-3 flex items-center gap-3 ${tint}`}>
      <div className="shrink-0 w-9 h-9 rounded-xl bg-white/80 flex items-center justify-center">
        <Sparkles className="w-5 h-5" />
      </div>
      <div className="text-sm">
        {youAreNext ? (
          <>
            <div className="font-semibold">Du bist dran mit Putzen 🙌</div>
            <div className="text-xs opacity-80">
              {days_since_last === null
                ? "Noch nie geputzt."
                : `Zuletzt vor ${days_since_last} Tag${days_since_last === 1 ? "" : "en"}${last_cleaned_by ? ` von ${last_cleaned_by.name}` : ""}`}
            </div>
          </>
        ) : (
          <>
            <div className="font-semibold">
              Als Nächstes: {next_up.name}
            </div>
            <div className="text-xs opacity-80">
              {days_since_last === null
                ? "Noch nie geputzt."
                : `${days_since_last} Tag${days_since_last === 1 ? "" : "e"} seit der letzten Reinigung${last_cleaned_by ? ` (${last_cleaned_by.name})` : ""}.`}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
