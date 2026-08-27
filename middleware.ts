import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { ACCESS_DENIED_PATH, ROLE_COOKIE, isAdminRole } from "@/lib/auth/roles";

// Pages that are accessible without authentication
const publicPages = [
  "/",
  "/login",
  "/signup",
  "/forgot-password",
  "/signup/verify",
  // Reachable without a token on purpose: the token is cleared on the way in,
  // so the page would bounce to /login and the reason would never be shown.
  ACCESS_DENIED_PATH,
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
  const role = request.cookies.get(ROLE_COOKIE)?.value;
  const { pathname } = request.nextUrl;

  // Normalize pathname: remove trailing slash if present (except for root "/")
  const normalizedPath =
    pathname.endsWith("/") && pathname !== "/"
      ? pathname.slice(0, -1)
      : pathname;

  const isPublicPage = publicPages.some(
    (page) => normalizedPath === page || normalizedPath.startsWith(page + "/"),
  );

  // Adding another account: a logged-in user intentionally visits /login?add=1
  // to sign into a second account. Skip the auth-only redirect for that case.
  const isAddingAccount =
    normalizedPath === "/login" &&
    request.nextUrl.searchParams.get("add") === "1";

  // ── Signed in as a known non-admin → out, and take the token with it ──
  //
  // Login already refuses these accounts, so a token here predates the check
  // or was put there by hand. Clearing it on the way out means the next
  // request arrives with nothing, rather than looping through this branch on
  // every navigation.
  //
  // Deliberately keyed on a role that is present and wrong, not on one that is
  // merely missing: sessions from before this cookie existed have a token and
  // no role, and throwing every one of them out would sign out admins too.
  // Those are caught by `app/(app)/layout.tsx`, which asks the profile
  // endpoint instead of trusting a cookie — that check is also what catches a
  // role cookie somebody edited to say "admin", since this one cannot.
  //
  // `pos_accounts` is left alone: it holds other accounts' tokens, and the
  // switch route runs the same gate before any of them can become active.
  const isKnownNonAdmin = role !== undefined && !isAdminRole(role);

  if (token && isKnownNonAdmin && normalizedPath !== ACCESS_DENIED_PATH) {
    const denied = NextResponse.redirect(
      new URL(ACCESS_DENIED_PATH, request.url),
    );
    // Spelled out rather than `.delete(name)`: both cookies were written with
    // an explicit path, and an expiry that does not match the original path
    // leaves the cookie in place.
    const expire = { path: "/", maxAge: 0 };
    denied.cookies.set("token", "", expire);
    denied.cookies.set(ROLE_COOKIE, "", expire);
    return denied;
  }

  // ── Authorized user on auth-only pages → redirect to dashboard ──
  if (
    token &&
    isPublicPage &&
    !isAddingAccount &&
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
