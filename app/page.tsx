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
  Mail,
  Phone,
  Globe,
  MapPin,
  Building2,
  LayoutDashboard,
} from "lucide-react";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";
import { YouTubeIcon } from "@/components/ui/YouTubeIcon";
import NavbarWelcome from "@/components/NavbarWelcome";
import HomeUserMenu from "@/components/HomeUserMenu";
import ServerEnvBadge from "@/components/ServerEnvBadge";

/**
 * The company behind the product.
 *
 * One place for the details that appear in both the About section and the
 * footer, so the address in one cannot drift from the address in the other.
 *
 * A social account with no URL is left out rather than linked to nothing;
 * fill these in and the icons appear.
 */
const COMPANY = {
  name: "Brand Builder Pvt. Ltd.",
  address: "Niva Galli, Pokhara, Nepal",
  email: "support@rebuzzpos.com",
  phone: "+977 982-6189697",
  /** Digits only, as WhatsApp's link format expects. */
  whatsapp: "9779826189697",
  website: "https://rebuzzpos.com/",
  socials: {
    facebook: "",
    instagram: "",
    tiktok: "",
    youtube: "",
  },
} as const;

/** What the product is for, and who it is for. */
const WHY_REBUZZ = [
  "Simple enough for staff who have never used a POS",
  "Built around how Nepali businesses actually trade",
  "Support you can reach, from people who know the product",
  "Priced for a small business, not an enterprise",
];

/**
 * A link to a section of this page, or to another page.
 *
 * The hash ones are plain anchors on purpose. The page scrolls inside its own
 * container now, and `next/link` scrolls the document — which no longer
 * moves — so a Link to "#about" would go nowhere. A native anchor scrolls
 * the nearest scrollable ancestor, which is the page.
 */
function SectionOrPageLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  return href.startsWith("#") ? (
    <a href={href} className={className}>
      {children}
    </a>
  ) : (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

/**
 * The hairline between groups in the navbar.
 *
 * A 1px-wide box, not a bordered one: `border` on a 20px-tall div draws a
 * rectangle rather than a rule, which is what was on screen before.
 */
function NavDivider() {
  return (
    <span
      aria-hidden
      className="hidden h-5 w-px shrink-0 bg-gray-200 sm:block"
    />
  );
}

/** One column of links in the footer. */
function FooterColumn({
  heading,
  links,
}: {
  heading: string;
  links: { label: string; href: string; external?: boolean }[];
}) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-400">
        {heading}
      </p>
      <ul className="mt-4 space-y-3 text-sm text-gray-500">
        {links.map(({ label, href, external }) => (
          <li key={label}>
            {external ? (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-blue-600"
              >
                {label}
              </a>
            ) : (
              <SectionOrPageLink
                href={href}
                className="transition-colors hover:text-blue-600"
              >
                {label}
              </SectionOrPageLink>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * The social marks.
 *
 * Drawn here because Lucide dropped its brand glyphs: one path each, filled
 * with `currentColor`, so they take the colour of the button they sit in.
 */
function BrandMark({ path, className }: { path: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d={path} />
    </svg>
  );
}

const FacebookIcon = ({ className }: { className?: string }) => (
  <BrandMark
    className={className}
    path="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.25h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z"
  />
);

const InstagramIcon = ({ className }: { className?: string }) => (
  <BrandMark
    className={className}
    path="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41-.56-.22-.96-.48-1.38-.9-.42-.42-.68-.82-.9-1.38-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16M12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63c-.79.3-1.46.71-2.12 1.38C1.35 2.67.94 3.34.63 4.14.33 4.9.13 5.78.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91.3.79.71 1.46 1.38 2.12.66.66 1.33 1.07 2.12 1.38.76.3 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56.79-.3 1.46-.71 2.12-1.38.66-.66 1.07-1.33 1.38-2.12.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91-.3-.79-.71-1.46-1.38-2.12C21.33 1.35 20.66.94 19.86.63c-.76-.3-1.64-.5-2.91-.56C15.67.01 15.26 0 12 0zm0 5.84a6.16 6.16 0 100 12.32 6.16 6.16 0 000-12.32zm0 10.16a4 4 0 110-8 4 4 0 010 8zm7.85-10.4a1.44 1.44 0 11-2.88 0 1.44 1.44 0 012.88 0z"
  />
);

const TikTokIcon = ({ className }: { className?: string }) => (
  <BrandMark
    className={className}
    path="M16.6 5.82A4.28 4.28 0 0115.54 3h-3.09v12.4a2.59 2.59 0 01-2.59 2.5 2.59 2.59 0 110-5.18c.27 0 .53.04.77.12v-3.2a5.76 5.76 0 00-.77-.05A5.72 5.72 0 004.14 15.3 5.72 5.72 0 009.86 21a5.72 5.72 0 005.72-5.72V9.01a7.35 7.35 0 004.3 1.38V7.3a4.3 4.3 0 01-3.28-1.48z"
  />
);

/**
 * The social accounts, where there are any.
 *
 * An account with no URL is left out rather than linked to nothing, so the
 * row shrinks to what exists instead of offering dead icons.
 */
function SocialLinks() {
  const { facebook, instagram, tiktok, youtube } = COMPANY.socials;
  const accounts: {
    href: string;
    label: string;
    Icon: React.ComponentType<{ className?: string; size?: number }>;
  }[] = [
    facebook ? { href: facebook, label: "Facebook", Icon: FacebookIcon } : null,
    instagram
      ? { href: instagram, label: "Instagram", Icon: InstagramIcon }
      : null,
    tiktok ? { href: tiktok, label: "TikTok", Icon: TikTokIcon } : null,
    youtube ? { href: youtube, label: "YouTube", Icon: YouTubeIcon } : null,
  ].filter(
    (account): account is NonNullable<typeof account> => account !== null,
  );

  if (accounts.length === 0) return null;

  return (
    <div className="mt-7">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-400">
        Follow us
      </p>
      <ul className="mt-3 flex items-center gap-2">
        {accounts.map(({ href, label, Icon }) => (
          <li key={label}>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200/80 bg-white text-gray-500 transition-colors hover:border-blue-200 hover:text-blue-600"
            >
              <Icon className="h-4 w-4" size={16} />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

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
  { icon: CreditCard, label: "Payments", value: "Cash, QR & loyalty" },
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

/** The hero's graph paper again, drawn light-on-dark for the closing panel. */
const DARK_GRID_STYLE: React.CSSProperties = {
  backgroundImage:
    "linear-gradient(to right, rgb(255 255 255 / 0.06) 1px, transparent 1px)," +
    "linear-gradient(to bottom, rgb(255 255 255 / 0.06) 1px, transparent 1px)",
  backgroundSize: "56px 56px",
  maskImage:
    "radial-gradient(ellipse 80% 80% at 30% 0%, #000 40%, transparent 100%)",
  WebkitMaskImage:
    "radial-gradient(ellipse 80% 80% at 30% 0%, #000 40%, transparent 100%)",
};

const Page = async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  return (
    // The page scrolls inside itself, as the app shell does, and hides the
    // bar while doing it: with nothing drawn there is nothing to appear on
    // one page and vanish on the next. Wheel, touch, keyboard and drag all
    // still scroll it.
    <div className="scrollbar-hide h-dvh overflow-y-auto bg-white">
      {/* ── Navbar ──
          Sticky, and on the same 6xl column as every section below it, so the
          logo sits over the content rather than out in the gutter. */}
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
            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <ServerEnvBadge />

              <NavDivider />

              <span className="hidden lg:inline">
                <NavbarWelcome />
              </span>

              <HomeUserMenu />

              <NavDivider />

              {/* Icon-led, and icon-only on a phone: the label is the first
                  thing to go when the row runs out of room, and the mark
                  still says where it leads. */}
              <Button
                asChild
                className="h-9 rounded-xl bg-blue-600 px-3 text-sm font-semibold text-white hover:bg-blue-700 sm:px-4"
              >
                <Link
                  href="/dashboard"
                  aria-label="Go to Dashboard"
                  className="flex items-center gap-2"
                >
                  <LayoutDashboard size={15} aria-hidden />
                  <span className="hidden md:inline">Go to Dashboard</span>
                  <ArrowRight
                    size={14}
                    aria-hidden
                    className="hidden md:inline"
                  />
                </Link>
              </Button>
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
                className="h-9 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 md:px-5"
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
      <section
        id="features"
        className="scroll-mt-20 bg-gray-50/70 px-6 py-20 md:px-16"
      >
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

      {/* ── About ──
          Who makes this, on the page where someone deciding whether to trust
          it is already looking. Two columns because the two questions are
          different: what this is, and why it would suit you. */}
      <section id="about" className="scroll-mt-20 px-6 py-20 md:px-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 max-w-2xl">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-600">
              About us
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
              Built in Nepal, for businesses here
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-gray-200/80 bg-white p-8 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900">
                Who we are
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-gray-500">
                Rebuzz POS is a Nepal-focused Point of Sale system built for
                cafes, salons, restaurants and service businesses — the shops
                that need invoicing, stock and payments in one place without a
                back office to run them.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-gray-500">
                It is made by {COMPANY.name}, in {COMPANY.address}.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200/80 bg-white p-8 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900">
                Why Rebuzz POS
              </h3>
              <ul className="mt-4 space-y-3">
                {WHY_REBUZZ.map((line) => (
                  <li key={line} className="flex gap-3">
                    <CheckCircle2
                      size={17}
                      aria-hidden
                      className="mt-0.5 shrink-0 text-blue-600"
                    />
                    <span className="text-sm leading-relaxed text-gray-500">
                      {line}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* The three things someone asks next: who do I write to, who am I
              buying from, and where do I read more. */}
          <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              {
                icon: Mail,
                label: "Support email",
                value: COMPANY.email,
                href: `mailto:${COMPANY.email}`,
              },
              {
                icon: Building2,
                label: "Company",
                value: COMPANY.name,
              },
              {
                icon: Globe,
                label: "Website",
                value: COMPANY.website.replace(/^https?:\/\/|\/$/g, ""),
                href: COMPANY.website,
              },
            ].map(({ icon: Icon, label, value, href }) => (
              <div
                key={label}
                className="rounded-2xl border border-gray-200/80 bg-gray-50/70 p-6 text-center"
              >
                <Icon size={18} aria-hidden className="mx-auto text-blue-600" />
                <dt className="mt-3 text-sm font-semibold text-gray-900">
                  {label}
                </dt>
                <dd className="mt-1 text-sm text-gray-500">
                  {href ? (
                    <a
                      href={href}
                      target={href.startsWith("http") ? "_blank" : undefined}
                      rel={
                        href.startsWith("http")
                          ? "noopener noreferrer"
                          : undefined
                      }
                      className="transition-colors hover:text-blue-600"
                    >
                      {value}
                    </a>
                  ) : (
                    value
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ── Closing CTA ──
          The page's one dark block, and the only place it asks for a
          decision. Laid out as two columns rather than centred text: the
          left side makes the case and carries the button, the right side
          answers "what do I actually get" without needing another section.
          A centred block put the reasons below the button, where someone
          still deciding has already stopped reading. */}
      <section className="px-6 pb-20 pt-4 md:px-16">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-gray-900 ring-1 ring-white/10">
          {/* Texture, not decoration: the same graph paper as the hero, so
              the page closes on the surface it opened with. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={DARK_GRID_STYLE}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-40 -right-24 h-[28rem] w-[28rem] rounded-full bg-blue-400/10 blur-3xl"
          />

          <div className="relative grid grid-cols-1 gap-10 px-8 py-14 md:px-14 md:py-16 lg:grid-cols-12 lg:items-center lg:gap-14">
            <div className="lg:col-span-7">
              <p className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-300">
                <Zap size={11} aria-hidden />
                {token ? "Your dashboard" : "Get started"}
              </p>

              <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
                {token
                  ? "Pick up where you left off"
                  : "Ready to simplify your business?"}
              </h2>

              <p className="mt-4 max-w-md text-base leading-relaxed text-gray-400">
                {token
                  ? "Today's sales, stock, staff and expenses — all waiting in one dashboard."
                  : "Set up your shop in an afternoon and run the whole day from one screen."}
              </p>

              {/* One thing to press and one way out, rather than a single
                  button someone not yet convinced has to ignore. */}
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button
                  asChild
                  className="h-12 rounded-xl bg-white px-7 text-base font-semibold text-gray-900 shadow-lg transition-colors hover:bg-gray-100"
                >
                  <Link
                    href={token ? "/dashboard" : "/signup"}
                    className="flex items-center justify-center gap-2"
                  >
                    {token ? <LayoutDashboard size={16} aria-hidden /> : null}
                    {token ? "Open Dashboard" : "Get started for free"}
                    <ArrowRight size={16} aria-hidden />
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="ghost"
                  className="h-12 rounded-xl border border-white/15 px-6 text-base font-medium text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <Link href={token ? "/help" : "/login"}>
                    {token ? "Help & support" : "Log in"}
                  </Link>
                </Button>
              </div>

              {!token && (
                <p className="mt-5 text-xs text-gray-500">
                  Free to start · No card required · Cancel any time
                </p>
              )}
            </div>

            {/* What the button actually leads to. Bordered rather than
                filled, so it reads as part of the panel and not as a second
                card dropped onto it. */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500">
                  {token ? "Waiting for you" : "What's included"}
                </p>
                <ul className="mt-4 space-y-3.5">
                  {(token ? AUTH_HIGHLIGHTS : GUEST_HIGHLIGHTS).map((line) => (
                    <li key={line} className="flex items-start gap-3">
                      <CheckCircle2
                        size={17}
                        aria-hidden
                        className="mt-0.5 shrink-0 text-blue-400"
                      />
                      <span className="text-sm leading-relaxed text-gray-300">
                        {line}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ──
          The page's own light surface, ruled off rather than inverted: the
          dark closing panel above it is the page's one dark note, and a dark
          footer straight after it made two in a row. The columns are what
          someone at the foot of a landing page is looking for: what the
          product does, who sells it, and how to reach a person. */}
      <footer className="border-t border-gray-200/80 bg-gray-50/70 px-6 pt-16 pb-8 md:px-16">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
            {/* The brand, and where it comes from. */}
            <div className="md:col-span-5 lg:col-span-4">
              <div className="flex items-center gap-2">
                <Image
                  src="/rebuzz.png"
                  alt=""
                  width={32}
                  height={32}
                  className="rounded-md"
                />
                <span className="text-lg font-bold tracking-tight">
                  <span style={{ color: "#244074" }}>Re</span>
                  <span style={{ color: "#E26924" }}>Buzz</span>
                  <span className="ml-1.5 align-middle text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                    POS
                  </span>
                </span>
              </div>

              <p className="mt-4 max-w-xs text-sm leading-relaxed text-gray-500">
                Invoicing, inventory, staff and payments for small businesses —
                in one dashboard.
              </p>

              <p className="mt-5 flex items-start gap-2 text-sm text-gray-500">
                <MapPin size={15} aria-hidden className="mt-0.5 shrink-0" />
                <span>
                  {COMPANY.name}, {COMPANY.address}
                </span>
              </p>

              <SocialLinks />
            </div>

            <div className="md:col-span-7 lg:col-span-8">
              <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
                <FooterColumn
                  heading="Product"
                  links={[
                    { label: "Features", href: "#features" },
                    { label: "Pricing", href: "/subscriptions" },
                    {
                      label: "Dashboard",
                      href: token ? "/dashboard" : "/login",
                    },
                  ]}
                />

                <FooterColumn
                  heading="Company"
                  links={[
                    { label: "About us", href: "#about" },
                    { label: "Website", href: COMPANY.website, external: true },
                    { label: "Help & support", href: "/help" },
                  ]}
                />

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-400">
                    Help & contact
                  </p>
                  <ul className="mt-4 space-y-3 text-sm text-gray-500">
                    <li>
                      <a
                        href={`https://wa.me/${COMPANY.whatsapp}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 transition-colors hover:text-blue-600"
                      >
                        <WhatsAppIcon className="h-4 w-4 shrink-0" />
                        WhatsApp chat
                      </a>
                    </li>
                    <li>
                      <a
                        href={`tel:${COMPANY.phone.replace(/[^\d+]/g, "")}`}
                        className="inline-flex items-center gap-2 transition-colors hover:text-blue-600"
                      >
                        <Phone size={15} aria-hidden className="shrink-0" />
                        {COMPANY.phone}
                      </a>
                    </li>
                    <li>
                      <a
                        href={`mailto:${COMPANY.email}`}
                        className="inline-flex items-center gap-2 transition-colors hover:text-blue-600"
                      >
                        <Mail size={15} aria-hidden className="shrink-0" />
                        {COMPANY.email}
                      </a>
                    </li>
                    <li>
                      <a
                        href={COMPANY.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 transition-colors hover:text-blue-600"
                      >
                        <Globe size={15} aria-hidden className="shrink-0" />
                        {COMPANY.website.replace(/^https?:\/\/|\/$/g, "")}
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-14 border-t border-gray-200/80 pt-6">
            <p className="text-center text-xs text-gray-400">
              © {new Date().getFullYear()} Rebuzz POS. A product of{" "}
              {COMPANY.name} All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Page;
