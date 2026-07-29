'use server';

import { createClient as createServerClient } from '@/lib/supabase/server';
import { generateSlug } from '@/lib/slug';
import { headers } from 'next/headers';

export async function createGroup(input: {
  groupName?: string;
  paypalHandle: string;
}): Promise<{ slug?: string; error?: string }> {
  // Validation
  if (!input.paypalHandle || input.paypalHandle.trim() === '') {
    return { error: 'PayPal-Handle ist erforderlich.' };
  }

  if (input.paypalHandle.trim().length < 3) {
    return { error: 'PayPal-Handle muss mindestens 3 Zeichen lang sein.' };
  }

  try {
    const supabase = await createServerClient();
    const slug = generateSlug();
    const groupName = input.groupName?.trim() || 'Kaffee-Crew';

    // Insert group
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .insert([
        {
          slug,
          name: groupName,
          paypal_handle: input.paypalHandle.trim(),
        },
      ])
      .select('id')
      .single();

    if (groupError) {
      // Log the DB error for debugging
      console.error('[createGroup] Database error:', {
        code: groupError.code,
        message: groupError.message,
        details: groupError.details,
        hint: groupError.hint,
      });

      // Categorize error for user-friendly message
      if (groupError.code === '23505') {
        // Unique constraint violation
        return { error: 'Diese Gruppe existiert bereits. Versuche es mit einem anderen Namen.' };
      }

      if (groupError.message.includes('rate limit')) {
        return { error: 'Zu viele Anfragen. Bitte versuche es in einer Minute erneut.' };
      }

      // Generic server error
      return { error: 'Datenbankfehler beim Erstellen der Gruppe. Bitte versuche es erneut.' };
    }

    if (!group) {
      console.error('[createGroup] Group created but no data returned');
      return { error: 'Gruppe wurde erstellt, aber keine Bestätigung erhalten.' };
    }

    console.log('[createGroup] Success:', { slug, groupName, groupId: group.id });
    return { slug };
  } catch (err) {
    // Catch unexpected errors
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('[createGroup] Unexpected error:', {
      message: errorMsg,
      stack: err instanceof Error ? err.stack : undefined,
      timestamp: new Date().toISOString(),
    });

    // Determine if error is likely transient (retryable)
    const isTransient =
      errorMsg.includes('timeout') ||
      errorMsg.includes('ECONNREFUSED') ||
      errorMsg.includes('ENOTFOUND');

    if (isTransient) {
      return { error: 'Verbindungsfehler. Der Client wird automatisch erneut versuchen.' };
    }

    return { error: 'Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es später erneut.' };
  }
}
