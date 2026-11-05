'use server';

import { generateSlug } from '@/lib/slug';
import { createClient as createServerClient } from '@/lib/supabase/server';

const MAX_SLUG_RETRIES = 3;
const RETRY_DELAY_MS = 100;

/**
 * Versucht, einen eindeutigen Slug zu generieren (mit Retry-Logik bei Kollisionen).
 */
async function generateUniqueSlug(supabase: any): Promise<string> {
  for (let attempt = 1; attempt <= MAX_SLUG_RETRIES; attempt++) {
    try {
      const slug = generateSlug();

      // Prüfe auf Kollision in der Datenbank
      const { data: existing, error: checkError } = await supabase
        .from('groups')
        .select('slug')
        .eq('slug', slug)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        // PGRST116 = nicht gefunden (expected)
        throw new Error(`Database check failed: ${checkError.message}`);
      }

      if (!existing) {
        // Slug ist eindeutig
        return slug;
      }

      // Kollision erkannt → nächster Versuch
      console.log(`Slug collision detected (attempt ${attempt}/${MAX_SLUG_RETRIES})`);

      if (attempt < MAX_SLUG_RETRIES) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Slug generation attempt ${attempt}/${MAX_SLUG_RETRIES} failed: ${message}`);

      if (attempt === MAX_SLUG_RETRIES) {
        throw new Error(
          `Failed to generate unique slug after ${MAX_SLUG_RETRIES} attempts: ${message}`
        );
      }

      if (attempt < MAX_SLUG_RETRIES) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      }
    }
  }

  throw new Error(`Slug generation failed after ${MAX_SLUG_RETRIES} retries`);
}

/**
 * Erstellt eine neue Gruppe und initialisiert den aktuellen Nutzer als Admin.
 */
export async function createGroup(groupName: string) {
  if (!groupName || groupName.trim().length === 0) {
    throw new Error('Group name cannot be empty');
  }

  try {
    const supabase = await createServerClient();

    // 1. Generiere eindeutigen Slug
    const slug = await generateUniqueSlug(supabase);
    console.log(`Slug generated successfully: ${slug}`);

    // 2. Erstelle Gruppe
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .insert([
        {
          slug,
          name: groupName.trim(),
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (groupError) {
      throw new Error(`Failed to create group: ${groupError.message}`);
    }

    // 3. Erstelle Admin-Mitglied
    const adminMemberName = 'Admin';
    const { data: member, error: memberError } = await supabase
      .from('members')
      .insert([
        {
          group_id: group.id,
          name: adminMemberName,
          is_admin: true,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (memberError) {
      throw new Error(`Failed to create admin member: ${memberError.message}`);
    }

    return {
      success: true,
      slug,
      groupId: group.id,
      memberId: member.id,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('createGroup error:', message);
    throw new Error(`Failed to create group: ${message}`);
  }
}
