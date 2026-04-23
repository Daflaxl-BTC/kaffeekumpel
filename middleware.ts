import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

/**
 * Middleware:
 *   - /g/[slug]          → Session-Cookie muss passen, sonst /g/[slug]/join
 *   - Alles andere       → durchlassen
 *
 * Achtung: Edge-Runtime → kein node:crypto, darum jose direkt.
 */

const COOKIE_NAME = "kk_session";
const JOIN_PATH_RE = /^\/g\/[^/]+\/join\/?$/;
const MAGIC_PATH_RE = /^\/g\/[^/]+\/magic\/?$/;
const QR_PATH_RE = /^\/api\/qr\//;
const GROUP_PATH_RE = /^\/g\/([^/]+)(\/.*)?$/;

async function verify(token: string, expectedSlug: string): Promise<boolean> {
  try {
    const secret = process.env.SESSION_SECRET;
    if (!secret) return false;
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret),
    );
    return (payload as { slug?: string }).slug === expectedSlug;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    JOIN_PATH_RE.test(pathname) ||
    MAGIC_PATH_RE.test(pathname) ||
    QR_PATH_RE.test(pathname)
  ) {
    return NextResponse.next();
  }

  const m = GROUP_PATH_RE.exec(pathname);
  if (!m) return NextResponse.next();

  const slug = m[1];
  const token = req.cookies.get(COOKIE_NAME)?.value;
  const ok = token ? await verify(token, slug) : false;

  if (!ok) {
    const joinUrl = req.nextUrl.clone();
    joinUrl.pathname = `/g/${slug}/join`;
    return NextResponse.redirect(joinUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/g/:slug*"],
};
