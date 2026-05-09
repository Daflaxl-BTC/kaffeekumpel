import type { Transfer } from "@/lib/settlement/calculate";

/**
 * Filtert Transfers, die `memberId` involvieren, und sortiert sie:
 *   - Empfänger-Transfers (memberId = to_member_id) zuerst
 *   - innerhalb gleicher Richtung absteigend nach Betrag
 *   - 0-Beträge fallen raus (algorithmisch sollte das nicht passieren,
 *     aber Defensive)
 */
export function filterAndSortTransfers(
  transfers: Transfer[],
  memberId: string,
): Transfer[] {
  return transfers
    .filter(
      (t) =>
        t.amount_cents > 0 &&
        (t.from_member_id === memberId || t.to_member_id === memberId),
    )
    .sort((a, b) => {
      const aIncoming = a.to_member_id === memberId ? 0 : 1;
      const bIncoming = b.to_member_id === memberId ? 0 : 1;
      if (aIncoming !== bIncoming) return aIncoming - bIncoming;
      return b.amount_cents - a.amount_cents;
    });
}
