"use server";

import { z } from "zod";
import { supabaseService } from "@/lib/supabase/server";
import { readSessionCookie } from "@/lib/auth/session";
import { signMagicToken } from "@/lib/auth/magic-link";
import { sendMail } from "@/lib/mail/resend";
import { magicLinkEmail } from "@/lib/mail/templates";
import { checkRateLimit, clientIpFromHeaders } from "@/lib/rate-limit";

const Schema = z.object({
  slug: z.string().min(6).max(6),
  email: z.string().email(),
});

/**
 * Schickt dem aktuell eingeloggten Mitglied einen Magic-Link an die angegebene
 * E-Mail-Adresse. Die Adresse wird am Mitglied gespeichert (damit künftige
 * Monatsabrechnungen dorthin gehen), falls noch keine hinterlegt war.
 *
 * Rückgabe: Status-String fürs UI. Wir werfen nicht, damit der Form-State
 * sauber angezeigt werden kann.
 */
export async function requestMagicLink(
  _prev: { ok: boolean; message: string } | null,
  formData: FormData,
): Promise<{ ok: boolean; message: string }> {
  let input: z.infer<typeof Schema>;
  try {
    input = Schema.parse({
      slug: formData.get("slug"),
      email: formData.get("email"),
    });
  } catch {
    return { ok: false, message: "Ungültige E-Mail-Adresse." };
  }

  const ip = await clientIpFromHeaders();
  const rl = checkRateLimit({
    key: `magic-link:${ip}`,
    max: 5,
    windowMs: 60 * 60 * 1000, // 1h
  });
  if (rl.limited) {
    return {
      ok: false,
      message: "Zu viele Versuche. Probier's in einer Stunde erneut.",
    };
  }

  const session = await readSessionCookie(input.slug);
  if (!session) {
    return { ok: false, message: "Deine Session ist abgelaufen." };
  }

  const sb = supabaseService();
  const { data: group } = await sb
    .from("groups")
    .select("name")
    .eq("id", session.group_id)
    .single();
  if (!group) {
    return { ok: false, message: "Gruppe nicht gefunden." };
  }

  // E-Mail am Mitglied speichern (für spätere Monatsabrechnungs-Mails).
  await sb
    .from("members")
    .update({ email: input.email })
    .eq("id", session.member_id);

  const token = await signMagicToken({
    group_id: session.group_id,
    slug: session.slug,
    member_id: session.member_id,
    name: session.name,
  });
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000";
  const link = `${appUrl}/g/${input.slug}/magic?t=${encodeURIComponent(token)}`;

  const tpl = magicLinkEmail({
    groupName: group.name,
    memberName: session.name,
    link,
  });
  const res = await sendMail({
    to: input.email,
    subject: tpl.subject,
    html: tpl.html,
    text: tpl.text,
  });
  if (res.skipped) {
    return {
      ok: false,
      message:
        "Mail-Versand ist nicht konfiguriert (RESEND_API_KEY fehlt). E-Mail wurde am Profil gespeichert, aber kein Link versandt.",
    };
  }
  if (res.error) {
    return {
      ok: false,
      message: "Mail konnte gerade nicht verschickt werden. Später probieren.",
    };
  }
  return {
    ok: true,
    message: `Link an ${input.email} verschickt. Check dein Postfach (auch Spam).`,
  };
}
