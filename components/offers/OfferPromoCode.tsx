"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import {
  ClipboardList,
  Copy,
  Download,
  Link2,
  QrCode,
  Ticket,
  Wand2,
} from "lucide-react";
import QRCode from "react-qr-code";

import { useOfferForm } from "@/providers/OfferFormContext";
import { useCurrency } from "@/providers/CurrencyContext";
import { useProductsList } from "@/hooks/useProductsList";
import { productLabel } from "@/lib/productVariants";
import OfferStepCard from "./OfferStepCard";
import { dealSummary, offerLink } from "./offerDealConfig";
import { useLoyaltyTiers } from "@/hooks/useLoyaltyTiers";
import { festivalById } from "./festivals";

/**
 * Step 4 — the code customers type at the till, and a plain-English read-back
 * of everything decided so far.
 */
export default function OfferPromoCode() {
  const { form, updateField } = useOfferForm();
  const { currency } = useCurrency();
  const { data: products = [] } = useProductsList();
  const { data: tiers = [] } = useLoyaltyTiers();
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  // MOCK while the short-link service is pending — see offerLink.
  const offerUrl = offerLink(form.hasKey);

  const copyLink = async () => {
    if (!offerUrl) return;
    try {
      await navigator.clipboard.writeText(offerUrl);
      setLinkCopied(true);
      window.setTimeout(() => setLinkCopied(false), 1500);
    } catch {
      toast.error("Couldn't copy the link");
    }
  };

  /**
   * Save the QR as an SVG.
   *
   * Read straight out of the DOM rather than re-rendered to a canvas: the code
   * on screen is already an SVG, so this is the exact artwork the merchant
   * approved, and it scales to a poster without going soft.
   */
  const downloadQr = () => {
    const svg = document.getElementById("offer-qr");
    if (!svg) return;

    const source = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `offer-${form.hasKey.toLowerCase() || "code"}.svg`;
    a.click();
    // Released immediately: the download has already been handed the blob, and
    // an unrevoked object URL holds the data for the life of the document.
    URL.revokeObjectURL(url);
  };

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
      audience: form.audience,
      tierName: tiers.find((t) => t.id === form.audienceTierId)?.name,
      freeItemName: productLabel(
        products,
        form.freeItemId,
        form.freeItemVariantId,
      ),
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
        accent="amber"
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

        {/* Share it — link and QR.
            Below the code because both are derived from it: with no code there
            is nothing to link to, and an empty QR would be a decorative box. */}
        <div className="mt-6 border-t border-gray-100 pt-5">
          <p className="mb-1.5 flex items-center gap-1.5 text-[13px] font-medium text-gray-700">
            <Link2 size={14} className="shrink-0 text-gray-400" />
            Share link &amp; QR code
          </p>

          {!form.hasKey ? (
            <p className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-3.5 py-4 text-center text-[12px] text-gray-400">
              Add a promo code above to get a shareable link and QR code.
            </p>
          ) : (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={offerUrl}
                    onFocus={(e) => e.currentTarget.select()}
                    className="h-11 min-w-0 flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3.5 text-[13px] text-gray-700 outline-none"
                  />
                  <button
                    type="button"
                    onClick={copyLink}
                    className="inline-flex h-11 shrink-0 cursor-pointer items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 text-[13px] font-semibold text-gray-600 transition-colors hover:bg-gray-50"
                  >
                    <Copy size={15} />
                    {linkCopied ? "Copied" : "Copy"}
                  </button>
                </div>

                <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-800">
                  Placeholder link — the short-link service isn&apos;t built
                  yet, so this address won&apos;t open. The QR encodes it as-is.
                </p>

                <button
                  type="button"
                  onClick={downloadQr}
                  className="mt-3 inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-[12px] font-semibold text-gray-600 transition-colors hover:bg-gray-50"
                >
                  <Download size={14} />
                  Download QR (SVG)
                </button>
              </div>

              <div className="shrink-0 self-center sm:self-start">
                <div className="rounded-xl border border-gray-200 bg-white p-3">
                  {/* Sized in CSS with a fixed viewBox so one SVG serves both
                      the on-screen chip and a printed poster. */}
                  <QRCode
                    id="offer-qr"
                    value={offerUrl}
                    size={256}
                    level="M"
                    style={{ height: 116, width: 116 }}
                    viewBox="0 0 256 256"
                  />
                </div>
                <p className="mt-1.5 flex items-center justify-center gap-1 text-[10px] text-gray-400">
                  <QrCode size={11} />
                  Scan to open
                </p>
              </div>
            </div>
          )}
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
