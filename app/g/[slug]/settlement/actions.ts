"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { supabaseService } from "@/lib/supabase/server";
import { readSessionCookie } from "@/lib/auth/session";
import { computeSettlement } from "@/lib/settlement/calculate";
import { buildPaypalMeLink, isValidPaypalHandle } from "@/lib/settlement/paypal";
import { sendMail } from "@/lib/mail/resend";
import { settlementEmail, type SettlementTransferLine } from "@/lib/mail/templates";

const FinalizeSchema = z.object({
  slug: z.string().min(6).max(6),
});

export async function finalizeSettlement(formData: FormData) {
  const input = FinalizeSchema.parse({ slug: formData.get("slug") });
  const session = await readSessionCookie(input.slug);
  if (!session) throw new Error("Nicht eingeloggt");

  const sb = supabaseService();

  const { data: me } = await sb
    .from("members")
    .select("role")
    .eq("id", session.member_id)
    .single();
  if (me?.role !== "admin") throw new Error("Nur Admins dürfen abrechnen");

  const { data: group } = await sb
    .from("groups")
    .select("id, name, coffee_price_cents, currency, created_at")
    .eq("slug", input.slug)
    .single();
  if (!group) throw new Error("Gruppe nicht gefunden");

  const { data: lastSettlement } = await sb
    .from("settlements")
    .select("covered_to")
    .eq("group_id", group.id)
    .order("finalized_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const coveredFrom = lastSettlement
    ? new Date(lastSettlement.covered_to)
    : new Date(group.created_at);
  const coveredTo = new Date();

  const [{ data: members }, { data: events }] = await Promise.all([
    sb
      .from("members")
      .select("id, name, email, paypal_handle, active")
      .eq("group_id", group.id),
    sb
      .from("events")
      .select("member_id, type, cost_cents")
      .eq("group_id", group.id)
      .gt("created_at", coveredFrom.toISOString())
      .lte("created_at", coveredTo.toISOString()),
  ]);

  const memberList = members ?? [];
  const memberIds = memberList.map((m) => m.id);
  const eventList = (events ?? []).map((e) => ({
    member_id: e.member_id,
    type: e.type as "coffee" | "cleaning" | "refill" | "purchase",
    cost_cents: e.cost_cents,
  }));

  const { transfers } = computeSettlement(
    eventList,
    group.coffee_price_cents,
    memberIds,
  );

  const { data: settlement, error: sErr } = await sb
    .from("settlements")
    .insert({
      group_id: group.id,
      finalized_by_id: session.member_id,
      covered_from: coveredFrom.toISOString(),
      covered_to: coveredTo.toISOString(),
    })
    .select("id")
    .single();
  if (sErr || !settlement) throw new Error(sErr?.message ?? "Settlement failed");

  if (transfers.length > 0) {
    const { error: dErr } = await sb.from("debts").insert(
      transfers.map((t) => ({
        settlement_id: settlement.id,
        from_member_id: t.from_member_id,
        to_member_id: t.to_member_id,
        amount_cents: t.amount_cents,
      })),
    );
    if (dErr) throw new Error(dErr.message);
  }

  // Mail-Benachrichtigungen: best-effort, Fehler blockieren das Settlement nicht.
  await sendSettlementMails({
    slug: input.slug,
    groupName: group.name,
    currency: group.currency,
    coveredFrom,
    coveredTo,
    members: memberList,
    transfers,
  }).catch((err) => {
    console.error("[settlement] mail send failed:", err);
  });

  revalidatePath(`/g/${input.slug}/settlement`);
  revalidatePath(`/g/${input.slug}`);
}

interface MailMember {
  id: string;
  name: string;
  email: string | null;
  paypal_handle: string | null;
  active: boolean;
}

async function sendSettlementMails(input: {
  slug: string;
  groupName: string;
  currency: string;
  coveredFrom: Date;
  coveredTo: Date;
  members: MailMember[];
  transfers: {
    from_member_id: string;
    to_member_id: string;
    amount_cents: number;
  }[];
}): Promise<void> {
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000";
  const groupUrl = `${appUrl}/g/${input.slug}`;
  const byId = new Map(input.members.map((m) => [m.id, m]));
  const currency = input.currency as "EUR" | "CHF" | "USD" | "GBP";

  // Bundle pro Mitglied: was es zahlt + was es bekommt.
  const bundle = new Map<
    string,
    { outgoing: SettlementTransferLine[]; incoming: SettlementTransferLine[] }
  >();
  const ensure = (id: string) => {
    let b = bundle.get(id);
    if (!b) {
      b = { outgoing: [], incoming: [] };
      bundle.set(id, b);
    }
    return b;
  };

  for (const t of input.transfers) {
    const from = byId.get(t.from_member_id);
    const to = byId.get(t.to_member_id);
    if (!from || !to) continue;

    const paypalLink =
      to.paypal_handle && isValidPaypalHandle(to.paypal_handle)
        ? buildPaypalMeLink({
            handle: to.paypal_handle,
            amount_cents: t.amount_cents,
            currency,
          })
        : undefined;

    ensure(from.id).outgoing.push({
      counterparty: to.name,
      amount_cents: t.amount_cents,
      paypalLink,
    });
    ensure(to.id).incoming.push({
      counterparty: from.name,
      amount_cents: t.amount_cents,
    });
  }

  // Nur Mitglieder mit E-Mail und mit tatsächlichen Posten benachrichtigen.
  const sends: Promise<unknown>[] = [];
  for (const m of input.members) {
    if (!m.email || !m.active) continue;
    const lines = bundle.get(m.id);
    if (!lines || (lines.outgoing.length === 0 && lines.incoming.length === 0)) {
      continue;
    }
    const tpl = settlementEmail({
      groupName: input.groupName,
      memberName: m.name,
      currency,
      coveredFrom: input.coveredFrom,
      coveredTo: input.coveredTo,
      outgoing: lines.outgoing,
      incoming: lines.incoming,
      groupUrl,
    });
    sends.push(
      sendMail({
        to: m.email,
        subject: tpl.subject,
        html: tpl.html,
        text: tpl.text,
      }),
    );
  }

  await Promise.all(sends);
}

const MarkPaidSchema = z.object({
  slug: z.string().min(6).max(6),
  debtId: z.string().uuid(),
});

export async function markDebtAsPaid(formData: FormData) {
  const input = MarkPaidSchema.parse({
    slug: formData.get("slug"),
    debtId: formData.get("debtId"),
  });
  const session = await readSessionCookie(input.slug);
  if (!session) throw new Error("Nicht eingeloggt");

  const sb = supabaseService();
  const { error } = await sb
    .from("debts")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("id", input.debtId)
    .eq("from_member_id", session.member_id);
  if (error) throw new Error(error.message);

  revalidatePath(`/g/${input.slug}/settlement`);
}
