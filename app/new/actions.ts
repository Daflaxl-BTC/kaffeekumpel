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

function isRedirectError(e: unknown): boolean {
  return (
    typeof e === "object" &&
    e !== null &&
    "digest" in e &&
    typeof (e as { digest: unknown }).digest === "string" &&
    ((e as { digest: string }).digest.startsWith("NEXT_REDIRECT") ||
      (e as { digest: string }).digest === "NEXT_NOT_FOUND")
  );
}

export async function createGroup(formData: FormData) {
  let targetSlug = "";
  try {
    const input = Schema.parse({
      groupName: formData.get("groupName"),
      myName: formData.get("myName"),
      coffeePrice: formData.get("coffeePrice") || "0.30",
    });

    const sb = supabaseService();
    const coffeePriceCents = Math.round(input.coffeePrice * 100);

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
      if (error.code !== "23505") {
        throw new Error(`DB-Fehler (groups): ${error.message}`);
      }
    }
    if (!slug) throw new Error("Konnte keinen eindeutigen Slug generieren.");

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
      throw new Error(
        `DB-Fehler (members): ${memberErr?.message ?? "unbekannt"}`,
      );
    }

    await setSessionCookie({
      group_id: groupId,
      slug,
      member_id: member.id,
      name: member.name,
    });

    targetSlug = slug;
  } catch (e) {
    if (isRedirectError(e)) throw e;
    console.error("[createGroup] failed:", e);
    const msg = e instanceof Error ? e.message : String(e);
    redirect(`/new?error=${encodeURIComponent(msg.slice(0, 500))}`);
  }

  redirect(`/g/${targetSlug}?welcome=1`);
}
