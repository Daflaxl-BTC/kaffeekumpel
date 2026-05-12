"use client";

import { useState } from "react";
import type { Transfer } from "@/lib/settlement/calculate";
import type { PeriodMember } from "@/lib/settlement/period";
import { OpenPaymentsModal } from "./open-payments-modal";

interface Props {
  member: PeriodMember;
  isCurrentUser: boolean;
  currentMemberId: string;
  transfers: Transfer[];
  members: PeriodMember[];
  currency: string;
  /** Inhalt der Balance-Zeile — wird unverändert dargestellt. */
  children: React.ReactNode;
}

/**
 * Wrapper, der eine Balance-Zeile klickbar macht.
 * Eigene Zeile bleibt nicht-klickbar (man kann sich nicht selbst bezahlen).
 */
export function OpenPaymentsTrigger({
  member,
  isCurrentUser,
  currentMemberId,
  transfers,
  members,
  currency,
  children,
}: Props) {
  const [open, setOpen] = useState(false);

  if (isCurrentUser) {
    return (
      <div aria-disabled="true" className="cursor-default">
        {children}
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className="block w-full text-left rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-kaffee-700 hover:bg-white/40 transition-colors"
      >
        {children}
      </button>
      {open && (
        <OpenPaymentsModal
          open={open}
          onClose={() => setOpen(false)}
          member={member}
          currentMemberId={currentMemberId}
          transfers={transfers}
          members={members}
          currency={currency}
        />
      )}
    </>
  );
}
