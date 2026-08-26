"use client";

import { useState, useMemo } from "react";
import { Search, Check } from "lucide-react";
import { useCurrency } from "@/providers/CurrencyContext";
import toast from "react-hot-toast";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import CountryFlag from "@/components/ui/CountryFlag";
import { CURRENCY_OPTIONS, type CurrencyOption } from "@/lib/config/currencies";

/**
 * Shown above the full list, in this order.
 *
 * Nearly every business on the app uses one of these three, and finding them
 * otherwise means scrolling past a hundred rows or knowing what to type.
 */
const POPULAR_CODES = ["NPR", "USD", "INR"];

const POPULAR = POPULAR_CODES.map((code) =>
  CURRENCY_OPTIONS.find((c) => c.code === code),
).filter((c): c is CurrencyOption => Boolean(c));

/**
 * One selectable currency — flag, code and name, with the symbol on a rail
 * down the right.
 *
 * Shared by the popular shortcuts and the full list so the two cannot drift
 * apart visually.
 */
function CurrencyRow({
  option,
  onSelect,
}: {
  option: CurrencyOption;
  onSelect: (code: string) => void;
}) {
  return (
    <button
      onClick={() => onSelect(option.code)}
      className="flex w-full items-stretch gap-3 overflow-hidden rounded-lg border border-gray-100 text-left transition-colors hover:border-gray-200 hover:bg-gray-50"
    >
      <div className="flex min-w-0 flex-1 items-center gap-3 py-2.5 pl-3">
        {/* The flag repeats the code beside it, so it is decorative to a
            screen reader rather than read out twice. */}
        <CountryFlag countryCode={option.countryCode} label="" />

        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-800">{option.code}</p>
          <p className="truncate text-xs text-gray-600">
            {option.name} — {option.country}
          </p>
        </div>
      </div>

      {/* Symbol rail — stretches the row's full height, so the column of
          symbols reads as one strip down the list. */}
      <span className="flex w-14 shrink-0 items-center justify-center self-stretch border-l border-gray-100 bg-gray-50/70 text-base text-[13px] font-semibold text-gray-600">
        {option.symbol}
      </span>
    </button>
  );
}

export default function CurrencyPage() {
  const { setCurrency } = useCurrency();
  const [search, setSearch] = useState("");
  const [confirmTarget, setConfirmTarget] = useState<CurrencyOption | null>(
    null,
  );
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(
    () =>
      CURRENCY_OPTIONS.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.code.toLowerCase().includes(search.toLowerCase()) ||
          c.country.toLowerCase().includes(search.toLowerCase()),
      ),
    [search],
  );

  const handleSelect = (code: string) => {
    const found = CURRENCY_OPTIONS.find((c) => c.code === code);
    if (found) setConfirmTarget(found);
  };

  const handleConfirm = async () => {
    if (!confirmTarget) return;
    setSaving(true);

    try {
      // Saved to the business first — the context reverts itself if the API
      // refuses, so a reload would otherwise show the old currency back.
      await setCurrency(confirmTarget.code);
      toast.success(`Currency changed to ${confirmTarget.code}`);

      // The dialog stays on its pending state until the reload takes over;
      // closing first would flash the list back for a moment.
      window.location.reload();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to change currency",
      );
      setSaving(false);
      setConfirmTarget(null);
    }
  };

  return (
    <div className="min-h-screen bg-50 px-6 py-8 md:px-10">
      <div className="w-full mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-gray-200">
          <div className="flex flex-row items-center gap-3">
            {/* <div className="w-9 h-9 bg-blue-100 rounded-lg flex flex-row items-center justify-center">
              <Coins size={16} className="text-blue-600" />
            </div> */}
            <div>
              <h1 className="font-bold text-xl md:text-2xl truncate">
                Change Currency
              </h1>
              <p className="text-xs text-gray-400 mt-0.5">
                Select your preferred currency
              </p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by currency, code or country..."
            className="w-full pl-8 pr-3 py-2 text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Popular — hidden while searching, where a fixed three rows above
            the results would only be in the way. */}
        {!search && (
          <div className="mb-5">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
              Popular
            </p>
            <div className="space-y-1.5">
              {POPULAR.map((c) => (
                <CurrencyRow key={c.code} option={c} onSelect={handleSelect} />
              ))}
            </div>
          </div>
        )}

        <div className="mb-2 flex items-baseline justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
            {search ? "Results" : "All currencies"}
          </p>
          <p className="text-[11px] text-gray-400">
            {filtered.length} of {CURRENCY_OPTIONS.length}
          </p>
        </div>

        {/* List — the popular three appear here too, so the full list stays
            complete rather than having three arbitrary gaps in it. */}
        <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
          {filtered.map((c) => (
            <CurrencyRow key={c.code} option={c} onSelect={handleSelect} />
          ))}

          {filtered.length === 0 && (
            <p className="py-8 text-center text-xs text-gray-400">
              No currency matches “{search}”.
            </p>
          )}
        </div>
      </div>

      {/* Confirmation modal */}
      <ConfirmDialog
        open={!!confirmTarget}
        onClose={() => !saving && setConfirmTarget(null)}
        tone="primary"
        // The flag stands in for the icon badge — the currency's identity is
        // the whole point of the prompt.
        badge={
          confirmTarget ? (
            <CountryFlag
              countryCode={confirmTarget.countryCode}
              label={confirmTarget.code}
              className="mb-3 h-12 w-16"
            />
          ) : undefined
        }
        title="Change Currency?"
        description={
          <>
            Switch your active currency to{" "}
            <span className="font-semibold text-gray-800">
              {confirmTarget?.code} ({confirmTarget?.symbol})
            </span>
            ?
          </>
        }
        detail={
          confirmTarget
            ? `${confirmTarget.country} — ${confirmTarget.name}`
            : undefined
        }
        // warning="The page will reload so every amount re-renders in the new currency."
        confirmLabel="Confirm"
        pendingLabel="Changing..."
        confirmIcon={Check}
        onConfirm={handleConfirm}
        isPending={saving}
      />
    </div>
  );
}
