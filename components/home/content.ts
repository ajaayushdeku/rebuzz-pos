import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Coins,
  CreditCard,
  FileText,
  Landmark,
  Receipt,
  ShieldCheck,
} from "lucide-react";

/**
 * The company behind the product.
 *
 * One place for the details that appear in both the About section and the
 * footer, so the address in one cannot drift from the address in the other.
 *
 * A social account with no URL is left out rather than linked to nothing;
 * fill these in and the icons appear.
 */
export const COMPANY = {
  name: "Brand Builder Pvt. Ltd.",
  address: "Niva Galli, Pokhara, Nepal",
  email: "support@rebuzzpos.com",
  phone: "+977 982-6189697",
  /** Digits only, as WhatsApp's link format expects. */
  whatsapp: "9779826189697",
  website: "https://rebuzzpos.com/",
  socials: {
    facebook: "https://www.facebook.com/people/Rebuzz/61563987490421/",
    instagram: "https://www.instagram.com/re_buzzz/",
    tiktok: "https://www.tiktok.com/@rebuzzpos",
    youtube: "https://www.youtube.com/@Rebuzz-POS/featured",
  },
} as const;

/** What the product is for, and who it is for. */
export const WHY_REBUZZ = [
  "Simple enough for staff who have never used a POS",
  "Built around how Nepali businesses actually trade",
  "Support you can reach, from people who know the product",
  "Priced for a small business, not an enterprise",
];

/**
 * The feature grid.
 *
 * `wide` marks the one card that leads the row — a grid of four identical
 * tiles gives the eye nowhere to start, so the first one takes double width
 * and carries a longer line.
 */
export const FEATURES = [
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
      "Accept cash, and QR payments seamlessly. All tracked in one place.",
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
export const CAPABILITIES = [
  { icon: Coins, label: "Multi-currency", value: "127 supported" },
  { icon: CreditCard, label: "Payments", value: "Cash, QR & loyalty" },
  { icon: FileText, label: "Documents", value: "Invoice, tax & receipts" },
  { icon: Landmark, label: "Tax", value: "Nepal-ready VAT & PAN" },
];

export const GUEST_HIGHLIGHTS = [
  "No setup fees — free to get started",
  "Works on any device",
  "Nepal-ready with NPR support",
  "Inventory & stock tracking",
];

export const AUTH_HIGHLIGHTS = [
  "Monitor today's sales",
  "Manage inventory & stock",
  "Track expenses in real-time",
  "View business analytics",
];

/** Faint graph paper behind the hero, fading out before it meets the content. */
export const GRID_STYLE: React.CSSProperties = {
  backgroundImage:
    "linear-gradient(to right, rgb(226 232 240 / 0.7) 1px, transparent 1px)," +
    "linear-gradient(to bottom, rgb(226 232 240 / 0.7) 1px, transparent 1px)",
  backgroundSize: "56px 56px",
  maskImage:
    "radial-gradient(ellipse 70% 60% at 50% 0%, #000 55%, transparent 100%)",
  WebkitMaskImage:
    "radial-gradient(ellipse 70% 60% at 50% 0%, #000 55%, transparent 100%)",
};

/** Every feature card's icon, typed for the grid that renders them. */
export type HomeFeature = {
  icon: LucideIcon;
  title: string;
  description: string;
  wide?: boolean;
};

/** The same paper, drawn in light lines for the dark theme. */
export const DARK_GRID_STYLE: React.CSSProperties = {
  ...GRID_STYLE,
  backgroundImage:
    "linear-gradient(to right, rgb(255 255 255 / 0.05) 1px, transparent 1px)," +
    "linear-gradient(to bottom, rgb(255 255 255 / 0.05) 1px, transparent 1px)",
};
