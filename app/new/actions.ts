"use server";

import { createClient } from "@/lib/supabase/server";
import { signJWT } from "@/lib/auth/session";
import { generateSlug } from "@/lib/slug";
import { headers } from "next/headers";

export async function createGroup(formData: FormData) {
  try {
    const name = formData.get("name")?.toString().trim();
    const paypalHandle = formData.get("paypal_handle")?.toString().trim();

    if (!name || !paypalHandle) {
      return {
        success: false,
        error: "Alle Felder sind erforderlich.",
      };
    }

    // Generate slug
    let slug: string;
    try {
      slug = generateSlug();
    } catch (err) {
      console.error("[createGroup] Slug generation failed:", err);
      return {
        success: false,
        error: "Fehler beim Generieren des Gruppen-Codes. Bitte versuchen Sie es erneut.",
      };
    }

    // Get admin user ID from JWT
    let adminUserId: string;
    try {
      const headersList = await headers();
      const cookieHeader = headersList.get("cookie") || "";
      // Try to extract existing user from cookie, or create anonymous
      // For now, generate a new UUID for the group creator
      const crypto = await import("crypto");
      adminUserId = crypto.randomUUID();
    } catch (err) {
      console.error("[createGroup] Admin ID generation failed:", err);
      return {
        success: false,
        error: "Fehler beim Erstellen der Gruppe. Bitte versuchen Sie es erneut.",
      };
    }

    // Create group in Supabase
    let groupData: { slug: string; name: string; paypal_handle: string; admin_id: string; created_at: string; slug_key?: string };
    try {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from("groups")
        .insert([
          {
            slug,
            name,
            paypal_handle: paypalHandle,
            admin_id: adminUserId,
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) {
        console.error("[createGroup] Supabase insert failed:", {
          code: error.code,
          message: error.message,
          details: error.details,
        });
        return {
          success: false,
          error: "Fehler beim Erstellen der Gruppe. Bitte überprüfen Sie die Eingaben und versuchen Sie es erneut.",
        };
      }

      if (!data) {
        console.error("[createGroup] Supabase returned no data");
        return {
          success: false,
          error: "Fehler beim Erstellen der Gruppe. Bitte versuchen Sie es erneut.",
        };
      }

      groupData = data;
    } catch (err) {
      console.error("[createGroup] Supabase operation failed:", err instanceof Error ? err.message : String(err));
      return {
        success: false,
        error: "Fehler beim Verbinden zur Datenbank. Bitte überprüfen Sie Ihre Internetverbindung und versuchen Sie es erneut.",
      };
    }

    // Sign JWT for the admin
    let token: string;
    try {
      const payload = {
        sub: adminUserId,
        group_slug: slug,
        role: "admin",
      };
      token = await signJWT(payload, "1y");
    } catch (err) {
      console.error("[createGroup] JWT signing failed:", err instanceof Error ? err.message : String(err));
      return {
        success: false,
        error: "Fehler beim Erstellen der Sitzung. Bitte versuchen Sie es erneut.",
      };
    }

    return {
      success: true,
      slug: groupData.slug,
      token,
    };
  } catch (err) {
    console.error("[createGroup] Unexpected error:", err instanceof Error ? err.message : String(err));
    return {
      success: false,
      error: "Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.",
    };
  }
}
