import Image from "next/image";
import Link from "next/link";
import { LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import NavbarWelcome from "@/components/NavbarWelcome";
import HomeUserMenu from "@/components/HomeUserMenu";
import ServerEnvBadge from "@/components/ServerEnvBadge";

/**
 * The hairline between groups in the navbar.
 *
 * A 1px-wide box, not a bordered one: `border` on a 20px-tall div draws a
 * rectangle rather than a rule.
 */
function NavDivider() {
  return (
    <span
      aria-hidden
      className="hidden h-5 w-px shrink-0 bg-gray-200 sm:block"
    />
  );
}

/**
 * * ── Navbar ──
 * Sticky, and on the same 6xl column as every section below it, so the
 * logo sits over the content rather than out in the gutter. *
 */
export default function HomeNavbar({ token }: { token?: string }) {
  return (
    <nav className="sticky top-0 z-30 border-b border-gray-100 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-full items-center justify-between gap-4 px-6 py-3">
        <Link href="/" className="flex min-w-0 items-center gap-1.5">
          <Image
            src="/rebuzz.png"
            alt="ReBuzz"
            width={32}
            height={32}
            className="rounded-lg"
          />
          <span className="text-lg font-bold tracking-tight">
            <span style={{ color: "#244074" }}>Re</span>
            <span style={{ color: "#E26924" }}>Buzz</span>
          </span>
        </Link>

        {token ? (
          // The badge keeps its place at the head of the cluster; what
          // changed is the rest: the action, then who you are, then the
          // menu, with one rule between the badge and them rather than a
          // divider every other item.
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <ServerEnvBadge />

            <NavDivider />

            <Button
              asChild
              className="h-9 rounded-lg bg-[#244074] px-3 text-sm font-semibold text-white transition-colors hover:bg-[#1b3159] sm:px-4"
            >
              <Link
                href="/dashboard"
                aria-label="Go to Dashboard"
                className="flex items-center gap-2"
              >
                <LayoutDashboard size={15} aria-hidden />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>
            </Button>

            <span className="hidden lg:inline">
              <NavbarWelcome />
            </span>

            <HomeUserMenu />
          </div>
        ) : (
          <div className="flex shrink-0 items-center gap-2 md:gap-3">
            <ServerEnvBadge />

            <NavDivider />

            <Button
              asChild
              variant="ghost"
              className="h-9 rounded-xl px-4 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            >
              <Link href="/login">Log in</Link>
            </Button>
            <Button
              asChild
              className="h-9 rounded-xl bg-[#244074] px-4 text-sm font-semibold text-white hover:bg-[#1b3159] md:px-5"
            >
              <Link href="/signup">
                <span className="hidden sm:inline">Get started free</span>
                <span className="sm:hidden">Sign up</span>
              </Link>
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
}
