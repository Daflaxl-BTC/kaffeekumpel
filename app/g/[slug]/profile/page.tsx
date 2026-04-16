import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { supabaseService } from "@/lib/supabase/server";
import { readSessionCookie, setSessionCookie } from "@/lib/auth/session";
import { normalizePaypalHandle, isValidPaypalHandle } from "@/lib/settlement/paypal";
import { Button } from "@/components/ui/button";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await readSessionCookie(slug);
  if (!session) redirect(`/g/${slug}/join`);

  const sb = supabaseService();
  const { data: me } = await sb
    .from("members")
    .select("*")
    .eq("id", session.member_id)
    .single();
  if (!me) notFound();

  async function save(formData: FormData) {
    "use server";
    const Schema = z.object({
      name: z.string().min(1).max(50),
      email: z.string().email().optional().or(z.literal("")),
      paypalHandle: z.string().max(40).optional().or(z.literal("")),
    });
    const input = Schema.parse({
      name: formData.get("name"),
      email: formData.get("email") ?? "",
      paypalHandle: formData.get("paypalHandle") ?? "",
    });

    let handle = input.paypalHandle ? normalizePaypalHandle(input.paypalHandle) : "";
    if (handle && !isValidPaypalHandle(handle)) {
      throw new Error("Ungültiger PayPal-Handle (nur Buchstaben/Zahlen, max 20).");
    }

    const sb2 = supabaseService();
    const s = await readSessionCookie(slug);
    if (!s) throw new Error("Keine Session");

    const { error } = await sb2
      .from("members")
      .update({
        name: input.name,
        email: input.email || null,
        paypal_handle: handle || null,
      })
      .eq("id", s.member_id);
    if (error) throw new Error(error.message);

    // Name-Change → Session-Cookie neu schreiben
    await setSessionCookie({ ...s, name: input.name });

    revalidatePath(`/g/${slug}`);
    revalidatePath(`/g/${slug}/profile`);
  }

  return (
    <main className="min-h-screen px-6 py-8 max-w-md mx-auto">
      <Link
        href={`/g/${slug}`}
        className="text-sm text-kaffee-700 hover:underline"
      >
        ← zurück zur Gruppe
      </Link>
      <h1 className="text-2xl font-bold text-kaffee-900 mt-2 mb-6">
        Dein Profil
      </h1>

      <form action={save} className="space-y-5 bg-white/80 rounded-2xl p-6 border border-kaffee-100">
        <div>
          <label className="block text-sm font-medium text-kaffee-900 mb-1">
            Name
          </label>
          <input
            name="name"
            defaultValue={me.name}
            required
            maxLength={50}
            className="w-full rounded-xl border border-kaffee-100 bg-white px-4 py-3"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-kaffee-900 mb-1">
            E-Mail <span className="text-kaffee-700/70 font-normal">(optional)</span>
          </label>
          <input
            name="email"
            type="email"
            defaultValue={me.email ?? ""}
            maxLength={200}
            placeholder="für Monatsabrechnungen später"
            className="w-full rounded-xl border border-kaffee-100 bg-white px-4 py-3"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-kaffee-900 mb-1">
            PayPal-Handle
          </label>
          <input
            name="paypalHandle"
            defaultValue={me.paypal_handle ?? ""}
            maxLength={40}
            placeholder="felixbredl (ohne @)"
            className="w-full rounded-xl border border-kaffee-100 bg-white px-4 py-3"
          />
          <p className="mt-1 text-xs text-kaffee-700/70">
            Ohne @, nur der Teil nach paypal.me/ — nötig damit andere dir direkt was
            überweisen können.
          </p>
        </div>

        <Button type="submit" size="lg" className="w-full">
          Speichern
        </Button>
      </form>
    </main>
  );
}
