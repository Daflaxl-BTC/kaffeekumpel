"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { supabaseService } from "@/lib/supabase/server";
import { readSessionCookie, clearSessionCookie } from "@/lib/auth/session";

async function assertAdmin(slug: string) {
  const session = await readSessionCookie(slug);
  if (!session) throw new Error("Nicht eingeloggt");
  const sb = supabaseService();
  const { data: me } = await sb
    .from("members")
    .select("role")
    .eq("id", session.member_id)
    .single();
  if (me?.role !== "admin") {
    throw new Error("Nur Admins dürfen das.");
  }
  return { session, sb };
}

const RenameSchema = z.object({
  slug: z.string().min(6).max(6),
  name: z.string().min(1).max(80),
  coffeePrice: z.coerce.number().min(0).max(100),
  cleaningIntervalDays: z.coerce.number().int().min(1).max(365),
});

export async function updateGroupSettings(formData: FormData) {
  const input = RenameSchema.parse({
    slug: formData.get("slug"),
    name: formData.get("name"),
    coffeePrice: formData.get("coffeePrice"),
    cleaningIntervalDays: formData.get("cleaningIntervalDays"),
  });
  const { session, sb } = await assertAdmin(input.slug);

  const { error } = await sb
    .from("groups")
    .update({
      name: input.name,
      coffee_price_cents: Math.round(input.coffeePrice * 100),
      cleaning_interval_days: input.cleaningIntervalDays,
    })
    .eq("id", session.group_id);
  if (error) throw new Error(error.message);

  revalidatePath(`/g/${input.slug}`);
  revalidatePath(`/g/${input.slug}/admin`);
}

const MemberActionSchema = z.object({
  slug: z.string().min(6).max(6),
  memberId: z.string().uuid(),
});

export async function deactivateMember(formData: FormData) {
  const input = MemberActionSchema.parse({
    slug: formData.get("slug"),
    memberId: formData.get("memberId"),
  });
  const { session, sb } = await assertAdmin(input.slug);

  if (input.memberId === session.member_id) {
    throw new Error("Du kannst dich nicht selbst entfernen — geh auf dein Profil.");
  }

  // Last-admin-Check: wenn das entfernte Mitglied der letzte aktive Admin ist,
  // darf der Admin sich nicht selbst aussperren.
  const { data: target } = await sb
    .from("members")
    .select("role, group_id")
    .eq("id", input.memberId)
    .single();
  if (!target || target.group_id !== session.group_id) {
    throw new Error("Mitglied gehört nicht zu dieser Gruppe.");
  }
  if (target.role === "admin") {
    const { count } = await sb
      .from("members")
      .select("id", { count: "exact", head: true })
      .eq("group_id", session.group_id)
      .eq("role", "admin")
      .eq("active", true);
    if ((count ?? 0) <= 1) {
      throw new Error("Der letzte Admin kann nicht entfernt werden.");
    }
  }

  const { error } = await sb
    .from("members")
    .update({ active: false })
    .eq("id", input.memberId)
    .eq("group_id", session.group_id);
  if (error) throw new Error(error.message);

  revalidatePath(`/g/${input.slug}`);
  revalidatePath(`/g/${input.slug}/admin`);
}

const RoleSchema = z.object({
  slug: z.string().min(6).max(6),
  memberId: z.string().uuid(),
  role: z.enum(["admin", "member"]),
});

export async function setMemberRole(formData: FormData) {
  const input = RoleSchema.parse({
    slug: formData.get("slug"),
    memberId: formData.get("memberId"),
    role: formData.get("role"),
  });
  const { session, sb } = await assertAdmin(input.slug);

  // Downgrade auf member: mindestens ein Admin muss übrig bleiben.
  if (input.role === "member") {
    const { count } = await sb
      .from("members")
      .select("id", { count: "exact", head: true })
      .eq("group_id", session.group_id)
      .eq("role", "admin")
      .eq("active", true);
    if ((count ?? 0) <= 1) {
      throw new Error("Mindestens ein Admin muss übrig bleiben.");
    }
  }

  const { error } = await sb
    .from("members")
    .update({ role: input.role })
    .eq("id", input.memberId)
    .eq("group_id", session.group_id);
  if (error) throw new Error(error.message);

  revalidatePath(`/g/${input.slug}/admin`);
}

const DeleteGroupSchema = z.object({
  slug: z.string().min(6).max(6),
  confirm: z.string(),
});

export async function deleteGroup(formData: FormData) {
  const input = DeleteGroupSchema.parse({
    slug: formData.get("slug"),
    confirm: formData.get("confirm"),
  });
  if (input.confirm !== input.slug) {
    throw new Error("Bestätigung passt nicht zum Gruppen-Code.");
  }
  const { session, sb } = await assertAdmin(input.slug);

  // Cascade löscht members, products, events, settlements, debts mit.
  const { error } = await sb
    .from("groups")
    .delete()
    .eq("id", session.group_id);
  if (error) throw new Error(error.message);

  await clearSessionCookie();
  redirect("/");
}
