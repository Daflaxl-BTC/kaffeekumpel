import { redirect } from "next/navigation";
import Link from "next/link";
import { verifyMagicToken } from "@/lib/auth/magic-link";
import { setSessionCookie } from "@/lib/auth/session";
import { supabaseService } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function MagicConsumePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  const { slug } = await params;
  const { t } = await searchParams;

  if (!t) {
    return <Fail slug={slug} reason="Kein Token in der URL." />;
  }

  const payload = await verifyMagicToken(t);
  if (!payload || payload.slug !== slug) {
    return (
      <Fail
        slug={slug}
        reason="Link ist abgelaufen oder ungültig (max. 30 Minuten gültig)."
      />
    );
  }

  // Sanity-Check: Mitglied existiert und gehört zur Gruppe noch.
  const sb = supabaseService();
  const { data: member } = await sb
    .from("members")
    .select("id, name, group_id, active")
    .eq("id", payload.member_id)
    .single();
  if (!member || member.group_id !== payload.group_id || !member.active) {
    return (
      <Fail
        slug={slug}
        reason="Dieses Mitglied existiert nicht mehr in der Gruppe."
      />
    );
  }

  await setSessionCookie({
    group_id: payload.group_id,
    slug: payload.slug,
    member_id: payload.member_id,
    name: member.name,
  });

  redirect(`/g/${slug}?welcome=1`);
}

function Fail({ slug, reason }: { slug: string; reason: string }) {
  return (
    <main className="min-h-screen px-6 py-12 max-w-md mx-auto">
      <div className="bg-white/80 rounded-2xl p-6 border border-kaffee-100">
        <h1 className="text-2xl font-bold text-kaffee-900 mb-3">
          Login-Link funktioniert nicht.
        </h1>
        <p className="text-kaffee-700 mb-6">{reason}</p>
        <Link href={`/g/${slug}/join`}>
          <Button size="lg" className="w-full">
            Stattdessen beitreten
          </Button>
        </Link>
      </div>
    </main>
  );
}
