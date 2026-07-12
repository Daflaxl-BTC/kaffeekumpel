import { requireSession, jsonOk, jsonError } from "@/lib/api/http";
import { getGroupSnapshot } from "@/lib/api/groups";

export const runtime = "nodejs";

/** GET /api/v1/groups/:slug → voller Lesezustand (auth: Bearer/Cookie, slug-scoped) */
export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const session = await requireSession(req, slug);
    const snapshot = await getGroupSnapshot(session);
    return jsonOk(snapshot);
  } catch (err) {
    return jsonError(err);
  }
}
