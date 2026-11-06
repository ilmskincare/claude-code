import { NextResponse, type NextRequest } from "next/server";
import { getPrincipal } from "@/lib/session";
import { channelMessages } from "@/lib/chat";
import { ForbiddenError, NotFoundError } from "@/lib/rbac";

/** Polling endpoint for the chat pane: messages after a timestamp, for a channel the caller may read. */
export async function GET(req: NextRequest, ctx: { params: Promise<{ channelId: string }> }) {
  const p = await getPrincipal();
  if (!p) return NextResponse.json({ error: "Sign in" }, { status: 401 });
  const { channelId } = await ctx.params;
  const afterRaw = req.nextUrl.searchParams.get("after");
  const after = afterRaw ? new Date(afterRaw) : undefined;
  try {
    const r = await channelMessages(p, channelId, after && !Number.isNaN(after.getTime()) ? after : undefined);
    return NextResponse.json({ messages: r.messages }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    if (e instanceof ForbiddenError) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (e instanceof NotFoundError) return NextResponse.json({ error: "Not found" }, { status: 404 });
    throw e;
  }
}
