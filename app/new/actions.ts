"use server";

import { redirect } from "next/navigation";
import { setSessionCookie } from "@/lib/auth/session";
import { createGroupCore, CreateGroupSchema } from "@/lib/api/groups";
import { ApiError } from "@/lib/api/http";

export async function createGroup(formData: FormData) {
  try {
    const input = CreateGroupSchema.parse({
      groupName: formData.get("groupName"),
      myName: formData.get("myName"),
      coffeePrice: formData.get("coffeePrice") || "0.30",
    });

    const session = await createGroupCore(input);
    await setSessionCookie(session);

    redirect(`/g/${session.slug}?welcome=1`);
  } catch (err) {
    // Zod validation errors
    if (err instanceof Error && err.name === "ZodError") {
      // Re-throw as plain Error für Client-Error-Boundary
      const message = err instanceof Error ? err.message : "Ungültige Eingabe";
      throw new Error(`validation_error: ${message}`);
    }

    // ApiError: konvertiere zu serialisierbarem Format
    if (err instanceof ApiError) {
      if (err.code === "SUPABASE_KEY_INVALID") {
        throw new Error("SUPABASE_KEY_INVALID");
      }
      throw new Error(`api_error: ${err.message || err.code}`);
    }

    // Andere Errors
    if (err instanceof Error) {
      throw err;
    }

    throw new Error("Ein unerwarteter Fehler ist aufgetreten");
  }
}
