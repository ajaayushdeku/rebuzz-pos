"use client";

import RangeBadge from "@/components/ui/RangeBadge";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";
import {
  RefreshCcw,
  TrendingDown,
  AlertCircle,
  Undo2,
  Calendar,
  type LucideIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { CHART_PALETTE, ChartCard } from "../chartCard";
import { TaxRefundStatsSkeleton } from "./TaxAnalyticsSkeletons";

interface RefundTaxItem {
  billNumber: string;
  refundedAmount: number;
  taxRefunded: number;
  reason: string;
  date: string;
}

/** One of the three figures above the list. */
function StatTile({
  icon: Icon,
  iconClass,
  label,
  value,
  sub,
}: {
  icon: LucideIcon;
  /** Icon tile colours; its border takes the icon's own hue. */
  iconClass: string;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div
      className="rounded-xl border px-5 py-4"
      style={{ borderColor: CHART_PALETTE.border }}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className="min-w-0 truncate text-[11px]"
          style={{ color: CHART_PALETTE.axis }}
        >
          {label}
        </span>
        <div
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-current/20 ${iconClass}`}
        >
          <Icon size={15} />
        </div>
      </div>
      <p
        className="mt-2 truncate text-lg font-semibold tracking-tight tabular-nums"
        style={{ color: CHART_PALETTE.title }}
      >
        {value}
      </p>
      <p
        className="mt-0.5 truncate text-[11px]"
        style={{ color: CHART_PALETTE.subtitle }}
      >
        {sub}
      </p>
    </div>
  );
}

const TaxOnRefundedBills = ({
  data,
  isLoading,
  isError,
}: {
  data: RefundTaxItem[];
  isLoading: boolean;
  isError: boolean;
}) => {
  const router = useRouter();
  const { currency } = useCurrency();

  const fmt = (v: number) =>
    formatCurrencySymbol(v, currency.symbol, currency.locale);

  const totalRefundedAmount = data.reduce((s, r) => s + r.refundedAmount, 0);
  const totalTaxRefunded = data.reduce((s, r) => s + r.taxRefunded, 0);
  const avgRefundTaxAmount =
    data.length > 0 ? totalTaxRefunded / data.length : 0;

  return (
    <ChartCard
      icon={Undo2}
      // Rose, as before: Tailwind's rose-600 / rose-200 / rose-50.
      iconColor="#e11d48"
      iconBorder="#fecdd3"
      iconBg="#fff1f2"
      title="Tax on Refunds"
      info={{
        heading: "Reading this card",
        // From the refund hook: refunded bills inside the page's date range.
        body: "Bills refunded in the date range at the top of the page, newest first. Tax refunded is the tax that was reversed along with the bill. Click a row to open that invoice.",
      }}
      subtitle="Tax reversed for returned items"
      controls={<RangeBadge variant="pill" />}
    >
      {isLoading ? (
        <TaxRefundStatsSkeleton />
      ) : isError ? (
        <p
          className="py-16 text-center text-sm"
          style={{ color: CHART_PALETTE.bad }}
        >
          Failed to load Highest Tax Generated
        </p>
      ) : data.length === 0 ? (
        <div className="flex flex-col items-center justify-center pb-4">
          <div
            className="mb-3 flex h-16 w-16 items-center justify-center rounded-full"
            style={{ backgroundColor: CHART_PALETTE.hover }}
          >
            <Undo2 size={24} style={{ color: CHART_PALETTE.subtitle }} />
          </div>
          <p className="text-sm" style={{ color: CHART_PALETTE.title }}>
            No refunded bills
          </p>
          <p className="mt-1 text-xs" style={{ color: CHART_PALETTE.subtitle }}>
            Refunded transactions will appear here
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <StatTile
              icon={RefreshCcw}
              iconClass="bg-red-50 text-red-600"
              label="Total refunded"
              value={fmt(totalRefundedAmount)}
              sub={`${data.length} ${data.length === 1 ? "bill" : "bills"}`}
            />
            <StatTile
              icon={TrendingDown}
              iconClass="bg-orange-50 text-orange-600"
              label="Tax refunded"
              value={fmt(totalTaxRefunded)}
              sub={`${
                totalRefundedAmount > 0
                  ? `${((totalTaxRefunded / totalRefundedAmount) * 100).toFixed(1)}%`
                  : "0%"
              } of total`}
            />
            <StatTile
              icon={AlertCircle}
              iconClass="bg-blue-50 text-blue-600"
              label="Avg. tax refund"
              value={fmt(avgRefundTaxAmount)}
              sub="Per bill"
            />
          </div>

          <div className="mt-6">
            <p
              className="mb-1 text-[13px] font-medium"
              style={{ color: CHART_PALETTE.title }}
            >
              Recent refunds
            </p>

            <div
              className="max-h-80 overflow-y-auto border-t"
              style={{ borderColor: CHART_PALETTE.grid }}
            >
              {data.map((bill) => (
                <div
                  key={bill.billNumber}
                  role="button"
                  tabIndex={0}
                  onClick={() => router.push(`/invoices/${bill.billNumber}`)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      router.push(`/invoices/${bill.billNumber}`);
                    }
                  }}
                  className="flex cursor-pointer items-center justify-between gap-3 border-b px-3 py-3 transition-colors last:border-0 hover:bg-blue-50/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  style={{ borderColor: CHART_PALETTE.grid }}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-current/20 bg-rose-50 text-rose-600">
                      <RefreshCcw size={15} />
                    </div>
                    <div className="min-w-0">
                      <p
                        className="truncate text-[13px]"
                        style={{ color: CHART_PALETTE.title }}
                      >
                        ORD-{bill.billNumber}
                      </p>
                      <p
                        className="mt-0.5 flex items-center gap-1.5 truncate text-[11px]"
                        style={{ color: CHART_PALETTE.subtitle }}
                      >
                        <span className="truncate">{bill.reason}</span>
                        <span className="flex shrink-0 items-center gap-1">
                          <Calendar size={11} />
                          {bill.date}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <p
                      className="text-[13px] font-medium tabular-nums"
                      style={{ color: CHART_PALETTE.bad }}
                    >
                      −{fmt(bill.refundedAmount)}
                    </p>
                    <p
                      className="mt-0.5 text-[11px] tabular-nums"
                      style={{ color: CHART_PALETTE.warn }}
                    >
                      Tax: −{fmt(bill.taxRefunded)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </ChartCard>
  );
};

export default TaxOnRefundedBills;
