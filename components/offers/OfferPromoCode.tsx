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
import { offerOccasion } from "./festivals";

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
  const offerUrl = offerLink(form.code);

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
    a.download = `offer-${form.code.toLowerCase() || "code"}.svg`;
    a.click();
    // Released immediately: the download has already been handed the blob, and
    // an unrevoked object URL holds the data for the life of the document.
    URL.revokeObjectURL(url);
  };

  const festival = offerOccasion(form.festival, form.customFestival);

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
      form.discountKind === "percentage" && form.value > 0
        ? String(form.value)
        : "";
    updateField("code", `${stem}${suffix}`);
  };

  const copy = async () => {
    if (!form.code) return;
    try {
      await navigator.clipboard.writeText(form.code);
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
      amount: form.value,
      audience: form.audience,
      tierName: tiers.find((t) => t.id === form.audienceTierId)?.name,
      freeItemName: productLabel(
        products,
        form.freeProduct,
        form.freeProductVariantId,
      ),
      currency: currency.symbol,
    }),
    festival && `during ${festival.label}`,
    form.code && `code ${form.code}`,
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
        <label className="mb-1.5 block text-[13px] font-medium text-[#3c4043] dark:text-[#e8ecf4]">
          Code
        </label>
        {/* The field takes the row on a phone and the buttons share the one
            below. Side by side, "Generate" and "Copy" came to about 210px of a
            287px step body and left the code box a stub. */}
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
          <input
            type="text"
            value={form.code}
            // Upper-cased on the way in: a code is read off a receipt and
            // typed back, and "newyears23" failing to match is not a mistake
            // worth letting a customer make.
            onChange={(e) => updateField("code", e.target.value.toUpperCase())}
            placeholder="NEWYEARS23"
            className="h-12 min-w-0 flex-1 rounded-xl border border-[#dadce0] bg-white dark:bg-white/5 px-3.5 font-mono text-sm tracking-wider text-[#3c4043] outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 sm:max-w-sm dark:border-white/15 dark:text-[#e8ecf4]"
          />

          {/* Their own row, splitting it evenly — a 44px-tall target that
              reaches half the width is easier to hit than a shrink-wrapped
              one pushed against the edge. */}
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={generate}
              className="inline-flex h-10 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-[13px] font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 sm:flex-none dark:border-emerald-400/25 dark:bg-emerald-400/10 dark:text-emerald-300 dark:hover:bg-emerald-400/20"
            >
              <Wand2 size={15} />
              Generate
            </button>

            <button
              type="button"
              onClick={copy}
              disabled={!form.code}
              className="inline-flex h-10 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#dadce0] bg-white px-4 text-[13px] font-semibold text-[#5f6368] transition-colors hover:bg-[#f8f9fa] disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none dark:border-white/15 dark:bg-white/5 dark:text-[#a9b4c7] dark:hover:bg-white/5"
            >
              <Copy size={15} />
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>

        {/* Share it — link and QR.
            Below the code because both are derived from it: with no code there
            is nothing to link to, and an empty QR would be a decorative box. */}
        <div className="mt-6 border-t border-[#e8eaed] pt-5 dark:border-white/10">
          <p className="mb-1.5 flex items-center gap-1.5 text-[13px] font-medium text-[#3c4043] dark:text-[#e8ecf4]">
            <Link2
              size={14}
              className="shrink-0 text-[#9aa0a6] dark:text-[#9aa6bd]"
            />
            Share link &amp; QR code
          </p>

          {!form.code ? (
            <p className="rounded-xl border border-dashed border-[#dadce0] bg-[#f8f9fa] px-3.5 py-4 text-center text-[12px] text-[#9aa0a6] dark:border-white/15 dark:text-[#9aa6bd] dark:bg-white/5">
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
                    className="h-11 min-w-0 flex-1 rounded-xl border border-[#dadce0] bg-[#f8f9fa] px-3.5 text-[13px] text-[#5f6368] outline-none dark:border-white/15 dark:text-[#a9b4c7] dark:bg-white/5"
                  />
                  <button
                    type="button"
                    onClick={copyLink}
                    className="inline-flex h-11 shrink-0 cursor-pointer items-center gap-2 rounded-xl border border-[#dadce0] bg-white dark:bg-white/5 px-3.5 text-[13px] font-semibold text-[#5f6368] transition-colors hover:bg-[#f8f9fa] dark:hover:bg-white/5 dark:border-white/15 dark:text-[#a9b4c7]"
                  >
                    <Copy size={15} />
                    {linkCopied ? "Copied" : "Copy"}
                  </button>
                </div>

                <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-800 dark:text-amber-200 dark:bg-amber-400/10">
                  Placeholder link — the short-link service isn&apos;t built
                  yet, so this address won&apos;t open. The QR encodes it as-is.
                </p>

                <button
                  type="button"
                  onClick={downloadQr}
                  className="mt-3 inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-[#dadce0] bg-white dark:bg-white/5 px-3 text-[12px] font-semibold text-[#5f6368] transition-colors hover:bg-[#f8f9fa] dark:hover:bg-white/5 dark:border-white/15 dark:text-[#a9b4c7]"
                >
                  <Download size={14} />
                  Download QR (SVG)
                </button>
              </div>

              <div className="shrink-0 self-center sm:self-start">
                <div className="rounded-xl border border-[#dadce0] bg-white  p-3 dark:border-white/15">
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
                <p className="mt-1.5 flex items-center justify-center gap-1 text-[10px] text-[#9aa0a6] dark:text-[#9aa6bd]">
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
      <div className="flex items-start gap-3 w-full rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-400/25 dark:bg-[#142F38] ">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white dark:bg-white/10">
          <ClipboardList
            size={17}
            className="text-emerald-600 dark:text-emerald-300"
          />
        </span>
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-emerald-800 dark:text-emerald-200">
            Your offer so far
          </p>
          <p className=" text-[13px] leading-relaxed text-green-700 dark:text-emerald-300">
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
