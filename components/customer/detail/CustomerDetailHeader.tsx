"use client";

import { ArrowLeft, Hash, Mail, Phone, UserRound } from "lucide-react";
import type { Customer } from "@/lib/types/customer";
import { initials } from "@/lib/utils";
import { CustomerAvatar } from "@/components/customer/CustomerAvatar";
import {
  WhatsAppIcon,
  whatsappLink,
} from "@/components/customer/CustomerTable";
import { CHART_PALETTE } from "@/components/dashboardComponents/chartCard";
import { NO_TIER_STYLE } from "./customerDetailHelpers";
import { useTierStyle } from "@/hooks/useLoyaltyTiers";

/** One item of the meta row — an icon and its value, muted. */
function Meta({
  icon: Icon,
  value,
  title,
}: {
  icon: typeof Phone;
  value: string;
  title?: string;
}) {
  return (
    <span
      className="flex items-center gap-1.5"
      style={{ color: CHART_PALETTE.subtitle }}
      title={title ?? value}
    >
      <Icon size={11} className="shrink-0" />
      <span className="truncate">{value}</span>
    </span>
  );
}

export default function CustomerDetailHeader({
  customer,
  imageUrl,
  loyaltyStatus,
  onBack,
  onViewPhoto,
}: {
  customer: Customer;
  imageUrl: string | null;
  loyaltyStatus: string;
  onBack: () => void;
  onViewPhoto?: () => void;
}) {
  // A configured tier brings its own colour, worn by both the badge and the
  // initial circle so the two cannot disagree.
  const tierStyle = useTierStyle();
  const style = tierStyle(loyaltyStatus);
  const tierClass = style
    ? `${style.bgColor} ${style.color}`
    : `${NO_TIER_STYLE.bg} text-[#5f6368]`;

  return (
    <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div className="flex min-w-0 items-center gap-3">
        <button
          onClick={onBack}
          aria-label="Back to customers"
          title="Back to customers"
          className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-[#dadce0] bg-white text-[#5f6368] transition-colors hover:bg-[#f8f9fa] hover:text-[#3c4043]"
        >
          <ArrowLeft size={16} />
        </button>

        {imageUrl ? (
          <CustomerAvatar
            src={imageUrl}
            name={customer.name}
            className="h-11 w-11 shrink-0 border border-[#e3e3e3]"
            textClass="text-sm"
            onClick={onViewPhoto}
          />
        ) : (
          /* No photo: the tier's flat colour, with the customer mark behind
             the initials — the same circle the staff header draws. */
          <div
            className={`relative flex h-11 w-11 shrink-0 select-none items-center justify-center rounded-full border border-current/20 ${tierClass}`}
            title={customer.name}
          >
            <UserRound
              aria-hidden
              size={30}
              strokeWidth={1.5}
              className="pointer-events-none absolute opacity-25"
            />
            <span className="relative text-sm font-semibold tracking-wide">
              {initials(customer.name)}
            </span>
          </div>
        )}

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1
              className="truncate text-lg font-semibold tracking-tight md:text-2xl"
              style={{ color: CHART_PALETTE.title }}
            >
              {customer.name}
            </h1>
            {customer.isDeactivated && (
              <span className="shrink-0 rounded-full border border-red-200 bg-red-50 px-2 py-[3px] text-[10px] font-semibold uppercase tracking-[0.08em] text-red-600">
                Inactive
              </span>
            )}
          </div>

          {/* Everything that identifies this customer, on one muted line. */}
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
            <Meta
              icon={Hash}
              value={`${customer.id.slice(0, 8)}…`}
              title={`Customer ID: ${customer.id}`}
            />
            {customer.phone && <Meta icon={Phone} value={customer.phone} />}
            {customer.email && <Meta icon={Mail} value={customer.email} />}
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold ${tierClass}`}
        >
          {loyaltyStatus}
        </span>

        {customer.isDeactivated && (
          <span className="shrink-0 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-600">
            Inactive
          </span>
        )}

        {customer.phone && (
          <>
            {" "}
            <div className="h-5 w-[2px] bg-gray-300" />{" "}
            {/* <a
              href={whatsappLink(customer.phone)}
              target="_blank"
              rel="noopener noreferrer"
              title={`Chat on WhatsApp — ${customer.phone}`}
              aria-label={`Chat on WhatsApp — ${customer.phone}`}
              // WhatsApp's own green, so the action is recognisable on sight.
              // It rests as a circle and grows leftwards on hover: the label
              // is packed to the right, so the extra width opens on the left
              // and the glyph never moves.
              className="group flex h-9 w-9 shrink-0 items-center justify-end gap-2 overflow-hidden rounded-full bg-[#25D366] pr-[10px] text-[11px] font-medium whitespace-nowrap text-white transition-[width,padding,background-color] duration-300 ease-out hover:w-[116px] hover:bg-[#1ebe5a] hover:pl-3.5 focus-visible:w-[116px] focus-visible:pl-3.5"
            >
              <span className="opacity-0 transition-opacity duration-200 ease-out group-hover:opacity-100 group-focus-visible:opacity-100">
                WhatsApp
              </span>
              <WhatsAppIcon className="h-4 w-4 shrink-0" />
            </a> */}
            <a
              href={whatsappLink(customer.phone)}
              target="_blank"
              rel="noopener noreferrer"
              title={`Chat on WhatsApp — ${customer.phone}`}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-green-600 transition-colors hover:bg-green-50"
            >
              <WhatsAppIcon className="h-6 w-6" />
            </a>
          </>
        )}
      </div>
    </div>
  );
}
