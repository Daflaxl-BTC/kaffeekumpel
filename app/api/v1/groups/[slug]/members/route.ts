import { jsonOk, jsonError } from "@/lib/api/http";
import { listPublicMembers } from "@/lib/api/groups";

export const runtime = "nodejs";

/**
 * GET /api/v1/groups/:slug/members → öffentliche Mitgliederliste (ohne PII).
 * Kein Auth nötig — das ist der Join-Screen (wer den Slug kennt, ist drin).
 */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const data = await listPublicMembers(slug);
    return jsonOk(data);
  } catch (err) {
    return jsonError(err);
  }
}
