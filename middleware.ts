import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Pages that are accessible without authentication
const publicPages = [
  "/",
  "/login",
  "/signup",
  "/forgot-password",
  "/signup/verify",
];

// Auth-only pages that authenticated users should be redirected away from
const authOnlyPages = [
  "/login",
  "/signup",
  "/forgot-password",
  "/signup/verify",
];

export function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const { pathname } = request.nextUrl;

  // Normalize pathname: remove trailing slash if present (except for root "/")
  const normalizedPath =
    pathname.endsWith("/") && pathname !== "/"
      ? pathname.slice(0, -1)
      : pathname;

  const isPublicPage = publicPages.some(
    (page) => normalizedPath === page || normalizedPath.startsWith(page + "/"),
  );

  // ── Authorized user on auth-only pages → redirect to dashboard ──
  if (
    token &&
    isPublicPage &&
    authOnlyPages.some(
      (page) =>
        normalizedPath === page || normalizedPath.startsWith(page + "/"),
    )
  ) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // ── Unauthorized user on a non-public page → redirect to login ──
  if (!token && !isPublicPage) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", normalizedPath);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all routes except static files, _next, api, and favicon
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
