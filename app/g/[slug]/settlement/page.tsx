import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { supabaseService } from "@/lib/supabase/server";
import { readSessionCookie } from "@/lib/auth/session";
import { computeSettlement } from "@/lib/settlement/calculate";
import { buildPaypalMeLink } from "@/lib/settlement/paypal";
import { formatEuro } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FinalizeButton } from "./finalize-button";

export default async function SettlementPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await readSessionCookie(slug);
  if (!session) redirect(`/g/${slug}/join`);

  const sb = supabaseService();

  const { data: group } = await sb
    .from("groups")
    .select("*")
    .eq("slug", slug)
    .single();
  if (!group) notFound();

  // Aktueller Abrechnungs-Zeitraum: seit letztem Settlement bis jetzt
  const { data: lastSettlement } = await sb
    .from("settlements")
    .select("finalized_at, covered_to")
    .eq("group_id", group.id)
    .order("finalized_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const coveredFrom = lastSettlement
    ? new Date(lastSettlement.covered_to)
    : new Date(group.created_at);

  const [{ data: members }, { data: events }] = await Promise.all([
    sb.from("members").select("*").eq("group_id", group.id).eq("active", true),
    sb
      .from("events")
      .select("*")
      .eq("group_id", group.id)
      .gt("created_at", coveredFrom.toISOString()),
  ]);

  const memberList = members ?? [];
  const eventList = events ?? [];

  const { balances, transfers } = computeSettlement(
    eventList.map((e) => ({
      member_id: e.member_id,
      type: e.type,
      cost_cents: e.cost_cents,
    })),
    group.coffee_price_cents,
    memberList.map((m) => m.id),
  );

  const memberById = new Map(memberList.map((m) => [m.id, m]));
  const isAdmin =
    memberList.find((m) => m.id === session.member_id)?.role === "admin";

  return (
    <main className="min-h-screen max-w-2xl mx-auto px-4 pt-6 pb-24">
      <div className="mb-4">
        <Link
          href={`/g/${slug}`}
          className="text-sm text-kaffee-700 hover:underline"
        >
          ← zurück zur Gruppe
        </Link>
        <h1 className="text-2xl font-bold text-kaffee-900 mt-2">Abrechnung</h1>
        <p className="text-sm text-kaffee-700">
          Stand seit{" "}
          {coveredFrom.toLocaleDateString("de-DE", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </p>
      </div>

      <section className="mb-6">
        <h2 className="text-sm font-semibold text-kaffee-700 mb-2">Stand</h2>
        <div className="grid gap-2">
          {balances.map((b) => {
            const m = memberById.get(b.member_id);
            if (!m) return null;
            const positive = b.balance_cents > 0;
            const zero = b.balance_cents === 0;
            return (
              <div
                key={b.member_id}
                className="flex items-center justify-between bg-white/80 rounded-xl p-3 border border-kaffee-100"
              >
                <span className="text-kaffee-900 font-medium">{m.name}</span>
                <span
                  className={
                    zero
                      ? "text-kaffee-700"
                      : positive
                        ? "text-green-700 font-semibold"
                        : "text-red-700 font-semibold"
                  }
                >
                  {zero
                    ? "± 0,00 €"
                    : positive
                      ? `+ ${formatEuro(b.balance_cents, group.currency)}`
                      : `− ${formatEuro(-b.balance_cents, group.currency)}`}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mb-6">
        <h2 className="text-sm font-semibold text-kaffee-700 mb-2">
          Überweisungen ({transfers.length})
        </h2>
        {transfers.length === 0 ? (
          <Card>
            <p className="text-sm text-kaffee-700">
              Alles ausgeglichen. Nichts zu überweisen 👌
            </p>
          </Card>
        ) : (
          <div className="grid gap-2">
            {transfers.map((t, i) => {
              const from = memberById.get(t.from_member_id);
              const to = memberById.get(t.to_member_id);
              if (!from || !to) return null;
              const amILocus = from.id === session.member_id;
              const paypalReady = amILocus && to.paypal_handle;
              return (
                <div
                  key={i}
                  className="flex items-center justify-between bg-white/80 rounded-xl p-3 border border-kaffee-100"
                >
                  <div className="text-sm">
                    <div className="font-medium text-kaffee-900">
                      {from.name} → {to.name}
                    </div>
                    <div className="text-kaffee-700">
                      {formatEuro(t.amount_cents, group.currency)}
                    </div>
                  </div>
                  {paypalReady ? (
                    <a
                      href={buildPaypalMeLink({
                        handle: to.paypal_handle!,
                        amount_cents: t.amount_cents,
                        currency: group.currency,
                      })}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button size="sm">Per PayPal zahlen</Button>
                    </a>
                  ) : amILocus && !to.paypal_handle ? (
                    <span className="text-xs text-kaffee-700/70 text-right max-w-[140px]">
                      {to.name} hat noch keinen PayPal-Handle hinterlegt
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {isAdmin && transfers.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-kaffee-700 mb-2">
            Abrechnung abschließen
          </h2>
          <Card>
            <p className="text-sm text-kaffee-700 mb-3">
              Schließt den aktuellen Zeitraum ab. Danach beginnt ein neuer
              Abrechnungslauf mit Saldo 0.
            </p>
            <FinalizeButton slug={slug} />
          </Card>
        </section>
      )}
    </main>
  );
}
