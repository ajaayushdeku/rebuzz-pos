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

  /**
   * The limit only applies while we know the plan is Free.
   *
   * `planLoading` is checked because the hook returns null until the profile
   * lands, and null parses as Free — without this the page would flash a limit
   * warning at a paying business on every load.
   */
  const isFree = !planLoading && tier === "free";

  // Base products only. Variants belong to a product rather than being
  // products, so `products.length` is already the right count.
  const used = products.length;
  const remaining = Math.max(0, FREE_PRODUCT_LIMIT - used);
  const atLimit = isFree && used >= FREE_PRODUCT_LIMIT;
  // Warn before the wall, not at it: finding out at product 20 that there is
  // no 21st is worse than knowing at 15.
  const nearLimit = isFree && !atLimit && remaining <= 5;

  return (
    <div className="min-h-screen bg-50 px-6 py-8 md:px-10">
      <div className="w-full mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2 pb-4 border-b border-gray-200">
          <div>
            <h1 className="font-bold text-xl md:text-2xl truncate">Products</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Manage your product inventory
            </p>
          </div>
          {/* Still clickable at the limit: the modal explains why nothing can
              be added, which a disabled button never could. */}
          <HeaderActionButton
            variant="dashed"
            icon={PackagePlus}
            hideLabelOnMobile
            label="Add new product"
            onClick={() => setFormModalOpen(true)}
          />
        </div>

        {/* The plan's ceiling, where it can be seen before it is hit rather
            than only in the dialog that refuses the click. */}
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
