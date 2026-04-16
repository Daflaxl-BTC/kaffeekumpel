/**
 * Reinigungs-Rotation: "Wer ist dran?"
 *
 * Algorithmus:
 *   - Aus den Events: wer hat zuletzt geputzt? (type = 'cleaning')
 *   - Unter den aktiven Mitgliedern: derjenige, der am längsten nicht geputzt hat,
 *     ist dran. Mitglieder die noch nie geputzt haben: sortiert nach Beitrittsdatum.
 *   - "Überfällig" ab `cleaning_interval_days` Tage seit letzter Reinigung der Gruppe.
 */

export interface CleaningMember {
  id: string;
  name: string;
  created_at: string; // ISO
  active: boolean;
}

export interface CleaningEvent {
  member_id: string;
  created_at: string; // ISO
}

export type CleaningUrgency = "ok" | "due_soon" | "overdue";

export interface CleaningStatus {
  next_up: CleaningMember | null;
  last_cleaned_by: CleaningMember | null;
  last_cleaned_at: Date | null;
  days_since_last: number | null;
  urgency: CleaningUrgency;
}

export function computeCleaningStatus(
  members: CleaningMember[],
  cleaningEvents: CleaningEvent[],
  cleaningIntervalDays: number,
  now: Date = new Date(),
): CleaningStatus {
  const activeMembers = members.filter((m) => m.active);

  if (activeMembers.length === 0) {
    return {
      next_up: null,
      last_cleaned_by: null,
      last_cleaned_at: null,
      days_since_last: null,
      urgency: "ok",
    };
  }

  // Letzte Reinigung pro Mitglied
  const lastCleanByMember = new Map<string, Date>();
  for (const ev of cleaningEvents) {
    const d = new Date(ev.created_at);
    const prev = lastCleanByMember.get(ev.member_id);
    if (!prev || d > prev) lastCleanByMember.set(ev.member_id, d);
  }

  // Wer ist am längsten her / hat nie?
  const ranked = [...activeMembers].sort((a, b) => {
    const aLast = lastCleanByMember.get(a.id)?.getTime() ?? -Infinity;
    const bLast = lastCleanByMember.get(b.id)?.getTime() ?? -Infinity;
    if (aLast !== bLast) return aLast - bLast; // ältestes zuerst
    // Tiebreak: wer früher der Gruppe beigetreten ist
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });

  // Letzte Reinigung der Gruppe
  let lastCleanedAt: Date | null = null;
  let lastCleanedById: string | null = null;
  for (const ev of cleaningEvents) {
    const d = new Date(ev.created_at);
    if (!lastCleanedAt || d > lastCleanedAt) {
      lastCleanedAt = d;
      lastCleanedById = ev.member_id;
    }
  }
  const lastCleanedBy =
    activeMembers.find((m) => m.id === lastCleanedById) ?? null;

  const daysSince =
    lastCleanedAt === null
      ? null
      : Math.floor((now.getTime() - lastCleanedAt.getTime()) / 86_400_000);

  let urgency: CleaningUrgency = "ok";
  if (daysSince === null) {
    urgency = "overdue"; // nie geputzt → sofort fällig
  } else if (daysSince > cleaningIntervalDays) {
    urgency = "overdue";
  } else if (daysSince >= cleaningIntervalDays - 2) {
    urgency = "due_soon";
  }

  return {
    next_up: ranked[0] ?? null,
    last_cleaned_by: lastCleanedBy,
    last_cleaned_at: lastCleanedAt,
    days_since_last: daysSince,
    urgency,
  };
}
