"use client";

import { useState } from "react";
import ProductTable from "@/components/product/ProductTable";
import ProductFormModal from "@/components/product/ProductFormModal";
import { AlertTriangle, Info, PackagePlus } from "lucide-react";
import Link from "next/link";
import { useProductsList } from "@/hooks/useProductsList";
import { useSubscriptionType } from "@/hooks/useSubscriptionType";
import { FREE_PRODUCT_LIMIT, parseSubscription } from "@/lib/config/plans";
import HeaderActionButton from "@/components/ui/HeaderActionButton";

export default function Page() {
  const [formModalOpen, setFormModalOpen] = useState(false);
  const { data: products = [], isLoading } = useProductsList();
  const { subscriptionType, isLoading: planLoading } = useSubscriptionType();

  const { tier } = parseSubscription(subscriptionType);

  const isFree = !planLoading && tier === "free";

  const used = products.length;
  const remaining = Math.max(0, FREE_PRODUCT_LIMIT - used);
  const atLimit = isFree && used >= FREE_PRODUCT_LIMIT;

  const nearLimit = isFree && !atLimit && remaining <= 5;

  return (
    <div className="min-h-screen bg-surface-page px-6 py-8 md:px-10">
      <div className="w-full mx-auto">
        <div className="flex flex-col justify-between gap-4 pb-5 sm:flex-row sm:items-end">
          <div className="min-w-0">
            <h1 className="truncate text-[22px] font-semibold tracking-[1px] text-[#3c4043] md:text-[26px]">
              Products
            </h1>
            <p className="mt-1 max-w-xl text-[12px] leading-relaxed text-[#5f6368]">
              Manage your product inventory
            </p>
          </div>

          <HeaderActionButton
            variant="dashed"
            icon={PackagePlus}
            hideLabelOnMobile
            label="Add new product"
            onClick={() => setFormModalOpen(true)}
          />
        </div>

        <div
          aria-hidden
          className="mb-6 h-px w-full bg-gradient-to-r from-[#dadce0] via-[#e8eaed] to-transparent"
        />

        {isFree && !isLoading && (atLimit || nearLimit) && (
          <div
            role={atLimit ? "alert" : undefined}
            className={`mt-4 flex flex-wrap items-start gap-2.5 rounded-xl border px-4 py-3 ${
              atLimit
                ? "border-amber-200 bg-amber-50"
                : "border-blue-200 bg-blue-50"
            }`}
          >
            {atLimit ? (
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            ) : (
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
            )}

            <p
              className={`min-w-0 flex-1 text-[13px] leading-relaxed ${
                atLimit ? "text-amber-900" : "text-blue-900"
              }`}
            >
              {atLimit ? (
                <>
                  You have used all{" "}
                  <span className="font-semibold">{FREE_PRODUCT_LIMIT}</span>{" "}
                  products included in the Free plan. Upgrade to add more —
                  everything you already have stays as it is.
                </>
              ) : (
                <>
                  <span className="font-semibold">
                    {used} of {FREE_PRODUCT_LIMIT}
                  </span>{" "}
                  products used on the Free plan.{" "}
                  {remaining === 1 ? "One place left" : `${remaining} left`}.
                </>
              )}
            </p>

            <Link
              href="/subscriptions"
              className={`shrink-0 text-[13px] font-semibold underline-offset-2 hover:underline ${
                atLimit ? "text-amber-700" : "text-blue-700"
              }`}
            >
              View plans
            </Link>
          </div>
        )}

        <ProductTable products={products} isLoading={isLoading} />

        <ProductFormModal
          open={formModalOpen}
          onClose={() => setFormModalOpen(false)}
          limitReached={atLimit}
        />
      </div>
    </div>
  );
}
