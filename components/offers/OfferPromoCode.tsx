"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { ClipboardList, Copy, Ticket, Wand2 } from "lucide-react";

import { useOfferForm } from "@/providers/OfferFormContext";
import { useCurrency } from "@/providers/CurrencyContext";
import { useProductsList } from "@/hooks/useProductsList";
import OfferStepCard from "./OfferStepCard";
import { dealSummary } from "./offerDealConfig";
import { festivalById } from "./festivals";

/**
 * Step 4 — the code customers type at the till, and a plain-English read-back
 * of everything decided so far.
 */
export default function OfferPromoCode() {
  const { form, updateField } = useOfferForm();
  const { currency } = useCurrency();
  const { data: products = [] } = useProductsList();
  const [copied, setCopied] = useState(false);

  const festival = festivalById(form.festival);

  /**
   * The occasion, then the discount.
   *
   * A code is read aloud and typed by someone in a hurry, so it names the
   * campaign rather than encoding it — NEWYEARS23 tells the staff which offer
   * this is. The number is the percentage, and only a percentage deal has one:
   * a rupee amount or a free item would put a figure there that means nothing
   * at the till.
   */
  const generate = () => {
    const stem = festival?.code ?? "OFFER";
    const suffix =
      form.discountKind === "percentage" && form.discount > 0
        ? String(form.discount)
        : "";
    updateField("hasKey", `${stem}${suffix}`);
  };

  const copy = async () => {
    if (!form.hasKey) return;
    try {
      await navigator.clipboard.writeText(form.hasKey);
      setCopied(true);
      toast.success("Promo code copied");
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Couldn't copy the code");
    }
  };

  const summary = [
    dealSummary({
      dealId: form.discountKind,
      amount: form.discount,
      scope: form.itemScope,
      category: form.category,
      itemName: products.find((p) => p.id === form.productId)?.name,
      freeItemName: products.find((p) => p.id === form.freeItemId)?.name,
      customDeal: form.customDeal,
      currency: currency.symbol,
    }),
    festival && `during ${festival.label}`,
    form.hasKey && `code ${form.hasKey}`,
  ].filter(Boolean) as string[];

  return (
    <>
      <OfferStepCard
        step={4}
        title="Promo Code"
        subtitle="Optional custom code customers type at checkout."
        icon={Ticket}
        iconBg="bg-amber-100"
        iconColor="text-amber-600"
      >
        <label className="mb-1.5 block text-[13px] font-medium text-gray-700">
          Code
        </label>
        <div className="flex flex-wrap items-center gap-2.5">
          <input
            type="text"
            value={form.hasKey}
            // Upper-cased on the way in: a code is read off a receipt and
            // typed back, and "newyears23" failing to match is not a mistake
            // worth letting a customer make.
            onChange={(e) =>
              updateField("hasKey", e.target.value.toUpperCase())
            }
            placeholder="NEWYEARS23"
            className="h-12 min-w-0 flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3.5 font-mono text-sm tracking-wider text-gray-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 sm:max-w-sm"
          />

          <button
            type="button"
            onClick={generate}
            className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-[13px] font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
          >
            <Wand2 size={15} />
            Generate
          </button>

          <button
            type="button"
            onClick={copy}
            disabled={!form.hasKey}
            className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-[13px] font-semibold text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Copy size={15} />
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </OfferStepCard>

      {/* The whole offer as one sentence.
          Four steps of separate controls are hard to hold in the head at once,
          so this is the last chance to notice the offer says something other
          than what was meant. */}
      <div className="flex items-start gap-3 w-full rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 ">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white">
          <ClipboardList size={17} className="text-emerald-600" />
        </span>
        <div className="min-w-0">
          <p className="text-[13px] font-bold text-green-800">
            Your offer so far
          </p>
          <p className=" text-[13px] leading-relaxed text-green-700">
            {summary.length > 0 ? (
              summary.map((part, i) => (
                <span key={part}>
                  {i > 0 && <span className="text-green-400"> · </span>}
                  <span className={i === 0 ? "font-semibold" : ""}>{part}</span>
                </span>
              ))
            ) : (
              <span className="text-green-400">
                Pick a deal in step 1 to start building your offer.
              </span>
            )}
          </p>
        </div>
      </div>
    </>
  );
}
