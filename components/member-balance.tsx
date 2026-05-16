import { formatEuro } from "@/lib/utils";

interface Member { id: string; name: string }
interface Balance { member_id: string; balance_cents: number }

interface Props {
  members: Member[];
  balances: Balance[];
  currency: string;
}

export function MemberBalance({ members, balances, currency }: Props) {
  const byId = new Map(balances.map((b) => [b.member_id, b.balance_cents]));
  return (
    <ul className="grid sm:grid-cols-2 gap-2">
      {members.map((m) => {
        const bal = byId.get(m.id) ?? 0;
        const positive = bal > 0;
        const zero = bal === 0;
        return (
          <li
            key={m.id}
            className="flex items-center justify-between bg-white rounded-xl px-3 py-2 border border-kaffee-100"
          >
            <span className="text-sm text-kaffee-900 font-medium">{m.name}</span>
            <span
              className={`text-sm tabular-nums font-semibold rounded-md px-2 py-0.5 ${
                zero
                  ? "text-kaffee-700 bg-kaffee-50"
                  : positive
                    ? "text-leaf-dark bg-leaf-light/15"
                    : "text-red-800 bg-red-50"
              }`}
            >
              {zero
                ? "± 0,00"
                : positive
                  ? `+ ${formatEuro(bal, currency)}`
                  : `− ${formatEuro(-bal, currency)}`}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
