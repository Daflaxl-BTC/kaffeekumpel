"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { supabaseService } from "@/lib/supabase/server";
import { readSessionCookie } from "@/lib/auth/session";

const EventSchema = z.object({
  slug: z.string().min(6).max(6),
  type: z.enum(["coffee", "cleaning", "refill"]),
});

export async function tapEvent(input: { slug: string; type: "coffee" | "cleaning" | "refill" }) {
  const { slug, type } = EventSchema.parse(input);
  const session = await readSessionCookie(slug);
  if (!session) throw new Error("Nicht eingeloggt");

  const sb = supabaseService();
  const { error } = await sb.from("events").insert({
    group_id: session.group_id,
    member_id: session.member_id,
    type,
  });
  if (error) throw new Error(error.message);

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

  const sb = supabaseService();

  // Produkt upserten (per group_id + name unique)
  const { data: existingProduct } = await sb
    .from("products")
    .select("id")
    .eq("group_id", session.group_id)
    .eq("name", input.productName)
    .maybeSingle();

  let productId = existingProduct?.id ?? null;
  if (!productId) {
    const { data: newProduct, error: pErr } = await sb
      .from("products")
      .insert({ group_id: session.group_id, name: input.productName })
      .select("id")
      .single();
    if (pErr) throw new Error(pErr.message);
    productId = newProduct.id;
  }

  const cost_cents = Math.round(input.amountEuro * 100);
  const { error } = await sb.from("events").insert({
    group_id: session.group_id,
    member_id: session.member_id,
    type: "purchase",
    product_id: productId,
    cost_cents,
    note: input.note ?? null,
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/g/${input.slug}`);
}

const JoinSchema = z.object({
  slug: z.string().min(6).max(6),
  mode: z.enum(["existing", "new"]),
  existingMemberId: z.string().uuid().optional(),
  newName: z.string().min(1).max(50).optional(),
});

export async function joinGroup(formData: FormData) {
  const input = JoinSchema.parse({
    slug: formData.get("slug"),
    mode: formData.get("mode"),
    existingMemberId: formData.get("existingMemberId") ?? undefined,
    newName: formData.get("newName") ?? undefined,
  });

  const sb = supabaseService();
  const { data: group } = await sb
    .from("groups")
    .select("id")
    .eq("slug", input.slug)
    .single();
  if (!group) throw new Error("Gruppe nicht gefunden");

  let memberId: string;
  let memberName: string;

  if (input.mode === "existing" && input.existingMemberId) {
    const { data: member } = await sb
      .from("members")
      .select("id, name")
      .eq("id", input.existingMemberId)
      .eq("group_id", group.id)
      .single();
    if (!member) throw new Error("Mitglied nicht gefunden");
    memberId = member.id;
    memberName = member.name;
  } else if (input.mode === "new" && input.newName) {
    const { data: member, error } = await sb
      .from("members")
      .insert({ group_id: group.id, name: input.newName })
      .select("id, name")
      .single();
    if (error || !member) throw new Error(error?.message ?? "Konnte nicht beitreten");
    memberId = member.id;
    memberName = member.name;
  } else {
    throw new Error("Ungültige Eingabe");
  }

  const { setSessionCookie } = await import("@/lib/auth/session");
  await setSessionCookie({
    group_id: group.id,
    slug: input.slug,
    member_id: memberId,
    name: memberName,
  });
}
