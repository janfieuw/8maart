import { NextResponse } from "next/server";

const SESSION_COOKIE_NAME = "punctoo_session";

export function middleware(req) {
  const { pathname } = req.nextUrl;
  const sessionCookie = req.cookies.get(SESSION_COOKIE_NAME)?.value;

  const isAppRoute = pathname.startsWith("/app");
  const isAuthPage = pathname === "/login" || pathname === "/register";
  const isPublicScanRoute = pathname.startsWith("/s/");

  if (isPublicScanRoute) {
    return NextResponse.next();
  }

  // Cookie ontbreekt → login
  if (isAppRoute && !sessionCookie) {
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  // Auth pagina terwijl al cookie → naar app
  if (isAuthPage && sessionCookie) {
    const appUrl = new URL("/app/employees", req.url);
    return NextResponse.redirect(appUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*", "/login", "/register", "/s/:path*"],
};