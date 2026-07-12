import { requireSession, jsonOk, jsonError } from "@/lib/api/http";
import { finalizeSettlementCore } from "@/lib/api/settlement";

export const runtime = "nodejs";

/** POST /api/v1/groups/:slug/settlement/finalize → schließt Zeitraum ab (Admin) */
export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const session = await requireSession(req, slug);
    const result = await finalizeSettlementCore(session);
    return jsonOk(result, 201);
  } catch (err) {
    return jsonError(err);
  }
}
