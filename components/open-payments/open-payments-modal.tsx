"use client";

import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import type { Transfer } from "@/lib/settlement/calculate";
import type { PeriodMember } from "@/lib/settlement/period";
import { filterAndSortTransfers } from "./filter-transfers";
import { PaypalPayRow } from "./paypal-pay-row";

interface Props {
  open: boolean;
  onClose: () => void;
  member: PeriodMember;
  currentMemberId: string;
  transfers: Transfer[];
  members: PeriodMember[];
  currency: string;
}

export function OpenPaymentsModal({
  open,
  onClose,
  member,
  currentMemberId,
  transfers,
  members,
  currency,
}: Props) {
  const ref = useRef<HTMLDialogElement | null>(null);
  const titleId = useId();
  const isDesktop = useMediaQuery("(min-width: 768px)");

  // <dialog> programmatisch öffnen/schließen — nativer Fokus-Trap & ESC.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) {
      el.showModal();
    } else if (!open && el.open) {
      el.close();
    }
  }, [open]);

  // Native "close" event (ESC, .close()) → onClose synchronisieren
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onCancel = () => onClose();
    el.addEventListener("close", onCancel);
    return () => el.removeEventListener("close", onCancel);
  }, [onClose]);

  // Click auf Backdrop (=event.target ist <dialog> selbst) → schließen.
  // iOS-Safari-Quirk: ohne diesen Handler kein Backdrop-Close.
  function onBackdropMouseDown(e: React.MouseEvent<HTMLDialogElement>) {
    if (e.target === e.currentTarget) onClose();
  }

  const memberById = new Map(members.map((m) => [m.id, m]));
  const involved = filterAndSortTransfers(transfers, member.id);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onMouseDown={onBackdropMouseDown}
      className={cn(
        // Reset des nativen <dialog>-Stylings
        "p-0 bg-transparent backdrop:bg-black/40 backdrop:backdrop-blur-sm",
        "max-h-[90vh] w-full",
        // Mobile: Bottom-Sheet
        !isDesktop &&
          "fixed inset-x-0 bottom-0 m-0 mt-auto max-w-none rounded-t-3xl",
        // Desktop: zentriertes Dialog
        isDesktop && "m-auto max-w-md rounded-2xl",
      )}
    >
      <div
        className={cn(
          "bg-kaffee-50 text-kaffee-900",
          !isDesktop && "rounded-t-3xl pb-[env(safe-area-inset-bottom)]",
          isDesktop && "rounded-2xl",
        )}
      >
        <header className="flex items-center justify-between px-5 pt-4 pb-2 border-b border-kaffee-100">
          <h2 id={titleId} className="text-lg font-semibold">
            {member.name}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Schließen"
            className="p-2 -mr-2 rounded-full hover:bg-kaffee-100 text-kaffee-700"
          >
            <X size={18} />
          </button>
        </header>

        <div className="px-5 py-4">
          {involved.length === 0 ? (
            <p className="text-sm text-kaffee-700 text-center py-6">
              Aktuell keine offenen Zahlungen 👌
            </p>
          ) : (
            <ul className="space-y-2">
              {involved.map((t, i) => {
                const from = memberById.get(t.from_member_id);
                const to = memberById.get(t.to_member_id);
                if (!from || !to) return null;
                return (
                  <li key={i}>
                    <PaypalPayRow
                      from={from}
                      to={to}
                      amountCents={t.amount_cents}
                      currency={currency}
                      isMe={
                        from.id === currentMemberId ||
                        to.id === currentMemberId
                      }
                      currentMemberId={currentMemberId}
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </dialog>
  );
}
