"use server";

import { revalidatePath } from "next/cache";
import { readSessionCookie, setSessionCookie } from "@/lib/auth/session";
import { saveProfileCore } from "@/lib/api/profile";

export async function saveProfile(
  slug: string,
  input: { name: string; email: string; paypalHandle: string },
) {
  const session = await readSessionCookie(slug);
  if (!session) throw new Error("Keine Session");

  const { name } = await saveProfileCore(session, input);
  await setSessionCookie({ ...session, name });

  revalidatePath(`/g/${slug}`);
  revalidatePath(`/g/${slug}/profile`);
}
