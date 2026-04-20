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
        className="text-sm text-kaffee-700 hover:underline"
      >
        ← zurück zur Gruppe
      </Link>
      <h1 className="text-2xl font-bold text-kaffee-900 mt-2 mb-6">
        Dein Profil
      </h1>

      <ProfileForm
        slug={slug}
        defaultName={me.name}
        defaultEmail={me.email ?? ""}
        defaultPaypalHandle={me.paypal_handle ?? ""}
      />
    </main>
  );
}
