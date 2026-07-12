import { z } from "zod";
import { requireSession, jsonOk, jsonError } from "@/lib/api/http";
import { markDebtPaidCore } from "@/lib/api/settlement";

export const runtime = "nodejs";

const IdSchema = z.string().uuid();

/** POST /api/v1/debts/:id/paid → markiert eigene Schuld als bezahlt */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const debtId = IdSchema.parse(id);
    const session = await requireSession(req);
    await markDebtPaidCore(session, debtId);
    return jsonOk({ ok: true });
  } catch (err) {
    return jsonError(err);
  }
}
