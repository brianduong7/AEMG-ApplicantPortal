import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth-constants";
import { parseCompanyId } from "@/lib/companies";

function sessionPayloadIsValid(raw: string | undefined): boolean {
  if (!raw) return false;
  try {
    const data = JSON.parse(raw) as { email?: unknown; company?: unknown };
    return (
      typeof data.email === "string" &&
      data.email.length > 0 &&
      parseCompanyId(data.company) !== null
    );
  } catch {
    return false;
  }
}

export function middleware(request: NextRequest) {
  const cookieVal = request.cookies.get(SESSION_COOKIE)?.value;
  const hasValidSession = sessionPayloadIsValid(cookieVal);
  const hasCookie = Boolean(cookieVal);
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/jobs")) {
    if (!hasValidSession) {
      const login = new URL("/login", request.url);
      login.searchParams.set("from", pathname);
      const res = NextResponse.redirect(login);
      if (hasCookie) res.cookies.delete(SESSION_COOKIE);
      return res;
    }
    return NextResponse.next();
  }

  if (pathname === "/login" && hasValidSession) {
    return NextResponse.redirect(new URL("/jobs", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/jobs/:path*", "/login"],
};
