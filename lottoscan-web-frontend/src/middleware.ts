import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect /super and /super/* routes
  if (pathname.startsWith("/super")) {
    const token = request.cookies.get("lottoscan_token")?.value;
    const role = request.cookies.get("lottoscan_role")?.value;

    // Check if token and super admin role exist
    const isSuperAdmin = role === "SUPER_ADMIN" || role === "admin";

    if (!token || !isSuperAdmin) {
      const loginUrl = new URL("/agent/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/super/:path*"],
};
