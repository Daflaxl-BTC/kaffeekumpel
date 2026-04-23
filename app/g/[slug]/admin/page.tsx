import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { supabaseService } from "@/lib/supabase/server";
import { readSessionCookie } from "@/lib/auth/session";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  updateGroupSettings,
  deactivateMember,
  setMemberRole,
  deleteGroup,
} from "./actions";

export default async function AdminPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await readSessionCookie(slug);
  if (!session) redirect(`/g/${slug}/join`);

  const sb = supabaseService();
  const { data: group } = await sb
    .from("groups")
    .select("*")
    .eq("slug", slug)
    .single();
  if (!group) notFound();

  const { data: me } = await sb
    .from("members")
    .select("role")
    .eq("id", session.member_id)
    .single();
  if (me?.role !== "admin") {
    redirect(`/g/${slug}`);
  }

  const { data: members } = await sb
    .from("members")
    .select("*")
    .eq("group_id", group.id)
    .order("active", { ascending: false })
    .order("created_at", { ascending: true });

  const memberList = members ?? [];
  const activeCount = memberList.filter((m) => m.active).length;
  const coffeePriceEuro = (group.coffee_price_cents / 100).toFixed(2);

  return (
    <main className="min-h-screen max-w-2xl mx-auto px-4 pt-6 pb-24">
      <Link
        href={`/g/${slug}`}
        className="text-sm text-kaffee-700 hover:underline"
      >
        ← zurück zur Gruppe
      </Link>
      <h1 className="text-2xl font-bold text-kaffee-900 mt-2 mb-6">
        Verwaltung
      </h1>

      {/* Gruppen-Einstellungen */}
      <section className="mb-6">
        <h2 className="text-sm font-semibold text-kaffee-700 mb-2">
          Gruppen-Einstellungen
        </h2>
        <Card>
          <form action={updateGroupSettings} className="space-y-4">
            <input type="hidden" name="slug" value={slug} />
            <div>
              <label className="block text-sm font-medium text-kaffee-900 mb-1">
                Name der Gruppe
              </label>
              <input
                name="name"
                defaultValue={group.name}
                required
                maxLength={80}
                className="w-full rounded-xl border border-kaffee-100 bg-white px-4 py-3"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-kaffee-900 mb-1">
                  Preis pro Kaffee (€)
                </label>
                <input
                  name="coffeePrice"
                  type="number"
                  step="0.05"
                  min="0"
                  defaultValue={coffeePriceEuro}
                  className="w-full rounded-xl border border-kaffee-100 bg-white px-4 py-3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-kaffee-900 mb-1">
                  Putzrhythmus (Tage)
                </label>
                <input
                  name="cleaningIntervalDays"
                  type="number"
                  min="1"
                  max="365"
                  defaultValue={group.cleaning_interval_days}
                  className="w-full rounded-xl border border-kaffee-100 bg-white px-4 py-3"
                />
              </div>
            </div>
            <Button type="submit" size="md">
              Speichern
            </Button>
          </form>
        </Card>
      </section>

      {/* Mitglieder-Verwaltung */}
      <section className="mb-6">
        <h2 className="text-sm font-semibold text-kaffee-700 mb-2">
          Mitglieder ({activeCount} aktiv)
        </h2>
        <div className="grid gap-2">
          {memberList.map((m) => (
            <Card
              key={m.id}
              className={m.active ? "" : "opacity-50"}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-kaffee-900 truncate">
                    {m.name}
                    {m.role === "admin" && (
                      <span className="ml-2 text-xs bg-kaffee-700 text-white rounded px-1.5 py-0.5 align-middle">
                        Admin
                      </span>
                    )}
                    {!m.active && (
                      <span className="ml-2 text-xs text-kaffee-700/70">
                        (entfernt)
                      </span>
                    )}
                  </div>
                  {m.email && (
                    <div className="text-xs text-kaffee-700/70 truncate">
                      {m.email}
                    </div>
                  )}
                </div>
                {m.active && m.id !== session.member_id && (
                  <div className="flex gap-1.5 shrink-0">
                    <form action={setMemberRole}>
                      <input type="hidden" name="slug" value={slug} />
                      <input type="hidden" name="memberId" value={m.id} />
                      <input
                        type="hidden"
                        name="role"
                        value={m.role === "admin" ? "member" : "admin"}
                      />
                      <Button type="submit" variant="secondary" size="sm">
                        {m.role === "admin" ? "Zu Mitglied" : "Zu Admin"}
                      </Button>
                    </form>
                    <form action={deactivateMember}>
                      <input type="hidden" name="slug" value={slug} />
                      <input type="hidden" name="memberId" value={m.id} />
                      <Button type="submit" variant="danger" size="sm">
                        Entfernen
                      </Button>
                    </form>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
        <p className="mt-2 text-xs text-kaffee-700/70">
          Entfernte Mitglieder werden nicht aus der Datenbank gelöscht —
          ihre Historie bleibt für Abrechnungen erhalten, sie tauchen nur in
          den Listen nicht mehr auf.
        </p>
      </section>

      {/* Danger Zone */}
      <section>
        <h2 className="text-sm font-semibold text-red-700 mb-2">
          Danger Zone
        </h2>
        <Card className="border-red-200 bg-red-50/60">
          <details>
            <summary className="cursor-pointer text-sm font-medium text-red-900">
              Gruppe komplett löschen
            </summary>
            <div className="mt-3 space-y-3">
              <p className="text-sm text-red-900">
                Das löscht unwiderruflich die Gruppe, alle Mitglieder,
                Kaffees, Einkäufe und Abrechnungen. Der QR-Code auf dem
                Holzschild funktioniert danach nicht mehr.
              </p>
              <form action={deleteGroup} className="space-y-2">
                <input type="hidden" name="slug" value={slug} />
                <label className="block text-xs font-medium text-red-900">
                  Zum Bestätigen tipp den Gruppen-Code{" "}
                  <span className="font-mono">{slug}</span> ein:
                </label>
                <input
                  name="confirm"
                  required
                  autoComplete="off"
                  className="w-full rounded-xl border border-red-300 bg-white px-4 py-2 font-mono"
                  placeholder={slug}
                />
                <Button type="submit" variant="danger" size="md">
                  Unwiderruflich löschen
                </Button>
              </form>
            </div>
          </details>
        </Card>
      </section>
    </main>
  );
}
