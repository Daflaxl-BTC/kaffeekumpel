"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { supabaseService } from "@/lib/supabase/server";
import { generateSlug } from "@/lib/slug";
import { setSessionCookie } from "@/lib/auth/session";

const Schema = z.object({
  groupName: z.string().min(1).max(80),
  myName: z.string().min(1).max(50),
  coffeePrice: z.coerce.number().min(0).max(100),
});

export async function createGroup(formData: FormData) {
  const input = Schema.parse({
    groupName: formData.get("groupName"),
    myName: formData.get("myName"),
    coffeePrice: formData.get("coffeePrice") || "0.30",
  });

  const sb = supabaseService();
  const coffeePriceCents = Math.round(input.coffeePrice * 100);

  // Slug mit Kollisions-Retry (max 5)
  let slug = "";
  let groupId = "";
  for (let i = 0; i < 5; i++) {
    const candidate = generateSlug();
    const { data, error } = await sb
      .from("groups")
      .insert({
        slug: candidate,
        name: input.groupName,
        coffee_price_cents: coffeePriceCents,
      })
      .select("id, slug")
      .single();
    if (!error) {
      slug = data.slug;
      groupId = data.id;
      break;
    }
    if (error.message?.includes("Invalid API key") || error.code === "PGRST301") {
      throw new Error("SUPABASE_KEY_INVALID");
    }
    if (error.code !== "23505") {
      throw new Error(`DB-Fehler: ${error.message ?? "unbekannt"}`);
    }
  }
  if (!slug) throw new Error("Konnte keinen eindeutigen Slug generieren.");

  // Felix als erster Admin
  const { data: member, error: memberErr } = await sb
    .from("members")
    .insert({
      group_id: groupId,
      name: input.myName,
      role: "admin",
    })
    .select("id, name")
    .single();
  if (memberErr || !member) {
    throw new Error(`Mitglied konnte nicht angelegt werden: ${memberErr?.message}`);
  }

  await setSessionCookie({
    group_id: groupId,
    slug,
    member_id: member.id,
    name: member.name,
  });

  redirect(`/g/${slug}?welcome=1`);
}
