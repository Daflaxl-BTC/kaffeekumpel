import { Coffee, Sparkles, Milk, ShoppingBag } from "lucide-react";
import { formatEuro, relativeTimeDE } from "@/lib/utils";

interface Event {
  id: string;
  type: "coffee" | "cleaning" | "refill" | "purchase";
  member_id: string;
  product_id: string | null;
  cost_cents: number | null;
  note: string | null;
  created_at: string;
}

interface Member { id: string; name: string }
interface Product { id: string; name: string }

interface Props {
  events: Event[];
  members: Member[];
  products: Product[];
  coffeePriceCents: number;
  currency: string;
}

export function EventFeed({
  events,
  members,
  products,
  coffeePriceCents,
  currency,
}: Props) {
  if (events.length === 0) {
    return (
      <div className="bg-white/80 rounded-2xl p-6 text-center text-sm text-kaffee-700 border border-kaffee-100">
        Noch keine Aktivität. Tipp „Kaffee" oben, um loszulegen.
      </div>
    );
  }

  const memberName = (id: string) => members.find((m) => m.id === id)?.name ?? "?";
  const productName = (id: string | null) =>
    products.find((p) => p.id === id)?.name ?? "Einkauf";

  return (
    <ul className="divide-y divide-kaffee-100 bg-white/80 rounded-2xl border border-kaffee-100 overflow-hidden">
      {events.map((e) => (
        <li key={e.id} className="flex items-center gap-3 px-4 py-3">
          <div className="shrink-0 w-9 h-9 rounded-xl bg-kaffee-100 flex items-center justify-center text-kaffee-700">
            <Icon type={e.type} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm text-kaffee-900 truncate">
              <span className="font-medium">{memberName(e.member_id)}</span>{" "}
              {labelFor(e, productName, coffeePriceCents, currency)}
            </div>
            <div className="text-xs text-kaffee-700">
              {relativeTimeDE(new Date(e.created_at))}
              {e.note ? ` · ${e.note}` : ""}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function Icon({ type }: { type: Event["type"] }) {
  if (type === "coffee") return <Coffee className="w-4 h-4" />;
  if (type === "cleaning") return <Sparkles className="w-4 h-4" />;
  if (type === "refill") return <Milk className="w-4 h-4" />;
  return <ShoppingBag className="w-4 h-4" />;
}

function labelFor(
  e: Event,
  productName: (id: string | null) => string,
  coffeePriceCents: number,
  currency: string,
): string {
  if (e.type === "coffee")
    return `hat einen Kaffee (${formatEuro(coffeePriceCents, currency)}) getrunken`;
  if (e.type === "cleaning") return "hat die Maschine geputzt";
  if (e.type === "refill") return "hat nachgefüllt";
  const cost = e.cost_cents ? formatEuro(e.cost_cents, currency) : "—";
  return `hat ${productName(e.product_id)} für ${cost} gekauft`;
}
