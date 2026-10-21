"use server";

import { createServerClient } from "@/lib/supabase/server";
import { generateSlug } from "@/lib/slug";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function createGroup(formData: FormData) {
  try {
    const groupName = formData.get("group_name") as string;

    // Validation
    if (!groupName || groupName.trim().length === 0) {
      return {
        error: "Gruppenname ist erforderlich.",
        success: false,
      };
    }

    if (groupName.trim().length < 2) {
      return {
        error: "Gruppenname muss mindestens 2 Zeichen lang sein.",
        success: false,
      };
    }

    if (groupName.trim().length > 100) {
      return {
        error: "Gruppenname darf maximal 100 Zeichen lang sein.",
        success: false,
      };
    }

    // Generate slug
    let slug: string;
    try {
      slug = generateSlug();
    } catch (slugError) {
      console.error("[createGroup] Slug generation failed:", slugError);
      return {
        error: "Fehler bei der Generierung des Gruppen-Codes. Bitte versuchen Sie es erneut.",
        success: false,
      };
    }

    // Initialize Supabase client
    let supabase;
    try {
      supabase = await createServerClient();
    } catch (clientError) {
      console.error("[createGroup] Supabase client initialization failed:", clientError);
      return {
        error: "Verbindungsfehler. Bitte versuchen Sie es später erneut.",
        success: false,
      };
    }

    // Create group in database
    let groupData;
    try {
      const { data, error } = await supabase
        .from("groups")
        .insert({
          slug,
          name: groupName.trim(),
        })
        .select()
        .single();

      if (error) {
        console.error("[createGroup] Supabase insert error:", {
          code: error.code,
          message: error.message,
          details: error.details,
        });

        // Handle specific Supabase errors
        if (error.code === "23505") {
          // Unique violation
          return {
            error: "Dieser Gruppen-Code existiert bereits. Bitte versuchen Sie es erneut.",
            success: false,
          };
        }

        return {
          error: "Fehler beim Erstellen der Gruppe. Bitte versuchen Sie es später erneut.",
          success: false,
        };
      }

      groupData = data;
    } catch (dbError) {
      console.error("[createGroup] Database operation failed:", dbError);
      return {
        error: "Datenbankfehler. Bitte versuchen Sie es später erneut.",
        success: false,
      };
    }

    if (!groupData) {
      console.error("[createGroup] No group data returned from insert");
      return {
        error: "Fehler beim Erstellen der Gruppe. Bitte versuchen Sie es später erneut.",
        success: false,
      };
    }

    // Set authentication cookie
    try {
      const cookieStore = await cookies();
      // TODO: Implement JWT signing with SESSION_SECRET
      // For now, store slug for redirect
      cookieStore.set("pending_group_slug", slug, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60, // 1 hour
      });
    } catch (cookieError) {
      console.error("[createGroup] Cookie setting failed:", cookieError);
      // Continue anyway - cookie is optional for redirect
    }

    return {
      success: true,
      slug,
    };
  } catch (error) {
    console.error("[createGroup] Unexpected error:", error);
    return {
      error: "Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.",
      success: false,
    };
  }
}
