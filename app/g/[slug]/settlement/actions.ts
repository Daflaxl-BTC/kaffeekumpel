"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { readSessionCookie } from "@/lib/auth/session";
import { finalizeSettlementCore, markDebtPaidCore } from "@/lib/api/settlement";

const FinalizeSchema = z.object({ slug: z.string().min(6).max(6) });

export async function finalizeSettlement(formData: FormData) {
  const input = FinalizeSchema.parse({ slug: formData.get("slug") });
  const session = await readSessionCookie(input.slug);
  if (!session) throw new Error("Nicht eingeloggt");

  await finalizeSettlementCore(session);

  revalidatePath(`/g/${input.slug}/settlement`);
  revalidatePath(`/g/${input.slug}`);
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

  await markDebtPaidCore(session, input.debtId);

  revalidatePath(`/g/${input.slug}/settlement`);
}
