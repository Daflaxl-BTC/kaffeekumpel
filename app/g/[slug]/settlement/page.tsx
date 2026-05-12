import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { readSessionCookie } from "@/lib/auth/session";
import {
  getCurrentPeriodData,
  GroupNotFoundError,
} from "@/lib/settlement/period";
import { buildPaypalMeLink, isValidPaypalHandle } from "@/lib/settlement/paypal";
import { formatEuro } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { OpenPaymentsTrigger } from "@/components/open-payments/open-payments-trigger";
import { FinalizeButton } from "./finalize-button";

export default async function SettlementPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await readSessionCookie(slug);
  if (!session) redirect(`/g/${slug}/join`);

  let period;
  try {
    period = await getCurrentPeriodData(slug);
  } catch (err) {
    if (err instanceof GroupNotFoundError) notFound();
    throw err;
  }

  const { group, coveredFrom, members, allMembers, balances, transfers } =
    period;

  const memberById = new Map(allMembers.map((m) => [m.id, m]));
  const isAdmin =
    members.find((m) => m.id === session.member_id)?.role === "admin";

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
            const row = (
              <div className="flex items-center justify-between bg-white/80 rounded-xl p-3 border border-kaffee-100">
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
            return (
              <OpenPaymentsTrigger
                key={b.member_id}
                member={m}
                isCurrentUser={m.id === session.member_id}
                currentMemberId={session.member_id}
                transfers={transfers}
                members={allMembers}
                currency={group.currency}
              >
                {row}
              </OpenPaymentsTrigger>
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
              const handleValid =
                !!to.paypal_handle && isValidPaypalHandle(to.paypal_handle);
              const paypalReady = amILocus && handleValid;
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
                        handle: to.paypal_handle as string,
                        amount_cents: t.amount_cents,
                        currency: group.currency as
                          | "EUR"
                          | "CHF"
                          | "USD"
                          | "GBP",
                      })}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button size="sm">Per PayPal zahlen</Button>
                    </a>
                  ) : amILocus && !handleValid ? (
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
