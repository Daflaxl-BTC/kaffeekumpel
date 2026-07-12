import { requireSession, jsonOk, jsonError } from "@/lib/api/http";
import { createEvent, EventInputSchema } from "@/lib/api/events";

export const runtime = "nodejs";

/** POST /api/v1/groups/:slug/events → bucht coffee/cleaning/refill/purchase */
export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const session = await requireSession(req, slug);
    const body = await req.json();
    const input = EventInputSchema.parse(body);
    await createEvent(session, input);
    return jsonOk({ ok: true }, 201);
  } catch (err) {
    return jsonError(err);
  }
}
