import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyAuth } from '@/lib/auth/session';
import { generateSlug } from '@/lib/slug';

const REQUEST_TIMEOUT = 9000; // 9 seconds (client timeout is 10s)

export async function POST(request: NextRequest) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    try {
      // 1. Verify auth (will create session if needed)
      const auth = await verifyAuth(request);
      if (!auth.success) {
        return NextResponse.json(
          { error: 'Authentifizierung erforderlich' },
          { status: 401 }
        );
      }

      // 2. Parse and validate input
      let body;
      try {
        body = await request.json();
      } catch {
        return NextResponse.json(
          { error: 'Ungültiges JSON in Request-Body' },
          { status: 400 }
        );
      }

      const { name, location, paypal_handle } = body;

      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return NextResponse.json(
          { error: 'Gruppenname ist erforderlich' },
          { status: 400 }
        );
      }

      if (!location || typeof location !== 'string' || location.trim().length === 0) {
        return NextResponse.json(
          { error: 'Ort ist erforderlich' },
          { status: 400 }
        );
      }

      if (name.length > 100 || location.length > 100) {
        return NextResponse.json(
          { error: 'Name oder Ort zu lang (max. 100 Zeichen)' },
          { status: 400 }
        );
      }

      // 3. Create Supabase client
      const supabase = await createClient();

      // 4. Generate unique slug with retry
      let slug = '';
      let retries = 5;
      while (retries > 0) {
        slug = generateSlug();
        const { data: existing } = await supabase
          .from('groups')
          .select('id')
          .eq('slug', slug)
          .limit(1)
          .signal(controller.signal);

        if (!existing || existing.length === 0) {
          break; // Slug is unique
        }
        retries--;
      }

      if (!slug) {
        console.error('[groups/POST] Failed to generate unique slug after 5 retries');
        return NextResponse.json(
          { error: 'Konnte Gruppen-ID nicht generieren — bitte versuchen Sie es später erneut' },
          { status: 503 }
        );
      }

      // 5. Create group (with signal for abort)
      const { data: group, error: dbError } = await supabase
        .from('groups')
        .insert([
          {
            slug,
            name: name.trim(),
            location: location.trim(),
            paypal_handle: paypal_handle?.trim() || null,
            created_at: new Date().toISOString(),
          },
        ])
        .select('id, slug')
        .single()
        .signal(controller.signal);

      if (dbError) {
        console.error('[groups/POST] Database error:', dbError);
        // Check for unique constraint violation (duplicate slug — shouldn't happen, but race condition safety)
        if (dbError.code === '23505') {
          return NextResponse.json(
            { error: 'Diese Gruppen-ID existiert bereits — versuchen Sie es erneut' },
            { status: 409 }
          );
        }
        return NextResponse.json(
          { error: 'Fehler beim Erstellen der Gruppe' },
          { status: 500 }
        );
      }

      if (!group || !group.slug) {
        console.error('[groups/POST] No group returned from database');
        return NextResponse.json(
          { error: 'Fehler beim Abrufen der erstellten Gruppe' },
          { status: 500 }
        );
      }

      // 6. Add current user as group member (creator)
      const { data: member, error: memberError } = await supabase
        .from('group_members')
        .insert([
          {
            group_id: group.id,
            member_id: auth.memberId,
            name: auth.memberName,
            joined_at: new Date().toISOString(),
          },
        ])
        .select('id')
        .signal(controller.signal);

      if (memberError) {
        console.error('[groups/POST] Failed to add creator as member:', memberError);
        // Log but don't fail — group is created, just warn user
      }

      clearTimeout(timeoutId);

      return NextResponse.json(
        { id: group.id, slug: group.slug },
        { status: 201 }
      );
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      console.error('[groups/POST] Request timeout');
      return NextResponse.json(
        { error: 'Anfrage timeout — versuchen Sie es später erneut' },
        { status: 504 }
      );
    }

    console.error('[groups/POST] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Interner Fehler' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.success) {
      return NextResponse.json(
        { error: 'Authentifizierung erforderlich' },
        { status: 401 }
      );
    }

    const supabase = await createClient();

    // Fetch groups where current user is a member
    const { data: groups, error } = await supabase
      .from('group_members')
      .select('group_id, groups(id, slug, name, location, created_at)')
      .eq('member_id', auth.memberId);

    if (error) {
      console.error('[groups/GET] Database error:', error);
      return NextResponse.json(
        { error: 'Fehler beim Abrufen der Gruppen' },
        { status: 500 }
      );
    }

    const result = groups?.map((g: any) => g.groups).filter(Boolean) || [];

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    console.error('[groups/GET] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Interner Fehler' },
      { status: 500 }
    );
  }
}
