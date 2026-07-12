import { signSession } from "@/lib/auth/session";
import { joinGroupCore, JoinSchema } from "@/lib/api/groups";
import { jsonOk, jsonError } from "@/lib/api/http";

export const runtime = "nodejs";

/** POST /api/v1/auth/join → { token, member } */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const input = JoinSchema.parse(body);
    const session = await joinGroupCore(input);
    const token = await signSession(session);
    return jsonOk({
      token,
      member: { id: session.member_id, name: session.name },
      slug: session.slug,
    });
  } catch (err) {
    return jsonError(err);
  }
}
