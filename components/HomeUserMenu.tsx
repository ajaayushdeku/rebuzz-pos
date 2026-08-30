"use client";

import { useBusiness } from "@/hooks/useBusiness";
import User from "@/components/layout/User";

/**
 * The account menu from the app navbar, on the landing page.
 *
 * `User` needs the business name and logo as props, and the landing page is a
 * Server Component, so the lookup has to happen on the client — this is the
 * same two lines `Navbar` runs, kept here rather than duplicated inline so the
 * page stays a server render.
 */
export default function HomeUserMenu() {
  const { data: businessData } = useBusiness();

  return (
    <User
      initialBusinessName={businessData?.businessName || "My Business"}
      businessLogo={businessData?.logo ?? null}
    />
  );
}
