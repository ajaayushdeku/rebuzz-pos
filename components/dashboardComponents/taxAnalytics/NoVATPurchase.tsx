"use client";

import { ShoppingBag, Info } from "lucide-react";
import { mockNoVATPurchasesData } from "@/lib/mockData/mock-tax-data";
import LockDimFeactureOverlay from "@/components/LockDimFeactureOverlay";

export default function NoVATPurchases() {
  const d = mockNoVATPurchasesData;

  return (
    <div className="relative bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex flex-col gap-4">
      <LockDimFeactureOverlay component_name="No VAT Purchases" />

      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
          <ShoppingBag size={15} className="text-indigo-600" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-gray-900">
            Purchases With No VAT to Claim
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Tax-free items you bought — nothing to recover on these
          </p>
        </div>
      </div>

      {/* Two metric cols */}
      <div className="grid grid-cols-2 gap-4 pt-1">
        <div>
          <p className="text-[10px] font-semibold text-indigo-500 uppercase tracking-widest mb-2">
            No-VAT Purchases
          </p>
          <p className="text-2xl font-bold text-blue-700">
            Rs {d.noVATPurchases.toLocaleString()}
          </p>
          <p className="text-[11px] text-gray-400 mt-1">
            {d.noVATPct}% of all buying
          </p>
        </div>
        <div>
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
            Taxable Purchases
          </p>
          <p className="text-2xl font-bold text-gray-900">
            Rs {d.taxablePurchases.toLocaleString()}
          </p>
          <p className="text-[11px] text-gray-400 mt-1">
            VAT claimable on these
          </p>
        </div>
      </div>

      {/* Info note */}
      <div className="flex items-start gap-2 bg-gray-50 rounded-xl px-3 py-2.5">
        <Info size={13} className="text-gray-400 shrink-0 mt-0.5" />
        <p className="text-[11px] text-gray-500 leading-relaxed">
          Tax-free items (like basic foods) have no VAT — which sounds good, but
          it means there&lsquo;s nothing to claim back on them. If you sell them
          prepared at 13%, your real cost is a bit higher than it looks, since
          you could&lsquo;t recover VAT on the ingredients.
        </p>
      </div>
    </div>
  );
}
