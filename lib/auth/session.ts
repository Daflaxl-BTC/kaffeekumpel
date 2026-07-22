import { jwtVerify, SignJWT } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'crypto';

const SESSION_SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET || 'dev-secret-change-in-production'
);

const COOKIE_NAME = 'kk-session';
const SESSION_DURATION = 365 * 24 * 60 * 60 * 1000; // 1 year

export interface AuthSession {
  success: boolean;
  memberId: string;
  memberName: string;
  token?: string;
  error?: string;
}

/**
 * Create a signed JWT session token
 */
export async function createSessionToken(
  memberId: string,
  memberName: string
): Promise<string> {
  const token = await new SignJWT({
    sub: memberId,
    name: memberName,
    iat: Math.floor(Date.now() / 1000),
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('365d')
    .sign(SESSION_SECRET);

  return token;
}

/**
 * Verify and decode JWT session token
 */
export async function verifySessionToken(token: string): Promise<{
  memberId: string;
  memberName: string;
} | null> {
  try {
    const verified = await jwtVerify(token, SESSION_SECRET);
    const payload = verified.payload as any;

    if (!payload.sub || !payload.name) {
      return null;
    }

    return {
      memberId: payload.sub as string,
      memberName: payload.name as string,
    };
  } catch (err) {
    console.error('[verifySessionToken] JWT verification failed:', err);
    return null;
  }
}

/**
 * Get or create a session from request cookies
 * Returns session if valid, creates new session if missing/invalid
 */
export async function verifyAuth(request: NextRequest): Promise<AuthSession> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(COOKIE_NAME)?.value;

    // Try to verify existing session
    if (sessionCookie) {
      const session = await verifySessionToken(sessionCookie);
      if (session) {
        return {
          success: true,
          memberId: session.memberId,
          memberName: session.memberName,
          token: sessionCookie,
        };
      }
    }

    // Create new anonymous session
    const memberId = uuidv4();
    const memberName = `Nutzer${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const token = await createSessionToken(memberId, memberName);

    // Set cookie (will be picked up in response)
    cookieStore.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_DURATION,
      path: '/',
    });

    return {
      success: true,
      memberId,
      memberName,
      token,
    };
  } catch (err) {
    console.error('[verifyAuth] Error:', err);
    return {
      success: false,
      memberId: '',
      memberName: '',
      error: 'Authentifizierung fehlgeschlagen',
    };
  }
}

/**
 * Middleware to attach session to response
 */
export async function attachSessionToResponse(
  response: NextResponse,
  token: string
): Promise<NextResponse> {
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION,
    path: '/',
  });
  return response;
}
