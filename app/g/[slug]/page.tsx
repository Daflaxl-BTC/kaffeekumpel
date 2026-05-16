import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { supabaseService } from "@/lib/supabase/server";
import { readSessionCookie } from "@/lib/auth/session";
import { computeCleaningStatus } from "@/lib/cleaning";
import { computeSettlement } from "@/lib/settlement/calculate";
import { EventButtons } from "@/components/event-buttons";
import { EventFeed } from "@/components/event-feed";
import { MemberBalance } from "@/components/member-balance";
import { CleaningBanner } from "@/components/cleaning-banner";
import { PurchaseForm } from "@/components/purchase-form";
import { LiveGroupView } from "@/components/live-group-view";
import { RecapDownload } from "@/components/recap-download";
import { Card } from "@/components/ui/card";

export default async function GroupPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ welcome?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const session = await readSessionCookie(slug);
  if (!session) redirect(`/g/${slug}/join`);

  const sb = supabaseService();

  const { data: group } = await sb
    .from("groups")
    .select("*")
    .eq("slug", slug)
    .single();
  if (!group) notFound();

  const [{ data: members }, { data: events }, { data: products }] =
    await Promise.all([
      sb
        .from("members")
        .select("*")
        .eq("group_id", group.id)
        .eq("active", true)
        .order("created_at", { ascending: true }),
      sb
        .from("events")
        .select("*")
        .eq("group_id", group.id)
        .order("created_at", { ascending: false })
        .limit(30),
      sb
        .from("products")
        .select("*")
        .eq("group_id", group.id)
        .order("name"),
    ]);

  const memberList = members ?? [];
  const eventList = events ?? [];
  const productList = products ?? [];

  const cleaning = computeCleaningStatus(
    memberList,
    eventList.filter((e) => e.type === "cleaning"),
    group.cleaning_interval_days,
  );

  const { balances } = computeSettlement(
    eventList.map((e) => ({
      member_id: e.member_id,
      type: e.type,
      cost_cents: e.cost_cents,
    })),
    group.coffee_price_cents,
    memberList.map((m) => m.id),
  );

  return (
    <LiveGroupView
      slug={slug}
      initialEvents={eventList}
      groupId={group.id}
    >
      <main className="min-h-screen max-w-2xl mx-auto px-4 pt-6 pb-24">
        {sp.welcome === "1" && (
          <Card className="mb-4 bg-kaffee-100 border-kaffee-300">
            <p className="text-sm text-kaffee-900">
              🎉 Deine Gruppe ist bereit. Hol dir deinen QR-Code unter{" "}
              <Link
                className="underline font-medium"
                href={`/api/qr/${slug}?format=svg`}
                target="_blank"
              >
                /api/qr/{slug}?format=svg
              </Link>{" "}
              — druck ihn aus oder lass ein Holzschild gravieren.
            </p>
          </Card>
        )}

        <header className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-kaffee-900">
              {group.name}
            </h1>
            <p className="text-sm text-kaffee-800">
              Hi {session.name} ☕ · Code{" "}
              <span className="font-mono">{slug}</span>
            </p>
          </div>
          <Link
            href={`/g/${slug}/profile`}
            className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-kaffee-100 text-kaffee-900 px-3 py-1.5 text-sm font-medium hover:bg-kaffee-200 transition-colors"
          >
            Mein Bereich
          </Link>
        </header>

        <CleaningBanner
          status={cleaning}
          currentMemberId={session.member_id}
          groupSlug={slug}
        />

        <section className="mt-6">
          <EventButtons
            slug={slug}
            memberId={session.member_id}
            coffeePriceCents={group.coffee_price_cents}
            currency={group.currency}
          />
        </section>

        <section className="mt-6">
          <h2 className="text-base font-semibold text-kaffee-900 mb-2">
            Aktueller Stand
          </h2>
          <MemberBalance
            members={memberList}
            balances={balances}
            currency={group.currency}
          />
        </section>

        <section className="mt-6">
          <h2 className="text-base font-semibold text-kaffee-900 mb-2">
            Einkauf eintragen
          </h2>
          <PurchaseForm
            slug={slug}
            products={productList}
            currency={group.currency}
          />
        </section>

        <section className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-base font-semibold text-kaffee-900">Aktivität</h2>
            <Link
              href={`/g/${slug}/settlement`}
              className="text-sm font-medium text-kaffee-800 hover:text-kaffee-900 underline-offset-4 hover:underline"
            >
              Abrechnung ansehen →
            </Link>
          </div>
          <EventFeed
            events={eventList}
            members={memberList}
            products={productList}
            coffeePriceCents={group.coffee_price_cents}
            currency={group.currency}
          />
        </section>

        <section className="mt-6">
          <RecapDownload slug={slug} />
        </section>
      </main>
    </LiveGroupView>
  );
}
