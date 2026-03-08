import { NextResponse } from "next/server";

const SESSION_COOKIE_NAME = "punctoo_session";

export function middleware(req) {
  const { pathname } = req.nextUrl;
  const session = req.cookies.get(SESSION_COOKIE_NAME)?.value;

  const isAppRoute = pathname.startsWith("/app");
  const isAuthPage = pathname === "/login" || pathname === "/register";

  if (isAppRoute && !session) {
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthPage && session) {
    const appUrl = new URL("/app/employees", req.url);
    return NextResponse.redirect(appUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*", "/login", "/register"],
};