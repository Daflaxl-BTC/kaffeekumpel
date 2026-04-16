/**
 * Settlement-Berechnung:
 *   1) Aus Events pro Mitglied einen Saldo in Cents bilden.
 *      - Wer Kaffee getrunken hat: -coffee_price_cents
 *      - Wer eingekauft hat (purchase): +cost_cents
 *      - cleaning, refill: kostenneutral (affect nichts an den Schulden;
 *        refill nur dann mit Kosten wenn cost_cents gesetzt ist — dann wie purchase)
 *
 *   2) Greedy-Minimierung: größter Schuldner zahlt dem größten Gläubiger,
 *      bis alle ausgeglichen sind. Resultiert in höchstens (n-1) Überweisungen
 *      bei n Mitgliedern — oft weniger.
 *
 *   3) Alle Beträge in ganzen Cents → rundungssicher.
 */

export type EventType = "coffee" | "cleaning" | "refill" | "purchase";

export interface SettlementEvent {
  member_id: string;
  type: EventType;
  cost_cents?: number | null;
}

export interface MemberBalance {
  member_id: string;
  balance_cents: number; // positiv = Guthaben, negativ = Schulden
}

export interface Transfer {
  from_member_id: string;
  to_member_id: string;
  amount_cents: number;
}

/**
 * Rechnet aus Events die Salden pro Mitglied aus.
 *
 * @param events die Events im Abrechnungs-Zeitraum
 * @param coffeePriceCents fixer Preis pro Kaffee (aus group.coffee_price_cents)
 * @param memberIds alle Mitglieder der Gruppe (damit auch die mit 0-Saldo auftauchen)
 */
export function calculateBalances(
  events: SettlementEvent[],
  coffeePriceCents: number,
  memberIds: string[],
): MemberBalance[] {
  const balances = new Map<string, number>();
  for (const id of memberIds) balances.set(id, 0);

  for (const e of events) {
    const current = balances.get(e.member_id) ?? 0;
    if (e.type === "coffee") {
      balances.set(e.member_id, current - coffeePriceCents);
    } else if (e.type === "purchase" || (e.type === "refill" && e.cost_cents)) {
      const cost = e.cost_cents ?? 0;
      if (cost > 0) balances.set(e.member_id, current + cost);
    }
    // cleaning + cost-less refill sind kostenneutral
  }

  return [...balances.entries()].map(([member_id, balance_cents]) => ({
    member_id,
    balance_cents,
  }));
}

/**
 * Greedy-Minimierung der Transfers.
 */
export function minimizeTransfers(balances: MemberBalance[]): Transfer[] {
  // Kopien, nicht Originale mutieren
  const creditors: MemberBalance[] = [];
  const debtors: MemberBalance[] = [];

  for (const b of balances) {
    if (b.balance_cents > 0) creditors.push({ ...b });
    else if (b.balance_cents < 0) debtors.push({ ...b });
  }

  // Rundungs-Invariante: Summe aller Salden muss 0 sein (Cents).
  // Kleine Differenz durch Integer-Division in coffee_price darf es nicht geben,
  // weil wir eh nur in Cents operieren.
  const sum = balances.reduce((acc, b) => acc + b.balance_cents, 0);
  if (sum !== 0) {
    // Defensive: größtem Gläubiger die Differenz abziehen bzw. schenken,
    // damit 0-Summe garantiert ist (passiert eigentlich nur bei Datenkorruption).
    if (creditors.length > 0) {
      creditors.sort((a, b) => b.balance_cents - a.balance_cents);
      creditors[0].balance_cents -= sum;
    }
  }

  creditors.sort((a, b) => b.balance_cents - a.balance_cents);
  debtors.sort((a, b) => a.balance_cents - b.balance_cents); // negativstes zuerst

  const transfers: Transfer[] = [];
  let ci = 0;
  let di = 0;

  while (ci < creditors.length && di < debtors.length) {
    const cred = creditors[ci];
    const deb = debtors[di];

    const amount = Math.min(cred.balance_cents, -deb.balance_cents);
    if (amount > 0) {
      transfers.push({
        from_member_id: deb.member_id,
        to_member_id: cred.member_id,
        amount_cents: amount,
      });
    }
    cred.balance_cents -= amount;
    deb.balance_cents += amount;
    if (cred.balance_cents === 0) ci++;
    if (deb.balance_cents === 0) di++;
  }

  return transfers;
}

/**
 * Convenience: Events → fertige Transfer-Liste.
 */
export function computeSettlement(
  events: SettlementEvent[],
  coffeePriceCents: number,
  memberIds: string[],
): { balances: MemberBalance[]; transfers: Transfer[] } {
  const balances = calculateBalances(events, coffeePriceCents, memberIds);
  const transfers = minimizeTransfers(balances);
  return { balances, transfers };
}
