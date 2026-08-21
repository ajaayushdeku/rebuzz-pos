"use client";

import { ArrowLeft } from "lucide-react";
import type { Customer } from "@/lib/types/customer";
import { CustomerAvatar } from "@/components/customer/CustomerAvatar";
import {
  WhatsAppIcon,
  whatsappLink,
} from "@/components/customer/CustomerTable";
import { TIER_BG, TIER_RING } from "./customerDetailHelpers";

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
  return (
    <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div className="flex min-w-0 items-center gap-3">
        <button
          onClick={onBack}
          aria-label="Back to customers"
          className="rounded-lg p-2 text-gray-400 shadow-sm transition-colors hover:bg-white hover:text-gray-700"
        >
          <ArrowLeft size={18} />
        </button>

        <div className="flex min-w-0 items-center gap-3">
          <CustomerAvatar
            src={imageUrl}
            name={customer.name}
            className="h-12 w-12 shrink-0 shadow-md ring-2 ring-white"
            textClass="text-base"
            onClick={onViewPhoto}
          />
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold text-gray-900 md:text-2xl">
              {customer.name}
            </h1>
            <p className="mt-0.5 text-xs text-gray-400">
              Customer ID: {customer.id.slice(0, 8)}...
            </p>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <span
          className={`rounded-full px-3 py-1.5 text-xs font-bold shadow-sm ring-2 ${TIER_BG[loyaltyStatus]} ${TIER_RING[loyaltyStatus]}`}
        >
          {loyaltyStatus}
        </span>

        {customer.isDeactivated && (
          <span className="rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600">
            Inactive
          </span>
        )}

        {customer.phone && (
          <>
            <div className="h-5 w-[2px] bg-gray-300" />
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
