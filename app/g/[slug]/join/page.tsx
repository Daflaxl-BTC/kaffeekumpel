import { notFound } from "next/navigation";
import { supabaseService } from "@/lib/supabase/server";
import { JoinForm } from "./join-form";

export default async function JoinPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const sb = supabaseService();

  const { data: group } = await sb
    .from("groups")
    .select("id, name")
    .eq("slug", slug)
    .single();
  if (!group) notFound();

  const { data: members } = await sb
    .from("members")
    .select("id, name")
    .eq("group_id", group.id)
    .eq("active", true)
    .order("name");

  return (
    <main className="min-h-screen px-6 py-12 max-w-md mx-auto">
      <h1 className="text-3xl font-bold text-kaffee-900 mb-1">
        Willkommen bei<br />
        <span className="text-kaffee-700">{group.name}</span>
      </h1>
      <p className="text-kaffee-700 mb-6">
        Wer bist du? Das merken wir uns auf diesem Gerät — du musst dich nicht
        registrieren.
      </p>

      <JoinForm slug={slug} members={members ?? []} />
    </main>
  );
}
