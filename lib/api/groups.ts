/**
 * Gruppen-Kernlogik — geteilt von Web-Server-Actions und /api/v1-Routes.
 * Reine DB-Operationen ohne Cookie-/Revalidate-Seiteneffekte: der Aufrufer
 * entscheidet, ob er ein Cookie setzt (Web) oder ein Token zurückgibt (App).
 */

import { z } from "zod";
import { supabaseService } from "@/lib/supabase/server";
import { generateSlug } from "@/lib/slug";
import { computeCleaningStatus } from "@/lib/cleaning";
import { computeSettlement } from "@/lib/settlement/calculate";
import type { SessionPayload } from "@/lib/auth/session";
import { ApiError } from "@/lib/api/http";
import type {
  GroupRow,
  MemberRow,
  EventRow,
  ProductRow,
  GroupSnapshot,
  PublicMember,
} from "@/lib/api/types";

export const CreateGroupSchema = z.object({
  groupName: z.string().min(1).max(80),
  myName: z.string().min(1).max(50),
  coffeePrice: z.coerce.number().min(0).max(100),
});
export type CreateGroupInput = z.infer<typeof CreateGroupSchema>;

/** Legt Gruppe + ersten Admin an, gibt die neue Session zurück. */
export async function createGroupCore(input: CreateGroupInput): Promise<SessionPayload> {
  const sb = supabaseService();
  const coffeePriceCents = Math.round(input.coffeePrice * 100);

  let slug = "";
  let groupId = "";
  for (let i = 0; i < 5; i++) {
    const candidate = generateSlug();
    const { data, error } = await sb
      .from("groups")
      .insert({ slug: candidate, name: input.groupName, coffee_price_cents: coffeePriceCents })
      .select("id, slug")
      .single();
    if (!error && data) {
      slug = data.slug;
      groupId = data.id;
      break;
    }
    if (error?.message?.includes("Invalid API key") || error?.code === "PGRST301") {
      throw new ApiError(500, "supabase_key_invalid", "SUPABASE_KEY_INVALID");
    }
    if (error && error.code !== "23505") {
      throw new ApiError(500, "db_error", error.message ?? "unbekannt");
    }
  }
  if (!slug) throw new ApiError(500, "slug_generation_failed", "Konnte keinen eindeutigen Slug generieren.");

  const { data: member, error: memberErr } = await sb
    .from("members")
    .insert({ group_id: groupId, name: input.myName, role: "admin" })
    .select("id, name")
    .single();
  if (memberErr || !member) {
    throw new ApiError(500, "member_create_failed", memberErr?.message ?? "Mitglied konnte nicht angelegt werden");
  }

  return { group_id: groupId, slug, member_id: member.id, name: member.name };
}

export const JoinSchema = z.object({
  slug: z.string().min(6).max(6),
  mode: z.enum(["existing", "new"]),
  existingMemberId: z.string().uuid().optional(),
  newName: z.string().min(1).max(50).optional(),
});
export type JoinInput = z.infer<typeof JoinSchema>;

/** Tritt einer bestehenden Gruppe bei (als bestehendes oder neues Mitglied). */
export async function joinGroupCore(input: JoinInput): Promise<SessionPayload> {
  const sb = supabaseService();
  const { data: group } = await sb.from("groups").select("id").eq("slug", input.slug).single();
  if (!group) throw new ApiError(404, "group_not_found", "Gruppe nicht gefunden");

  let memberId: string;
  let memberName: string;

  if (input.mode === "existing" && input.existingMemberId) {
    const { data: member } = await sb
      .from("members")
      .select("id, name")
      .eq("id", input.existingMemberId)
      .eq("group_id", group.id)
      .single();
    if (!member) throw new ApiError(404, "member_not_found", "Mitglied nicht gefunden");
    memberId = member.id;
    memberName = member.name;
  } else if (input.mode === "new" && input.newName) {
    const { data: member, error } = await sb
      .from("members")
      .insert({ group_id: group.id, name: input.newName })
      .select("id, name")
      .single();
    if (error || !member) {
      throw new ApiError(409, "join_failed", error?.message ?? "Konnte nicht beitreten");
    }
    memberId = member.id;
    memberName = member.name;
  } else {
    throw new ApiError(422, "invalid_input", "Ungültige Eingabe");
  }

  return { group_id: group.id, slug: input.slug, member_id: memberId, name: memberName };
}

/** Öffentliche Mitgliederliste (ohne PII) für den Join-Screen. */
export async function listPublicMembers(slug: string): Promise<{ name: string; members: PublicMember[] }> {
  const sb = supabaseService();
  const { data: group } = await sb.from("groups").select("id, name").eq("slug", slug).single();
  if (!group) throw new ApiError(404, "group_not_found", "Gruppe nicht gefunden");

  const { data: members } = await sb
    .from("members")
    .select("id, name, role")
    .eq("group_id", group.id)
    .eq("active", true)
    .order("created_at", { ascending: true });

  return {
    name: group.name,
    members: ((members ?? []) as PublicMember[]),
  };
}

/** Voller Lesezustand einer Gruppe — spiegelt app/g/[slug]/page.tsx. */
export async function getGroupSnapshot(session: SessionPayload): Promise<GroupSnapshot> {
  const sb = supabaseService();
  const { data: groupRaw } = await sb.from("groups").select("*").eq("slug", session.slug).single();
  if (!groupRaw) throw new ApiError(404, "group_not_found", "Gruppe nicht gefunden");
  const group = groupRaw as GroupRow;

  const [{ data: members }, { data: events }, { data: products }] = await Promise.all([
    sb.from("members").select("*").eq("group_id", group.id).eq("active", true).order("created_at", { ascending: true }),
    sb.from("events").select("*").eq("group_id", group.id).order("created_at", { ascending: false }).limit(30),
    sb.from("products").select("*").eq("group_id", group.id).order("name"),
  ]);

  const memberList = (members ?? []) as MemberRow[];
  const eventList = (events ?? []) as EventRow[];
  const productList = (products ?? []) as ProductRow[];

  const cleaning = computeCleaningStatus(
    memberList,
    eventList.filter((e) => e.type === "cleaning"),
    group.cleaning_interval_days,
  );

  const { balances } = computeSettlement(
    eventList.map((e) => ({ member_id: e.member_id, type: e.type, cost_cents: e.cost_cents })),
    group.coffee_price_cents,
    memberList.map((m) => m.id),
  );

  return {
    group: {
      slug: group.slug,
      name: group.name,
      coffee_price_cents: group.coffee_price_cents,
      currency: group.currency,
      cleaning_interval_days: group.cleaning_interval_days,
    },
    me: { member_id: session.member_id, name: session.name },
    members: memberList.map((m) => ({ id: m.id, name: m.name, role: m.role })),
    events: eventList,
    products: productList,
    balances,
    cleaning,
  };
}
