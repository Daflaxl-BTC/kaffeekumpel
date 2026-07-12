"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { readSessionCookie, setSessionCookie } from "@/lib/auth/session";
import { createEvent } from "@/lib/api/events";
import { joinGroupCore, JoinSchema } from "@/lib/api/groups";

const TapSchema = z.object({
  slug: z.string().min(6).max(6),
  type: z.enum(["coffee", "cleaning", "refill"]),
});

export async function tapEvent(input: { slug: string; type: "coffee" | "cleaning" | "refill" }) {
  const { slug, type } = TapSchema.parse(input);
  const session = await readSessionCookie(slug);
  if (!session) throw new Error("Nicht eingeloggt");

  await createEvent(session, { type });
  revalidatePath(`/g/${slug}`);
}

const PurchaseSchema = z.object({
  slug: z.string().min(6).max(6),
  productName: z.string().min(1).max(60),
  amountEuro: z.coerce.number().min(0.01).max(10000),
  note: z.string().max(200).optional(),
});

export async function addPurchase(formData: FormData) {
  const input = PurchaseSchema.parse({
    slug: formData.get("slug"),
    productName: formData.get("productName"),
    amountEuro: formData.get("amountEuro"),
    note: formData.get("note") ?? undefined,
  });
  const session = await readSessionCookie(input.slug);
  if (!session) throw new Error("Nicht eingeloggt");

  await createEvent(session, {
    type: "purchase",
    productName: input.productName,
    amountEuro: input.amountEuro,
    note: input.note,
  });
  revalidatePath(`/g/${input.slug}`);
}

export async function joinGroup(formData: FormData) {
  const input = JoinSchema.parse({
    slug: formData.get("slug"),
    mode: formData.get("mode"),
    existingMemberId: formData.get("existingMemberId") ?? undefined,
    newName: formData.get("newName") ?? undefined,
  });

  const session = await joinGroupCore(input);
  await setSessionCookie(session);
}
