import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { supabaseService } from "@/lib/supabase/server";
import { readSessionCookie } from "@/lib/auth/session";
import { ProfileForm } from "./profile-form";

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

  return (
    <main className="min-h-screen px-6 py-8 max-w-md mx-auto">
      <Link
        href={`/g/${slug}`}
        className="inline-flex items-center gap-1 text-sm font-medium text-kaffee-800 hover:text-kaffee-900 underline-offset-4 hover:underline"
      >
        ← zurück zur Gruppe
      </Link>
      <h1 className="text-2xl font-bold text-kaffee-900 mt-2 mb-1">
        Mein Bereich
      </h1>
      <p className="text-sm text-kaffee-800 mb-6">
        Name, E-Mail und PayPal-Handle für die Abrechnung.
      </p>

      <ProfileForm
        slug={slug}
        initialName={me.name}
        initialEmail={me.email ?? ""}
        initialPaypal={me.paypal_handle ?? ""}
      />
    </main>
  );
}
