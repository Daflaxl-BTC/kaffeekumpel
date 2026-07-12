import { signSession } from "@/lib/auth/session";
import { createGroupCore, CreateGroupSchema } from "@/lib/api/groups";
import { jsonOk, jsonError } from "@/lib/api/http";

export const runtime = "nodejs";

/** POST /api/v1/groups → { token, slug, member } */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const input = CreateGroupSchema.parse(body);
    const session = await createGroupCore(input);
    const token = await signSession(session);
    return jsonOk(
      {
        token,
        slug: session.slug,
        member: { id: session.member_id, name: session.name },
      },
      201,
    );
  } catch (err) {
    return jsonError(err);
  }
}
