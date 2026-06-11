import { NextRequest, NextResponse } from "next/server";

// ── Route groups ──────────────────────────────────────────────────────────

// Auth pages — authenticated users should be redirected away from these
const AUTH_ROUTES = ["/login", "/signup", "/onboarding"];

// Protected prefixes — unauthenticated users should be redirected to /login
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/invoices",
  "/customers",
  "/offers",
  "/expenses",
  "/settings",
  "/records",
  "/profile",
  "/products",
];

// Routes that are always public (static assets, api, preview links, etc.)
const PUBLIC_PREFIXES = [
  "/_next",
  "/api",
  "/favicon",
  "/preview", // public invoice preview pages
  "/public",
];

// ── Helpers ───────────────────────────────────────────────────────────────

function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/"),
  );
}

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/"),
  );
}

function isPublicAsset(pathname: string): boolean {
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

// ── Middleware ────────────────────────────────────────────────────────────

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow public assets and API routes through
  if (isPublicAsset(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get("token")?.value;
  const isAuthenticated = !!token;

  // ── Case 1: Authenticated user tries to access an auth page ──────────
  if (isAuthenticated && isAuthRoute(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // ── Case 2: Unauthenticated user tries to access a protected route ────
  if (!isAuthenticated && isProtectedRoute(pathname)) {
    // Preserve the originally requested URL as a redirect param
    // so post-login we can send them back
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── Case 3: Root path — redirect based on auth state ─────────────────
  if (pathname === "/") {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    // Let the landing page render for unauthenticated users
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public folder files (.svg, .png, .jpg, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)",
  ],
};
