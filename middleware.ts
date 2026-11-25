import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { ACCESS_DENIED_PATH, ROLE_COOKIE, isAdminRole } from "@/lib/auth/roles";

// Pages that are accessible without authentication.
const publicPages = [
  "/",
  "/login",
  "/signup",
  "/forgot-password",
  "/signup/verify",
  // Reachable without a token on purpose: the token is cleared on the way in,
  // so the page can explain why access was denied.
  ACCESS_DENIED_PATH,
];

// Auth pages that authenticated users should normally be redirected away from.
const authOnlyPages = [
  "/login",
  "/signup",
  "/forgot-password",
  "/signup/verify",
];

export function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const role = request.cookies.get(ROLE_COOKIE)?.value;
  const { pathname } = request.nextUrl;

  // Normalize pathname: remove trailing slash except for root.
  const normalizedPath =
    pathname.endsWith("/") && pathname !== "/"
      ? pathname.slice(0, -1)
      : pathname;

  const isPublicPage = publicPages.some(
    (page) => normalizedPath === page || normalizedPath.startsWith(page + "/"),
  );

  // Authentication pages that support adding or switching accounts.
  const isAuthPage = authOnlyPages.some(
    (page) => normalizedPath === page || normalizedPath.startsWith(page + "/"),
  );

  // Preserve the account-switching context across authentication pages.
  // Example: /login?add=1 -> /forgot-password?add=1
  const isAddingAccount =
    isAuthPage && request.nextUrl.searchParams.get("add") === "1";

  // ── Signed in as a known non-admin → deny access and clear session ──
  //
  // Deliberately keyed on a role that is present and wrong, not merely
  // missing. Older sessions without a role cookie are checked by the
  // authenticated app layout instead.
  const isKnownNonAdmin = role !== undefined && !isAdminRole(role);

  if (token && isKnownNonAdmin && normalizedPath !== ACCESS_DENIED_PATH) {
    const denied = NextResponse.redirect(
      new URL(ACCESS_DENIED_PATH, request.url),
    );

    const expire = { path: "/", maxAge: 0 };
    denied.cookies.set("token", "", expire);
    denied.cookies.set(ROLE_COOKIE, "", expire);

    return denied;
  }

  // ── Authenticated user on auth pages → dashboard ──
  //
  // Exception: ?add=1 allows the user to add another account,
  // recover its password, or create another account without
  // immediately leaving their current account.
  if (token && isPublicPage && isAuthPage && !isAddingAccount) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // ── Unauthenticated user on a protected page → login ──
  if (!token && !isPublicPage) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", normalizedPath);

    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all routes except static files, _next, API, and favicon.
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
