import Link from "next/link";
import Image from "next/image";
import { cookies } from "next/headers";
import { Button } from "@/components/ui/button";
import InvoiceSs from "@/public/InvoiceScreenshot.png";
import {
  BarChart3,
  Receipt,
  CreditCard,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Coins,
  FileText,
  Landmark,
  Zap,
} from "lucide-react";
import NavbarWelcome from "@/components/NavbarWelcome";
import HomeUserMenu from "@/components/HomeUserMenu";
import ServerEnvBadge from "@/components/ServerEnvBadge";

/**
 * The feature grid.
 *
 * `wide` marks the one card that leads the row — a grid of four identical
 * tiles gives the eye nowhere to start, so the first one takes double width
 * and carries a longer line.
 */
const FEATURES = [
  {
    icon: Receipt,
    title: "Smart Invoicing",
    description:
      "Create professional invoices in seconds with automatic tax and discount calculations — proforma, invoice and tax invoice from the same sale.",
    wide: true,
  },
  {
    icon: CreditCard,
    title: "Online Payments",
    description:
      "Accept cash, card, and QR payments seamlessly. All tracked in one place.",
  },
  {
    icon: BarChart3,
    title: "Real-time Analytics",
    description:
      "Track sales, profit margins, and staff performance with live dashboards.",
  },
  {
    icon: ShieldCheck,
    title: "Secure & Reliable",
    description:
      "Your data is encrypted and backed up automatically, always available when you need it.",
  },
];

/**
 * The band under the hero.
 *
 * Specifics rather than round numbers: every line here is something the
 * product actually does, which is what makes a strip like this read as
 * substance instead of decoration.
 */
const CAPABILITIES = [
  { icon: Coins, label: "Multi-currency", value: "127 supported" },
  { icon: CreditCard, label: "Payments", value: "Cash, card, QR & loyalty" },
  { icon: FileText, label: "Documents", value: "Invoice, tax & receipts" },
  { icon: Landmark, label: "Tax", value: "Nepal-ready VAT & PAN" },
];

const GUEST_HIGHLIGHTS = [
  "No setup fees — free to get started",
  "Works on any device",
  "Nepal-ready with NPR support",
  "Inventory & stock tracking",
];

const AUTH_HIGHLIGHTS = [
  "Monitor today's sales",
  "Manage inventory & stock",
  "Track expenses in real-time",
  "View business analytics",
];

/** Faint graph paper behind the hero, fading out before it meets the content. */
const GRID_STYLE: React.CSSProperties = {
  backgroundImage:
    "linear-gradient(to right, rgb(226 232 240 / 0.7) 1px, transparent 1px)," +
    "linear-gradient(to bottom, rgb(226 232 240 / 0.7) 1px, transparent 1px)",
  backgroundSize: "56px 56px",
  maskImage:
    "radial-gradient(ellipse 70% 60% at 50% 0%, #000 55%, transparent 100%)",
  WebkitMaskImage:
    "radial-gradient(ellipse 70% 60% at 50% 0%, #000 55%, transparent 100%)",
};

const Page = async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  return (
    <div className="min-h-screen bg-white">
      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-gray-100 bg-white/90 px-4 py-3 backdrop-blur-md sm:px-6 ">
        <div className="flex min-w-0 items-center gap-1.5">
          <Image
            src="/rebuzz.png"
            alt="ReBuzz Logo"
            width={32}
            height={32}
            className="rounded-lg"
          />
          <span className="text-lg font-bold tracking-tight">
            <span style={{ color: "#244074" }}>Re</span>
            <span style={{ color: "#E26924" }}>Buzz</span>
          </span>
          {/* <ServerEnvBadge className="ml-1" /> */}
        </div>

        {token ? (
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <ServerEnvBadge className="ml-1" />

            <div className="h-5 border-1  border-gray-200 mx-2" />

            <span className="hidden lg:inline">
              <NavbarWelcome />
            </span>

            <HomeUserMenu />

            {/* <span
              aria-hidden
              className="hidden h-7 w-px shrink-0 bg-gray-200 sm:block"
            /> */}

            <div className="h-5 border-1  border-gray-200 mx-2" />

            <Button
              asChild
              className="h-8 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 sm:px-5"
            >
              <Link href="/dashboard" className="flex items-center gap-1.5">
                <span className="hidden sm:inline">Go to Dashboard</span>
                <span className="sm:hidden">Dashboard</span>
                <ArrowRight size={14} />
              </Link>
            </Button>
          </div>
        ) : (
          <div className="flex shrink-0 items-center gap-2 md:gap-3">
            <ServerEnvBadge className="ml-1" />

            <div className="h-5 border-1  border-gray-200 mx-2" />

            <Button
              asChild
              variant="ghost"
              className="h-10 rounded-xl px-4 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            >
              <Link href="/login">Log in</Link>
            </Button>
            <Button
              asChild
              className="h-10 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 md:px-5"
            >
              <Link href="/signup">
                <span className="hidden sm:inline">Get started free</span>
                <span className="sm:hidden">Sign up</span>
              </Link>
            </Button>
          </div>
        )}
      </nav>

      {/* ── Hero ──
          Given a ground of its own — grid, wash and a fade back to white — so
          the fold has weight instead of being text floating on a blank page.
          The screenshot lives inside it rather than in a section below, which
          is what turns the two into one composition. */}
      <section className="relative overflow-hidden border-b border-gray-100 bg-slate-50/60">
        <div aria-hidden className="absolute inset-0" style={GRID_STYLE} />
        <div
          aria-hidden
          className="pointer-events-none absolute -top-40 left-1/2 h-[34rem] w-[64rem] -translate-x-1/2 rounded-full bg-blue-200/25 blur-3xl"
        />
        {/* Fades the ground out under the screenshot so the next section
            starts on clean white with no seam. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-64 bg-gradient-to-b from-transparent to-white"
        />

        <div className="relative mx-auto max-w-6xl px-6 pt-16 md:px-16 md:pt-24">
          <div className="text-center">
            <span className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-white/80 px-3 py-1 text-xs font-semibold text-blue-600 shadow-sm backdrop-blur">
              <Zap size={11} />
              Built for Nepal&lsquo;s businesses
            </span>

            <h1 className="mx-auto max-w-4xl text-balance text-4xl font-bold leading-[1.05] tracking-tighter text-gray-900 sm:text-5xl md:text-6xl lg:text-[4.25rem]">
              {token ? (
                <>
                  Welcome back to{" "}
                  <span className="text-blue-600">ReBuzz POS</span>
                </>
              ) : (
                <>
                  Run your business{" "}
                  <span className="text-blue-600">smarter</span>, not harder
                </>
              )}
            </h1>

            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-gray-500 md:text-lg">
              {token
                ? "Monitor sales, manage inventory, track expenses, and grow your business from a single dashboard."
                : "Rebuzz POS helps small business owners create invoices, track inventory, accept payments, and understand their numbers — all in one clean dashboard."}
            </p>

            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              {token ? (
                <>
                  <Button
                    asChild
                    className="h-12 w-full rounded-xl bg-blue-600 px-7 text-base font-semibold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700 hover:shadow-blue-600/30 sm:w-auto"
                  >
                    <Link
                      href="/sales-revenue"
                      className="flex items-center gap-2"
                    >
                      Manage Sales
                      <ArrowRight size={16} />
                    </Link>
                  </Button>

                  <Button
                    asChild
                    variant="outline"
                    className="h-12 w-full rounded-xl border-gray-200 bg-white px-7 text-base font-medium text-gray-700 hover:bg-gray-50 sm:w-auto"
                  >
                    <Link href="/dashboard/growth-tracker">View Reports</Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    asChild
                    className="h-12 w-full rounded-xl bg-blue-600 px-7 text-base font-semibold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700 hover:shadow-blue-600/30 sm:w-auto"
                  >
                    <Link href="/signup" className="flex items-center gap-2">
                      Start for free
                      <ArrowRight size={16} />
                    </Link>
                  </Button>

                  <Button
                    asChild
                    variant="outline"
                    className="h-12 w-full rounded-xl border-gray-200 bg-white px-7 text-base font-medium text-gray-700 hover:bg-gray-50 sm:w-auto"
                  >
                    <Link href="/login">Sign in to your account</Link>
                  </Button>
                </>
              )}
            </div>

            <div className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              {(token ? AUTH_HIGHLIGHTS : GUEST_HIGHLIGHTS).map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-1.5 text-sm text-gray-500"
                >
                  <CheckCircle2 size={13} className="shrink-0 text-green-500" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* App screenshot — the payoff for the headline, so it sits in the
              same section rather than being announced separately. */}
          <div className="relative mx-auto mt-14 max-w-5xl pb-16 md:mt-20 md:pb-24">
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-x-8 -top-4 bottom-16 rounded-[2rem] bg-blue-600/10 blur-2xl"
            />
            <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl shadow-gray-900/10 ring-1 ring-gray-900/5">
              <div className="flex items-center gap-1.5 border-b border-gray-200 bg-gray-50 px-4 py-2.5">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
                <span className="ml-3 rounded-md bg-white px-2 py-0.5 text-[11px] text-gray-400 ring-1 ring-gray-200">
                  rebuzzpos.com
                </span>
              </div>
              <Image
                src={InvoiceSs}
                placeholder="blur"
                quality={85}
                width={1000}
                alt="Rebuzz POS dashboard screenshot"
                className="h-auto w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Capability band ── */}
      <section className="border-b border-gray-100 px-6 py-10 md:px-16">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-x-6 gap-y-8 lg:grid-cols-4">
          {CAPABILITIES.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <Icon size={17} />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  {label}
                </p>
                <p className="mt-0.5 text-sm font-semibold text-gray-900">
                  {value}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="bg-gray-50/70 px-6 py-20 md:px-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 max-w-2xl">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-600">
              What you get
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
              Everything you need to grow
            </h2>
            <p className="mt-4 text-base leading-relaxed text-gray-500">
              A complete toolkit for managing sales, staff, customers, and
              inventory — without stitching four tools together.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, description, wide }) => (
              <div
                key={title}
                className={`group rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-600/5 ${
                  wide ? "sm:col-span-2" : ""
                }`}
              >
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                  <Icon size={19} />
                </div>
                <h3 className="text-base font-semibold text-gray-900">
                  {title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Closing CTA ──
          A dark panel rather than more centred text on white: the page ends on
          something that looks like a decision, not another paragraph. */}
      <section className="px-6 py-20 md:px-16">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-gray-900 px-8 py-16 text-center md:px-16">
          <div
            aria-hidden
            className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-32 -right-20 h-96 w-96 rounded-full bg-blue-400/10 blur-3xl"
          />

          <div className="relative mx-auto max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
              {token
                ? "Continue growing your business"
                : "Ready to simplify your business?"}
            </h2>

            <p className="mt-4 text-base leading-relaxed text-gray-400">
              {token
                ? "Access your dashboard, review reports, manage inventory, and track business performance in real time."
                : "Join businesses already using Rebuzz POS to save time and grow faster."}
            </p>

            <Button
              asChild
              className="mt-9 h-12 rounded-xl bg-white px-8 text-base font-semibold text-gray-900 shadow-lg transition-colors hover:bg-gray-100"
            >
              <Link
                href={token ? "/dashboard" : "/signup"}
                className="flex items-center gap-2"
              >
                {token ? "Open Dashboard" : "Get started for free"}
                <ArrowRight size={16} />
              </Link>
            </Button>

            {!token && (
              <p className="mt-4 text-xs text-gray-500">
                Free to start · No card required
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-100 px-6 py-10 md:px-16">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-xs">
            <div className="flex items-center gap-1.5">
              <Image
                src="/rebuzz.png"
                alt=""
                width={26}
                height={26}
                className="rounded-md"
              />
              <span className="text-base font-bold tracking-tight">
                <span style={{ color: "#244074" }}>Re</span>
                <span style={{ color: "#E26924" }}>Buzz</span>
              </span>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-gray-400">
              Invoicing, inventory and payments for small businesses — in one
              dashboard.
            </p>
          </div>

          <div className="flex gap-14">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                Product
              </p>
              <ul className="mt-3 space-y-2 text-xs text-gray-500">
                <li>
                  <Link
                    href="/subscriptions"
                    className="transition-colors hover:text-blue-600"
                  >
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link
                    href={token ? "/dashboard" : "/login"}
                    className="transition-colors hover:text-blue-600"
                  >
                    Dashboard
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                Account
              </p>
              <ul className="mt-3 space-y-2 text-xs text-gray-500">
                <li>
                  <Link
                    href="/login"
                    className="transition-colors hover:text-blue-600"
                  >
                    Log in
                  </Link>
                </li>
                <li>
                  <Link
                    href="/signup"
                    className="transition-colors hover:text-blue-600"
                  >
                    Create account
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-10 flex max-w-6xl flex-col items-center justify-between gap-2 border-t border-gray-100 pt-6 sm:flex-row">
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} ReBuzz. All rights reserved.
          </p>
          <p className="text-xs text-gray-400">Brand Builder Pvt Ltd</p>
        </div>
      </footer>
    </div>
  );
};

export default Page;
