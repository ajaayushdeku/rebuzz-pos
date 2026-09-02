"use client";

import { createElement, useState } from "react";
import {
  BadgeCheck,
  BadgePercent,
  BatteryMedium,
  CalendarCheck,
  CalendarDays,
  Clock,
  Layers,
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
import { useBusiness } from "@/hooks/useBusiness";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";
import { offerCopy } from "./offerDealConfig";
import { toBsLabel } from "@/lib/nepaliDate";

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
    tint: "text-blue-500",
  },
  {
    id: "sms" as const,
    label: "Viber/SMS",
    icon: MessageSquare,
    tint: "text-purple-500",
  },
  {
    id: "receipt" as const,
    label: "Bill Receipt",
    icon: Receipt,
    tint: "text-amber-500",
  },
];

type Channel = (typeof CHANNELS)[number]["id"];

/**
 * The phone frame every channel is drawn inside.
 *
 * Chrome only — the notch, the status bar and the bezel — so the three
 * channels differ in their content and nowhere else.
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
    <div className="mx-auto w-full max-w-[320px] rounded-[2rem] border-[6px] border-gray-900 bg-white shadow-xl">
      <div className="relative flex items-center justify-between rounded-t-[1.75rem] px-4 pb-1 pt-2.5 text-[11px] font-semibold text-gray-900">
        <span>9:41</span>
        <span className="absolute left-1/2 top-1.5 h-4 w-16 -translate-x-1/2 rounded-full bg-gray-900" />
        {/* Signal, wi-fi and battery, as a phone actually draws them. */}
        <span className="flex items-center gap-1 text-gray-800">
          <SignalHigh size={13} strokeWidth={2.5} />
          <Wifi size={13} strokeWidth={2.5} />
          <BatteryMedium size={15} strokeWidth={2} />
        </span>
      </div>

      <div
        className={`min-h-[460px] rounded-b-[1.85rem] bg-gray-50 px-3 pb-5 pt-2 ${
          center ? "flex flex-col justify-center" : ""
        }`}
      >
        {children}
      </div>

      <div className="mx-auto mb-2 h-1 w-24 rounded-full bg-gray-300" />
    </div>
  );
}

function MerchantRow({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600">
        <Store size={17} className="text-white" />
      </div>
      <div className="min-w-0">
        <p className="flex items-center gap-1 truncate text-[13px] font-bold text-gray-900">
          {name}
          <BadgeCheck size={13} className="shrink-0 text-blue-500" />
        </p>
        <p className="text-[10px] text-gray-400">Verified Merchant</p>
      </div>
    </div>
  );
}

export default function OfferPhonePreview() {
  const { form } = useOfferForm();
  const { data: products = [] } = useProductsList();
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
    scope: form.itemScope,
    category: form.category,
    itemName: products.find((p) => p.id === form.productId)?.name,
    freeItemName: products.find((p) => p.id === form.freeItemId)?.name,
    customDeal: form.customDeal,
    currency: currency.symbol,
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
    form.stackable && {
      icon: Layers,
      text: "Combinable with other offers",
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
      <div className="mx-auto flex max-w-[320px] items-center justify-center gap-1 rounded-xl bg-[#e4f2fe] p-1">
        {CHANNELS.map(({ id, label, icon: Icon, tint }) => {
          const active = channel === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setChannel(id)}
              aria-pressed={active}
              className={`flex items-center gap-2 rounded-lg px-3.25 py-2 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#e4f2fe] ${
                active
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}

              //  className={cn(
              //             "flex items-center gap-2 rounded-lg px-5 py-2 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#e4f2fe]",
              //             active
              //               ? "bg-white text-gray-900 shadow-sm"
              //               : "text-gray-500 hover:text-gray-700",
              //           )}
            >
              {/* The icon keeps its channel colour on every tab — it is what
                  the three are told apart by at a glance. */}
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
            </div>

            {saving > 0 && (
              <div className="rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <p className="flex items-center gap-1.5 text-[12px] font-bold text-blue-600">
                    <Receipt size={13} />
                    Estimated Savings
                  </p>
                  <span className="rounded-full bg-blue-50 px-2 py-1 text-[10px] font-medium text-blue-600">
                    On {money(SAMPLE_ORDER)} order
                  </span>
                </div>

                {capped && (
                  <p className="mt-1.5 text-[10px] text-amber-600">
                    Capped at {money(form.maxCap)} — {money(rawSaving)} before
                    the cap
                  </p>
                )}

                <dl className="mt-2.5 space-y-1.5 text-[12px]">
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Original total:</dt>
                    <dd className="tabular-nums text-gray-400 line-through">
                      {money(SAMPLE_ORDER)}
                    </dd>
                  </div>
                  <div className="flex justify-between border-b border-dashed border-gray-200 pb-1.5">
                    <dt className="font-semibold text-blue-600">
                      Discount applied:
                    </dt>
                    <dd className="font-semibold tabular-nums text-blue-600">
                      − {money(saving)}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-bold text-gray-800">Customer pays:</dt>
                    <dd className="font-bold tabular-nums text-blue-700">
                      {money(SAMPLE_ORDER - saving)}
                    </dd>
                  </div>
                </dl>
              </div>
            )}

            <div className="rounded-2xl border border-gray-100 bg-white px-3 py-2.5 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-gray-500">
                Terms &amp; details
              </p>
              {terms.length > 0 && (
                <ul className="mt-2 space-y-2">
                  {terms.map(({ icon, text }) => (
                    <li
                      key={text}
                      className="flex items-start gap-2 text-[11px] leading-snug text-gray-600"
                    >
                      {/* createElement rather than a capitalised binding,
                          which reads as defining a component in render. */}
                      {createElement(icon, {
                        size: 13,
                        className: "mt-px shrink-0 text-gray-400",
                      })}
                      {text}
                    </li>
                  ))}
                </ul>
              )}

              {/* A code nobody can read off the card is a code nobody uses. */}
              {form.hasKey && (
                <div className="mt-3 flex items-center justify-between gap-2 border-t border-gray-100 pt-2.5">
                  <span className="text-[11px] text-gray-500">Promo code:</span>
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-gray-900 px-2.5 py-1 font-mono text-[11px] font-bold tracking-wider text-white">
                    <Tag size={11} />
                    {form.hasKey}
                  </span>
                </div>
              )}
            </div>

            <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-700">
              🍽 Dine-in
            </span>
          </div>
        )}

        {channel === "sms" && (
          <div className="space-y-3">
            <p className="mx-auto w-fit rounded-full bg-gray-200/80 px-3 py-1 text-[11px] font-semibold text-gray-500">
              Today 11:30 AM
            </p>

            {/* A message has no cards or colour to lean on, so the offer has
                to survive as one plain sentence — the same one the feed and
                the receipt print. */}
            <div className="rounded-2xl bg-white p-3.5 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-purple-600 text-[12px] font-bold text-white">
                  V
                </span>
                <p className="truncate text-[13px] font-bold text-gray-900">
                  {merchantName}
                </p>
              </div>

              <div className="my-2.5 border-t border-gray-100" />

              <p className="text-[12px] text-gray-700">🎉 Special Offer!</p>
              <p className="mt-1 text-[13px] font-bold text-emerald-600">
                {headline}.
              </p>
              {smsFinePrint && (
                <p className="mt-1 text-[12px] leading-relaxed text-gray-700">
                  {smsFinePrint}.
                </p>
              )}
              {form.hasKey && (
                <p className="mt-1 text-[11px] text-gray-500">
                  Use code{" "}
                  <span className="font-bold tracking-wider text-gray-700">
                    {form.hasKey}
                  </span>
                </p>
              )}

              <p className="mt-2 text-right text-[10px] text-gray-400">
                Delivered
              </p>
            </div>
          </div>
        )}

        {channel === "receipt" && (
          <div className="rounded-2xl bg-white px-5 py-5 font-mono shadow-sm">
            <p className="text-center text-[13px] font-bold uppercase tracking-[0.15em] text-gray-900">
              {merchantName}
            </p>
            <p className="mt-1 text-center text-[11px] text-amber-600">
              {businessAddress}
            </p>
            <p className="mt-0.5 text-center text-[11px] tracking-wide text-gray-500">
              CUSTOMER RECEIPT
            </p>

            <div className="my-3 border-t border-dashed border-gray-300" />

            <div className="flex justify-between text-[12px] text-gray-700">
              <span>1x Special Order</span>
              <span className="tabular-nums">{money(SAMPLE_ORDER)}</span>
            </div>

            {/* Only when the offer actually moves the total. A free item or a
                BOGO changes the basket, not this line, so printing a discount
                row for them would be inventing one. */}
            {saving > 0 && (
              <div className="mt-1 flex justify-between text-[12px] text-emerald-600">
                <span>{badge}</span>
                <span className="tabular-nums">− {money(saving)}</span>
              </div>
            )}

            <div className="my-3 border-t border-dashed border-gray-300" />

            <div className="flex justify-between">
              <span className="text-[13px] font-bold text-gray-900">
                TOTAL PAID
              </span>
              <span className="text-[13px] font-bold tabular-nums text-emerald-600">
                {money(SAMPLE_ORDER - saving)}
              </span>
            </div>

            <p className="mt-4 text-center text-[11px] text-amber-600">
              Thank you for visiting!
            </p>
          </div>
        )}
      </PhoneFrame>
    </div>
  );
}
