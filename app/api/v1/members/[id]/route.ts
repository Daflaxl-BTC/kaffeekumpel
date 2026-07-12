import { requireSession, jsonOk, jsonError, ApiError } from "@/lib/api/http";
import { saveProfileCore, ProfileSchema } from "@/lib/api/profile";

export const runtime = "nodejs";

/** PATCH /api/v1/members/:id → Profil aktualisieren (nur eigenes Mitglied) */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await requireSession(req);
    if (id !== session.member_id) {
      throw new ApiError(403, "forbidden", "Nur das eigene Profil darf geändert werden");
    }
    const body = await req.json();
    const input = ProfileSchema.parse(body);
    const result = await saveProfileCore(session, input);
    return jsonOk(result);
  } catch (err) {
    return jsonError(err);
  }
}
