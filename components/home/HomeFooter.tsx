import Image from "next/image";
import { Globe, Mail, MapPin, Phone } from "lucide-react";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";
import { YouTubeIcon } from "@/components/ui/YouTubeIcon";
import { SectionOrPageLink } from "./SectionOrPageLink";
import { COMPANY } from "./content";

/**
 * * ── Footer ──
 * The page's own light surface, ruled off rather than inverted: the
 * dark closing panel above it is the page's one dark note, and a dark
 * footer straight after it made two in a row. The columns are what
 * someone at the foot of a landing page is looking for: what the
 * product does, who sells it, and how to reach a person. *
 */
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
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-400 dark:text-[#7b869b]">
        {heading}
      </p>
      <ul className="mt-4 space-y-3 text-sm text-gray-500 dark:text-[#9aa6bd]">
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
                className="transition-colors hover:text-[#244074] dark:hover:text-[#f0b184]"
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

/** The accounts that have a URL; the rest are left out, not linked dead. */
function SocialLinks() {
  const { facebook, instagram, tiktok, youtube } = COMPANY.socials;
  const accounts = [
    facebook ? { href: facebook, label: "Facebook", Icon: FacebookIcon } : null,
    instagram
      ? { href: instagram, label: "Instagram", Icon: InstagramIcon }
      : null,
    tiktok ? { href: tiktok, label: "TikTok", Icon: TikTokIcon } : null,
    youtube ? { href: youtube, label: "YouTube", Icon: YouTubeIcon } : null,
  ].filter(Boolean) as {
    href: string;
    label: string;
    Icon: React.ComponentType<{ className?: string; size?: number }>;
  }[];

  if (accounts.length === 0) return null;

  return (
    <div className="mt-7">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-400 dark:text-[#7b869b]">
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
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200/80 bg-white text-gray-500 transition-colors hover:border-[#b9c5da] hover:text-[#244074] dark:bg-[#0f1420] dark:text-[#9aa6bd] dark:border-white/10 dark:hover:border-white/25 dark:hover:text-[#f0b184]"
            >
              <Icon className="h-4 w-4" size={16} />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function HomeFooter({ token }: { token?: string }) {
  return (
    <footer className="border-t border-gray-200/80 bg-gray-50/70 px-6 pt-16 pb-8 md:px-16 dark:bg-white/5 dark:border-white/10">
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
                <span className="text-[#244074] dark:text-[#7ba2e3]">Re</span>
                <span style={{ color: "#E26924" }}>Buzz</span>
                <span className="ml-1.5 align-end text-[11px] font-semibold uppercase tracking-[2px] text-gray-400 dark:text-[#7b869b]">
                  POS
                </span>
              </span>
            </div>

            <p className="mt-4 max-w-xs text-sm leading-relaxed text-gray-500 dark:text-[#9aa6bd]">
              Invoicing, inventory, staff and payments for small businesses — in
              one dashboard.
            </p>

            <p className="mt-5 flex items-start gap-2 text-sm text-gray-500 dark:text-[#9aa6bd]">
              <MapPin
                size={15}
                aria-hidden
                className="mt-0.5 shrink-0 text-[#E26924]"
              />
              <span>
                {COMPANY.name}, {COMPANY.address}
              </span>
            </p>

            <SocialLinks />
          </div>

          <div className="md:col-span-7 lg:col-span-8">
            {/* Two columns signed out, three signed in. The third is the way
                back into the app, which is the only thing a signed-in
                visitor is on this page needing — and is nothing at all to
                someone who cannot open any of it. */}
            <div
              className={`grid gap-8 ${
                token
                  ? "grid-cols-2 sm:grid-cols-3"
                  : "grid-cols-1 sm:grid-cols-2"
              }`}
            >
              {token && (
                <FooterColumn
                  heading="Your account"
                  links={[
                    { label: "Dashboard", href: "/dashboard" },
                    { label: "Your plan", href: "/subscriptions" },
                    { label: "Settings", href: "/settings/business" },
                    { label: "Help & support", href: "/help" },
                  ]}
                />
              )}

              <FooterColumn
                heading="Company"
                links={[
                  { label: "About us", href: "#about" },
                  { label: "Website", href: COMPANY.website, external: true },
                ]}
              />

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-400 dark:text-[#7b869b]">
                  Help & contact
                </p>
                <ul className="mt-4 space-y-3 text-sm text-gray-500 dark:text-[#9aa6bd]">
                  <li>
                    <a
                      href={`https://wa.me/${COMPANY.whatsapp}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 transition-colors hover:text-[#244074] dark:hover:text-[#f0b184]"
                    >
                      <WhatsAppIcon className="h-4 w-4 shrink-0  text-[#E26924]" />
                      WhatsApp chat
                    </a>
                  </li>
                  <li>
                    <a
                      href={`tel:${COMPANY.phone.replace(/[^\d+]/g, "")}`}
                      className="inline-flex items-center gap-2 transition-colors hover:text-[#244074] dark:hover:text-[#f0b184]"
                    >
                      <Phone
                        size={15}
                        aria-hidden
                        className="shrink-0 text-[#E26924]"
                      />
                      {COMPANY.phone}
                    </a>
                  </li>
                  <li>
                    <a
                      href={`mailto:${COMPANY.email}`}
                      className="inline-flex items-center gap-2 transition-colors hover:text-[#244074] dark:hover:text-[#f0b184]"
                    >
                      <Mail
                        size={15}
                        aria-hidden
                        className="shrink-0 text-[#E26924]"
                      />
                      {COMPANY.email}
                    </a>
                  </li>
                  <li>
                    <a
                      href={COMPANY.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 transition-colors hover:text-[#244074] dark:hover:text-[#f0b184]"
                    >
                      <Globe
                        size={15}
                        aria-hidden
                        className="shrink-0 text-[#E26924]"
                      />
                      {COMPANY.website.replace(/^https?:\/\/|\/$/g, "")}
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-14 border-t border-gray-200/80 pt-6 dark:border-white/10">
          <p className="text-center text-xs text-gray-400 dark:text-[#7b869b]">
            © {new Date().getFullYear()} Rebuzz POS. A product of {COMPANY.name}{" "}
            All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
