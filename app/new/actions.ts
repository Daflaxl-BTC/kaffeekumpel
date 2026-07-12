"use server";

import { redirect } from "next/navigation";
import { setSessionCookie } from "@/lib/auth/session";
import { createGroupCore, CreateGroupSchema } from "@/lib/api/groups";

export async function createGroup(formData: FormData) {
  const input = CreateGroupSchema.parse({
    groupName: formData.get("groupName"),
    myName: formData.get("myName"),
    coffeePrice: formData.get("coffeePrice") || "0.30",
  });

  const session = await createGroupCore(input);
  await setSessionCookie(session);

  redirect(`/g/${session.slug}?welcome=1`);
}
