import { adminOr401 } from "@/lib/auth/guard";
import { codesEventStream } from "@/lib/otp/sse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Admin real-time stream — same live feed as the public route, gated by session
// instead of a URL token. EventSource sends the session cookie automatically.
export async function GET(req: Request) {
  const gate = await adminOr401();
  if ("res" in gate) return gate.res;
  return codesEventStream(req.signal);
}
