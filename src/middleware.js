import { NextResponse } from "next/server";

const SESSION_COOKIE_NAME = "punctoo_session";
const ADMIN_SESSION_COOKIE_NAME = "punctoo_admin_session";

export function middleware(req) {
  const { pathname } = req.nextUrl;

  const userSessionCookie = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const adminSessionCookie = req.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value;

  const isAppRoute = pathname.startsWith("/app");
  const isAuthPage = pathname === "/login" || pathname === "/register";

  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");
  const isAdminLoginPage = pathname === "/admin/login";

  const isPublicScanRoute = pathname.startsWith("/s/");

  // =========================
  // 1. Public scan routes
  // =========================
  if (isPublicScanRoute) {
    return NextResponse.next();
  }

  // =========================
  // 2. Admin bescherming
  // =========================
  if (isAdminRoute) {
    // Niet ingelogd → naar admin login
    if (!adminSessionCookie && !isAdminLoginPage) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }

    // Wel ingelogd → weg van login pagina
    if (adminSessionCookie && isAdminLoginPage) {
      return NextResponse.redirect(new URL("/admin", req.url));
    }

    return NextResponse.next();
  }

  // =========================
  // 3. App (klantenomgeving)
  // =========================
  if (isAppRoute && !userSessionCookie) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (isAuthPage && userSessionCookie) {
    return NextResponse.redirect(new URL("/app/employees", req.url));
  }

  // =========================
  // 4. Default
  // =========================
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/app/:path*",
    "/login",
    "/register",
    "/admin/:path*",
    "/admin",
    "/s/:path*",
  ],
};