import { formatEuro } from "@/lib/utils";
import type { Transfer } from "@/lib/settlement/calculate";
import type { PeriodMember } from "@/lib/settlement/period";
import { OpenPaymentsTrigger } from "@/components/open-payments/open-payments-trigger";

interface Balance {
  member_id: string;
  balance_cents: number;
}

interface Props {
  members: PeriodMember[];
  allMembers: PeriodMember[];
  balances: Balance[];
  transfers: Transfer[];
  currency: string;
  currentMemberId: string;
}

export function MemberBalance({
  members,
  allMembers,
  balances,
  transfers,
  currency,
  currentMemberId,
}: Props) {
  const byId = new Map(balances.map((b) => [b.member_id, b.balance_cents]));
  return (
    <ul className="grid sm:grid-cols-2 gap-2">
      {members.map((m) => {
        const bal = byId.get(m.id) ?? 0;
        const positive = bal > 0;
        const zero = bal === 0;
        const row = (
          <div className="flex items-center justify-between bg-white/80 rounded-xl px-3 py-2 border border-kaffee-100 min-h-[44px]">
            <span className="text-sm text-kaffee-900 font-medium">{m.name}</span>
            <span
              className={`text-sm tabular-nums ${
                zero
                  ? "text-kaffee-700"
                  : positive
                    ? "text-green-700 font-semibold"
                    : "text-red-700 font-semibold"
              }`}
            >
              {zero
                ? "± 0,00"
                : positive
                  ? `+ ${formatEuro(bal, currency)}`
                  : `− ${formatEuro(-bal, currency)}`}
            </span>
          </div>
        );
        return (
          <li key={m.id}>
            <OpenPaymentsTrigger
              member={m}
              isCurrentUser={m.id === currentMemberId}
              currentMemberId={currentMemberId}
              transfers={transfers}
              members={allMembers}
              currency={currency}
            >
              {row}
            </OpenPaymentsTrigger>
          </li>
        );
      })}
    </ul>
  );
}
