"use client";

import { createElement, useState } from "react";
import {
  BadgeCheck,
  BadgePercent,
  BatteryMedium,
  CalendarCheck,
  CalendarDays,
  Clock,
  Link2,
  type LucideIcon,
  MessageSquare,
  ShoppingBag,
  Tag,
  User,
  Receipt,
  SignalHigh,
  Smartphone,
  Store,
  Wifi,
} from "lucide-react";

import { useOfferForm } from "@/providers/OfferFormContext";
import { useProductsList } from "@/hooks/useProductsList";
import { productLabel } from "@/lib/productVariants";
import { useBusiness } from "@/hooks/useBusiness";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";
import { audiencePhrase, offerCopy, offerLink } from "./offerDealConfig";
import QRCode from "react-qr-code";
import { useLoyaltyTiers } from "@/hooks/useLoyaltyTiers";
import { toBsLabel } from "@/lib/nepaliDate";
import { offerOccasion } from "./festivals";

/** The order a Rs-savings example is worked against. */
const SAMPLE_ORDER = 1000;

/** "18:13" as a customer reads it. */
function formatTime(value: string): string {
  const [h, m] = value.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return value;
  const suffix = h < 12 ? "AM" : "PM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
}

/**
 * "2026-09-12" as "27 Bhadra 2083 BS".
 *
 * The customer reading this card is reading it in Nepal, so the deadline is
 * quoted in the calendar they keep. Falls back to the Gregorian date when the
 * conversion is unavailable rather than printing nothing.
 */
function formatDate(value: string): string {
  const bs = toBsLabel(value);
  if (bs) return bs;

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const CHANNELS = [
  {
    id: "feed" as const,
    label: "App Feed",
    icon: Smartphone,
    tint: "text-blue-500 dark:text-blue-300",
  },
  {
    id: "sms" as const,
    label: "Viber/SMS",
    icon: MessageSquare,
    tint: "text-purple-500 dark:text-purple-300",
  },
  {
    id: "receipt" as const,
    label: "Bill Receipt",
    icon: Receipt,
    tint: "text-amber-500 dark:text-amber-300",
  },
];

type Channel = (typeof CHANNELS)[number]["id"];

/**
 * The phone frame every channel is drawn inside.
 *
 * Chrome only — the notch, the status bar and the bezel — so the three
 * channels differ in their content and nowhere else.
 *
 * In dark mode the whole preview follows the theme, which reads as the
 * customer's phone being in dark mode too. Three levels inside the bezel, the
 * same hierarchy the app uses: `#1b2436` for the status strip, `#0f1420` for
 * the screen behind the content, `#161d2e` for the cards on it. The bezel goes
 * graphite rather than staying near-black, because `gray-900` is within a shade
 * of the page and the phone would lose its silhouette against it.
 *
 * The two QR tiles stay white in BOTH themes. `react-qr-code` draws black
 * modules, so a dark tile makes the code black-on-dark and it stops scanning —
 * the light quiet zone is functional, not decorative.
 */
function PhoneFrame({
  children,
  center = false,
}: {
  children: React.ReactNode;
  /** Vertically centre the screen's content. */
  center?: boolean;
}) {
  return (
    <div className="mx-auto w-full max-w-[320px] rounded-[2rem] border-[6px] border-gray-900 bg-white shadow-xl dark:border-[#333b4d] dark:bg-[#1b2436]">
      <div className="relative flex items-center justify-between rounded-t-[1.75rem] px-4 pb-1 pt-2.5 text-[11px] font-semibold text-[#3c4043] dark:text-[#e8ecf4]">
        <span>9:41</span>
        <span className="absolute left-1/2 top-1.5 h-4 w-16 -translate-x-1/2 rounded-full bg-gray-900 dark:bg-black" />
        {/* Signal, wi-fi and battery, as a phone actually draws them. */}
        <span className="flex items-center gap-1 text-[#3c4043] dark:text-[#e8ecf4]">
          <SignalHigh size={13} strokeWidth={2.5} />
          <Wifi size={13} strokeWidth={2.5} />
          <BatteryMedium size={15} strokeWidth={2} />
        </span>
      </div>

      <div
        className={`min-h-[460px] rounded-b-[1.85rem] bg-[#f8f9fa] dark:bg-[#0f1420] px-3 pb-5 pt-2 ${
          center ? "flex flex-col justify-center" : ""
        }`}
      >
        {children}
      </div>

      <div className="mx-auto mb-2 h-1 w-24 rounded-full bg-gray-300 dark:bg-white/25" />
    </div>
  );
}

function MerchantRow({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-2xl border border-[#e8eaed] bg-white dark:bg-[#161d2e] p-3 shadow-sm dark:border-white/10 dark:shadow-none">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600">
        <Store size={17} className="text-white" />
      </div>
      <div className="min-w-0">
        <p className="flex items-center gap-1 truncate text-[13px] font-bold text-[#3c4043] dark:text-[#e8ecf4]">
          {name}
          <BadgeCheck
            size={13}
            className="shrink-0 text-blue-500 dark:text-blue-300"
          />
        </p>
        <p className="text-[10px] text-[#9aa0a6] dark:text-[#9aa6bd]">
          Verified Merchant
        </p>
      </div>
    </div>
  );
}

export default function OfferPhonePreview() {
  const { form } = useOfferForm();
  const { data: products = [] } = useProductsList();
  const { data: tiers = [] } = useLoyaltyTiers();

  // MOCK while the short-link service is pending — see offerLink.
  const offerUrl = offerLink(form.hasKey);
  const { data: business } = useBusiness();
  const { currency } = useCurrency();
  const [channel, setChannel] = useState<Channel>("feed");

  const merchantName = business?.businessName?.trim() || "Your Restaurant";
  const businessAddress = business?.address?.trim() || "Kathmandu, Nepal";
  const money = (v: number) =>
    formatCurrencySymbol(v, currency.symbol, currency.locale);

  const { badge, headline } = offerCopy({
    dealId: form.discountKind,
    amount: form.discount,
    // The variant, not just the product: an offer on the large buff momo
    // previewing as "a free Momo" promises something the offer does not.
    freeItemName: productLabel(
      products,
      form.freeItemId,
      form.freeItemVariantId,
    ),
    customDeal: form.customDeal,
    currency: currency.symbol,
  });

  // The occasion the offer is tied to, named on the card so a customer knows
  // why the deal exists and that it ends with the festival — whether it was
  // picked from the list or typed in. An id the list no longer knows shows
  // nothing rather than a raw id.
  const festival = offerOccasion(form.festival, form.customFestival);

  // Printed on its own line rather than folded into the headline, so a
  // customer sees who the offer is for before trying to redeem it.
  const audienceLine = audiencePhrase({
    audience: form.audience,
    tierName: tiers.find((t) => t.id === form.audienceTierId)?.name,
  });

  const rawSaving =
    form.discount > 0 && form.discountKind === "percentage"
      ? (SAMPLE_ORDER * form.discount) / 100
      : form.discount > 0 && form.discountKind === "rupee"
        ? Math.min(form.discount, SAMPLE_ORDER)
        : 0;

  const saving = form.maxCap > 0 ? Math.min(rawSaving, form.maxCap) : rawSaving;
  const capped = form.maxCap > 0 && rawSaving > form.maxCap;

  const terms: { icon: LucideIcon; text: string }[] = [
    form.minSpend > 0 && {
      icon: ShoppingBag,
      text: `Minimum order spend ${money(form.minSpend)}`,
    },
    form.maxCap > 0 && {
      icon: BadgePercent,
      text: `Maximum discount ${money(form.maxCap)}`,
    },
    form.repeatingDays.length > 0 &&
      form.repeatingDays.length < 7 && {
        icon: CalendarDays,
        text: `Available on ${form.repeatingDays.join(", ")}`,
      },
    form.startTime &&
      form.endTime && {
        icon: Clock,
        text: `Valid ${formatTime(form.startTime)} – ${formatTime(form.endTime)}`,
      },
    form.endDate && {
      icon: CalendarCheck,
      text: `Valid until ${formatDate(form.endDate)}`,
    },
    form.usesLimit > 0 && {
      icon: User,
      text: `Limit ${form.usesLimit} per customer`,
    },
  ].filter(Boolean) as { icon: LucideIcon; text: string }[];

  /**
   * The two conditions worth the characters in a text message.
   *
   * An SMS is charged by length and read in a second, so it carries what
   * decides whether the offer applies — the spend and the deadline — and
   * leaves the rest to the app card.
   */
  const smsFinePrint = [
    form.minSpend > 0 && `Minimum spend ${money(form.minSpend)}`,
    form.endDate && `Valid till ${formatDate(form.endDate)}`,
  ]
    .filter(Boolean)
    .join(". ");

  return (
    <div className="space-y-4">
      {/* Channel tabs. Held to the phone's own width so the two read as one
          object — a switch wider than the thing it switches looks like it
          belongs to the page instead. */}
      {/* The switch belongs to the app, so it follows the theme. Everything
          inside PhoneFrame below deliberately does not — see its own note. */}
      <div className="mx-auto flex max-w-[320px] items-center justify-center  rounded-xl bg-[#e4f2fe] p-1 dark:bg-white/10">
        {CHANNELS.map(({ id, label, icon: Icon, tint }) => {
          const active = channel === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setChannel(id)}
              aria-pressed={active}
              className={`flex items-center gap-1 rounded-lg px-5 py-1.5 text-[9px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#e4f2fe] dark:focus-visible:ring-offset-[#242a38] ${
                active
                  ? "bg-white text-[#3c4043] shadow-sm dark:bg-white/15 dark:text-[#e8ecf4] dark:shadow-none"
                  : "text-[#5f6368] hover:text-gray-700 dark:text-[#a8c4ee] dark:hover:text-white"
              }`}
            >
              <Icon size={14} className={tint} />
              {label}
            </button>
          );
        })}
      </div>

      <PhoneFrame center={channel !== "feed"}>
        {channel === "feed" && (
          <div className="space-y-2.5">
            <MerchantRow name={merchantName} />

            <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 p-4 shadow-sm">
              <span className="inline-block rounded-md bg-white/20 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                {badge}
              </span>
              <p className="mt-3 text-lg font-bold leading-snug text-white">
                {headline}
              </p>
              {festival && (
                <p className="mt-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-white">
                  <span aria-hidden>{festival.icon}</span>
                  Runs during {festival.label}
                </p>
              )}
              {audienceLine && (
                <p className="mt-1.5 text-[11px] font-medium text-white/80">
                  {audienceLine}
                </p>
              )}
            </div>

            {saving > 0 && (
              <div className="rounded-2xl border border-[#e8eaed] bg-white dark:bg-[#161d2e] p-3 shadow-sm dark:border-white/10 dark:shadow-none">
                <div className="flex items-center justify-between gap-2">
                  <p className="flex items-center gap-1.5 text-[12px] font-bold text-blue-600 dark:text-blue-300">
                    <Receipt size={13} />
                    Estimated Savings
                  </p>
                  <span className="rounded-full bg-blue-50 px-2 py-1 text-[10px] font-medium text-blue-600 dark:text-blue-300 dark:bg-blue-400/10">
                    On {money(SAMPLE_ORDER)} order
                  </span>
                </div>

                {capped && (
                  <p className="mt-1.5 text-[10px] text-amber-600 dark:text-amber-300">
                    Capped at {money(form.maxCap)} — {money(rawSaving)} before
                    the cap
                  </p>
                )}

                <dl className="mt-2.5 space-y-1.5 text-[12px]">
                  <div className="flex justify-between">
                    <dt className="text-[#5f6368] dark:text-[#a9b4c7]">
                      Original total:
                    </dt>
                    <dd className="tabular-nums text-[#9aa0a6] line-through dark:text-[#9aa6bd]">
                      {money(SAMPLE_ORDER)}
                    </dd>
                  </div>
                  <div className="flex justify-between border-b border-dashed border-[#dadce0] pb-1.5 dark:border-white/15">
                    <dt className="font-semibold text-blue-600 dark:text-blue-300">
                      Discount applied:
                    </dt>
                    <dd className="font-semibold tabular-nums text-blue-600 dark:text-blue-300">
                      − {money(saving)}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-bold text-[#3c4043] dark:text-[#e8ecf4]">
                      Customer pays:
                    </dt>
                    <dd className="font-bold tabular-nums text-blue-700 dark:text-blue-300">
                      {money(SAMPLE_ORDER - saving)}
                    </dd>
                  </div>
                </dl>
              </div>
            )}

            <div className="rounded-2xl border border-[#e8eaed] bg-white dark:bg-[#161d2e] px-3 py-2.5 shadow-sm dark:border-white/10 dark:shadow-none">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#5f6368] dark:text-[#a9b4c7]">
                Terms &amp; details
              </p>
              {terms.length > 0 && (
                <ul className="mt-2 space-y-2">
                  {terms.map(({ icon, text }) => (
                    <li
                      key={text}
                      className="flex items-start gap-2 text-[11px] leading-snug text-[#5f6368] dark:text-[#a9b4c7]"
                    >
                      {/* createElement rather than a capitalised binding,
                          which reads as defining a component in render. */}
                      {createElement(icon, {
                        size: 13,
                        className:
                          "mt-px shrink-0 text-[#9aa0a6] dark:text-[#9aa6bd]",
                      })}
                      {text}
                    </li>
                  ))}
                </ul>
              )}

              {/* A code nobody can read off the card is a code nobody uses. */}
              {form.hasKey && (
                <div className="mt-3 flex items-center justify-between gap-2 border-t border-[#e8eaed] pt-2.5 dark:border-white/10">
                  <span className="text-[11px] text-[#5f6368] dark:text-[#a9b4c7]">
                    Promo code:
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-gray-900 px-2.5 py-1 font-mono text-[11px] font-bold dark:bg-white/15 tracking-wider text-white">
                    <Tag size={11} />
                    {form.hasKey}
                  </span>
                </div>
              )}

              {/* Link and code side by side: the link is what you tap on
                  your own phone, the QR is what you hold up for someone else
                  to scan — showing a friend, or a staff member at the till. */}
              {offerUrl && (
                <div className="mt-2 flex items-center gap-2.5 rounded-lg bg-blue-50 p-2.5 dark:bg-blue-400/10">
                  <div className="shrink-0 rounded bg-white p-1.5">
                    <QRCode
                      value={offerUrl}
                      size={256}
                      level="M"
                      style={{ height: 52, width: 52 }}
                      viewBox="0 0 256 256"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="flex items-center gap-1 text-[10px] font-semibold text-blue-700 dark:text-blue-300">
                      <Link2 size={10} className="shrink-0" />
                      Tap or scan
                    </p>
                    <span className="mt-0.5 block truncate text-[10px] text-blue-600 dark:text-blue-300">
                      {offerUrl.replace(/^https:\/\//, "")}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 dark:bg-emerald-400/10">
              🍽 Dine-in
            </span> */}
          </div>
        )}

        {channel === "sms" && (
          <div className="space-y-3">
            <p className="mx-auto w-fit rounded-full bg-[#e8eaed] px-3 py-1 text-[11px] font-medium text-[#5f6368] dark:text-[#a9b4c7] dark:bg-white/10">
              Today 11:30 AM
            </p>

            {/* A message has no cards or colour to lean on, so the offer has
                to survive as one plain sentence — the same one the feed and
                the receipt print. */}
            <div className="rounded-2xl bg-white dark:bg-[#161d2e] p-3.5 shadow-sm dark:shadow-none">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-purple-600 text-[12px] font-bold text-white">
                  V
                </span>
                <p className="truncate text-[13px] font-bold text-[#3c4043] dark:text-[#e8ecf4]">
                  {merchantName}
                </p>
              </div>

              <div className="my-2.5 border-t border-[#e8eaed] dark:border-white/10" />

              <p className="text-[12px] text-gray-700 dark:text-[#c3ccdc]">
                🎉 Special Offer!
              </p>
              <p className="mt-1 text-[13px] font-bold text-emerald-600 dark:text-emerald-300">
                {headline}.
              </p>
              {audienceLine && (
                <p className="mt-0.5 text-[11px] text-[#5f6368] dark:text-[#a9b4c7]">
                  {audienceLine}.
                </p>
              )}
              {smsFinePrint && (
                <p className="mt-1 text-[12px] leading-relaxed text-gray-700 dark:text-[#c3ccdc]">
                  {smsFinePrint}.
                </p>
              )}
              {form.hasKey && (
                <p className="mt-1 text-[11px] text-[#5f6368] dark:text-[#a9b4c7]">
                  Use code{" "}
                  <span className="font-bold tracking-wider text-gray-700 dark:text-[#c3ccdc]">
                    {form.hasKey}
                  </span>
                </p>
              )}
              {/* Bare and underlined, the way a phone renders a link it has
                  detected in a message body — not styled as a button. */}
              {offerUrl && (
                <p className="mt-1 break-all text-[11px] text-blue-600 underline dark:text-blue-300">
                  {offerUrl}
                </p>
              )}

              <p className="mt-2 text-right text-[10px] text-[#9aa0a6] dark:text-[#9aa6bd]">
                Delivered
              </p>
            </div>
          </div>
        )}

        {channel === "receipt" && (
          <div className="rounded-2xl bg-white px-5 py-5 font-mono shadow-sm dark:bg-[#161d2e] dark:shadow-none">
            <p className="text-center text-[13px] font-bold uppercase tracking-[0.15em] text-[#3c4043] dark:text-[#e8ecf4]">
              {merchantName}
            </p>
            <p className="mt-1 text-center text-[11px] text-amber-600 dark:text-amber-300">
              {businessAddress}
            </p>
            <p className="mt-0.5 text-center text-[11px] tracking-wide text-[#5f6368] dark:text-[#a9b4c7]">
              CUSTOMER RECEIPT
            </p>

            <div className="my-3 border-t border-dashed border-[#dadce0] dark:border-white/15" />

            <div className="flex justify-between text-[12px] text-gray-700 dark:text-[#c3ccdc]">
              <span>1x Special Order</span>
              <span className="tabular-nums">{money(SAMPLE_ORDER)}</span>
            </div>

            {/* Only when the offer actually moves the total. A free item or a
                BOGO changes the basket, not this line, so printing a discount
                row for them would be inventing one. */}
            {saving > 0 && (
              <div className="mt-1 flex justify-between text-[12px] text-emerald-600 dark:text-emerald-300">
                <span>{badge}</span>
                <span className="tabular-nums">− {money(saving)}</span>
              </div>
            )}

            <div className="my-3 border-t border-dashed border-[#dadce0] dark:border-white/15" />

            <div className="flex justify-between">
              <span className="text-[13px] font-bold text-[#3c4043] dark:text-[#e8ecf4]">
                TOTAL PAID
              </span>
              <span className="text-[13px] font-bold tabular-nums text-emerald-600 dark:text-emerald-300">
                {money(SAMPLE_ORDER - saving)}
              </span>
            </div>

            {/* The QR belongs here and only here: a receipt is paper, and
                scanning it is the only way the code survives leaving the
                table. White quiet zone around it because a scanner needs the
                margin as much as the pattern. */}
            {offerUrl && (
              <div className="mt-4 flex flex-col items-center border-t border-dashed border-[#dadce0] pt-4 dark:border-white/15">
                <div className="rounded bg-white p-2">
                  <QRCode
                    value={offerUrl}
                    size={256}
                    level="M"
                    style={{ height: 84, width: 84 }}
                    viewBox="0 0 256 256"
                  />
                </div>
                <p className="mt-2 text-center text-[9px] uppercase tracking-wider text-[#5f6368] dark:text-[#a9b4c7]">
                  Scan for this offer
                </p>
              </div>
            )}

            <p className="mt-4 text-center text-[11px] text-amber-600 dark:text-amber-300">
              Thank you for visiting!
            </p>
          </div>
        )}
      </PhoneFrame>
    </div>
  );
}
