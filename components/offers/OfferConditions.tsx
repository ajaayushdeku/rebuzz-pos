"use client";

import { useOfferForm } from "@/providers/OfferFormContext";
import { useCurrency } from "@/providers/CurrencyContext";
import { Lock, SlidersHorizontal } from "lucide-react";
import OfferStepCard from "./OfferStepCard";

const FIELD =
  "h-11 w-full rounded-xl border border-gray-200 bg-white text-sm tabular-nums outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";

const LABEL = "mb-1.5 block text-[13px] font-medium text-gray-700";

/** A number field that may be left empty — an empty box reads as "no limit". */
function LimitField({
  label,
  value,
  onChange,
  prefix,
  placeholder,
  hint,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  prefix?: string;
  placeholder: string;
  hint?: string;
}) {
  return (
    <div>
      <label className={LABEL}>{label}</label>
      <div className="relative">
        {prefix && (
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-gray-400">
            {prefix}
          </span>
        )}
        <input
          type="number"
          min={0}
          value={value || ""}
          onChange={(e) => onChange(Number(e.target.value))}
          placeholder={placeholder}
          className={`${FIELD} ${prefix ? "pl-10 pr-3.5" : "px-3.5"}`}
        />
      </div>
      {hint && <p className="mt-1.5 text-[11px] text-gray-400">{hint}</p>}
    </div>
  );
}

/**
 * Step 2 — the limits on the deal.
 *
 * Every field is optional, and an empty one means "no limit" rather than
 * zero, which is why nothing here is validated or required.
 */
export default function OfferConditions() {
  const { form, updateField } = useOfferForm();
  const { currency } = useCurrency();

  /**
   * A cap only means something for a percentage deal, where the amount taken
   * off grows with the bill. A flat Rs discount already has a ceiling — the
   * discount itself — so offering one there would invite a limit that can
   * never bind.
   */
  const showCap = form.discountKind === "percentage";

  return (
    <OfferStepCard
      step={2}
      title="Conditions"
      subtitle="All optional. Leave blank for no limit."
      icon={SlidersHorizontal}
      accent="blue"
    >
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <LimitField
          label={`Minimum order spend (${currency.symbol})`}
          value={form.minSpend}
          onChange={(v) => updateField("minSpend", v)}
          prefix={currency.symbol}
          placeholder="100"
        />
        <LimitField
          label="Limit per customer"
          value={form.usesLimit}
          onChange={(v) => updateField("usesLimit", v)}
          placeholder="2"
        />
      </div>

      {showCap && (
        <div className="mt-5 sm:max-w-[calc(50%-0.625rem)]">
          <LimitField
            label={`Maximum discount cap (${currency.symbol})`}
            value={form.maxCap}
            onChange={(v) => updateField("maxCap", v)}
            prefix={currency.symbol}
            placeholder="100"
            hint="Caps a % deal so a big bill doesn't cost you too much"
          />
        </div>
      )}

      {/* Locked, not hidden.
          Shown so the capability is discoverable and the layout does not shift
          when it lands, but dimmed and inert throughout — the same treatment
          the invoice detail page gives its scheduled reminders: opacity on the
          whole group, `cursor-not-allowed`, and the control itself `disabled`
          so it cannot be reached by keyboard or click either. */}
      <div
        aria-hidden
        className="mt-6 flex cursor-not-allowed items-center justify-between gap-4 border-t border-gray-100 pt-5 opacity-50"
      >
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-[13px] font-semibold text-gray-500">
            <Lock size={12} className="shrink-0" />
            Can be used with other offers
          </p>
          <p className="mt-0.5 text-[11px] text-gray-400">
            Coming soon — offers currently apply one at a time
          </p>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={false}
          disabled
          tabIndex={-1}
          aria-label="Can be used with other offers — coming soon"
          className="relative h-6 w-11 shrink-0 cursor-not-allowed rounded-full bg-gray-200"
        >
          <span className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow" />
        </button>
      </div>
    </OfferStepCard>
  );
}
