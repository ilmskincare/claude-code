import { NextResponse, type NextRequest } from "next/server";

/**
 * Optimistic redirect for signed-out visitors to protected areas. Real
 * authorisation happens server-side in every page and action (src/lib/session.ts).
 */
export function proxy(req: NextRequest) {
  const hasSession = req.cookies.getAll().some((c) => c.name.includes("authjs.session-token"));
  if (!hasSession) {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/my/:path*", "/studio/:path*", "/owner/:path*"] };
