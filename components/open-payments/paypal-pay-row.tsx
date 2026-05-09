"use client";

import { Button } from "@/components/ui/button";
import { formatEuro } from "@/lib/utils";
import type { PeriodMember } from "@/lib/settlement/period";
import {
  buildPaypalMeLink,
  isValidPaypalHandle,
} from "@/lib/settlement/paypal";

type SupportedCurrency = "EUR" | "CHF" | "USD" | "GBP";
const SUPPORTED: SupportedCurrency[] = ["EUR", "CHF", "USD", "GBP"];

function asSupportedCurrency(c: string): SupportedCurrency {
  return (SUPPORTED as readonly string[]).includes(c)
    ? (c as SupportedCurrency)
    : "EUR";
}

interface Props {
  from: PeriodMember;
  to: PeriodMember;
  amountCents: number;
  currency: string;
  /** True wenn der eingeloggte User in diesem Transfer involviert ist (egal ob from/to). */
  isMe: boolean;
  currentMemberId: string;
}

export function PaypalPayRow({
  from,
  to,
  amountCents,
  currency,
  currentMemberId,
}: Props) {
  const fromIsMe = from.id === currentMemberId;
  const toIsMe = to.id === currentMemberId;
  const handle = to.paypal_handle;
  const handleValid = !!handle && isValidPaypalHandle(handle);

  // PayPal-Button macht nur Sinn wenn ich (eingeloggter User) der Schuldner bin.
  // Andere Konstellationen sehen nur die Info, kein Button.
  const showPayButton = fromIsMe && handleValid;

  // Sicherheit: buildPaypalMeLink validiert + URL-encodet den Handle.
  // Wir rufen die Funktion erst, wenn isValidPaypalHandle bereits passte.
  const href = showPayButton
    ? buildPaypalMeLink({
        handle: handle as string,
        amount_cents: amountCents,
        currency: asSupportedCurrency(currency),
      })
    : null;

  let label: string;
  if (fromIsMe) {
    label = `Du schuldest ${to.name}`;
  } else if (toIsMe) {
    label = `${from.name} schuldet dir`;
  } else {
    label = `${from.name} schuldet ${to.name}`;
  }

  return (
    <div className="flex items-center justify-between bg-white/80 rounded-xl p-3 border border-kaffee-100">
      <div className="text-sm min-w-0">
        <div className="font-medium text-kaffee-900 truncate">{label}</div>
        <div className="text-kaffee-700 tabular-nums">
          {formatEuro(amountCents, currency)}
        </div>
      </div>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0"
        >
          <Button size="sm">Per PayPal zahlen</Button>
        </a>
      ) : fromIsMe && !handleValid ? (
        <span className="text-xs text-kaffee-700/70 text-right max-w-[140px] shrink-0">
          {to.name} hat noch keinen gültigen PayPal-Handle
        </span>
      ) : null}
    </div>
  );
}
