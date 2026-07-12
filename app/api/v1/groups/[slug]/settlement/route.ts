import { requireSession, jsonOk, jsonError } from "@/lib/api/http";
import { getSettlementSnapshot } from "@/lib/api/settlement";

export const runtime = "nodejs";

/** GET /api/v1/groups/:slug/settlement → Balances + Transfers (mit PayPal-Links) */
export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const session = await requireSession(req, slug);
    const snapshot = await getSettlementSnapshot(session);
    return jsonOk(snapshot);
  } catch (err) {
    return jsonError(err);
  }
}
