"use client";

import toast from "react-hot-toast";
import { Copy, HeartHandshake, MessageCircle } from "lucide-react";

import type { AiSectionState } from "@/hooks/useAiSection";
import {
  RETENTION_LOOKBACK_DAYS,
  type RetentionInsight,
  type RetentionStatus,
} from "@/lib/ai-insights/sections/retention";
import {
  AiSectionBody,
  BodyLabel,
  CardAction,
  CardGrid,
  InsightCard,
  LabelNote,
  LeadTile,
  Recommendation,
  SectionHeader,
  SectionRefreshButton,
  useMoney,
  type AccentName,
} from "../parts";

/** One colour for how far gone a customer is. */
const STATUS: Record<RetentionStatus, { accent: AccentName }> = {
  "At risk": { accent: "red" },
  "Cooling off": { accent: "amber" },
};

function copyMessage(message: string) {
  navigator.clipboard
    .writeText(message)
    .then(() => toast.success("Message copied"))
    .catch(() => toast.error("Couldn't copy the message"));
}

/** "every 4 days", "every day". */
const everyText = (days: number) =>
  days <= 1 ? "every day" : `every ${days} days`;

export default function CustomerRetentionSection({
  items,
  state,
  onDismiss,
}: {
  /** The customers still on the page, after dismissals. */
  items: RetentionInsight[];
  state: AiSectionState<RetentionInsight>;
  onDismiss: (id: string) => void;
}) {
  const money = useMoney();

  return (
    <section>
      <SectionHeader
        icon={HeartHandshake}
        iconClassName="bg-pink-50 text-pink-600"
        title="Customer Retention Radar"
        subtitle="Regulars who are overdue for a visit, judged against their own habit"
        actions={
          <div className="flex flex-row w-full md:w-fit items-end justify-end absolute md:relative top-2">
            <SectionRefreshButton
              state={state}
              textClassName="text-pink-700 hover:bg-pink-100 border-pink-300 hover:border-pink-400"
            />
          </div>
        }
      />

      <AiSectionBody
        state={state}
        visibleCount={items.length}
        layout="cards"
        noSalesMessage={`No bills linked to a customer in the last ${RETENTION_LOOKBACK_DAYS} days yet. Add the customer to a bill to track their visits.`}
        nothingFlaggedMessage="Your regulars are all coming in at their usual pace. Nobody to win back right now."
        emptyMessage="No regulars going quiet right now."
      >
        <CardGrid>
          {items.map((item) => {
            const tone = STATUS[item.status];
            return (
              <InsightCard
                key={item.id}
                accent={tone.accent}
                lead={
                  <LeadTile accent={tone.accent}>
                    <span className="text-sm font-bold">
                      {item.name.charAt(0).toUpperCase()}
                    </span>
                  </LeadTile>
                }
                label={
                  <>
                    {item.status}
                    <LabelNote>{item.profile}</LabelNote>
                  </>
                }
                title={item.name}
                onDismiss={() => onDismiss(item.id)}
                dismissLabel={item.name}
                metrics={[
                  {
                    label: "Last visit",
                    value: `${item.daysSinceVisit} days ago`,
                    valueClassName:
                      item.status === "At risk"
                        ? "text-red-600"
                        : "text-amber-700",
                    note: `usually ${everyText(item.usualGapDays)}`,
                  },
                  { label: "Per visit", value: money(item.spendPerVisit) },
                  {
                    label: "A month",
                    value: money(item.monthlyValue),
                    note: "at their pace",
                  },
                ]}
                // WhatsApp opens with the message filled in; nothing is sent
                // until the owner presses send there. Without a phone number,
                // the message is copied instead.
                footer={
                  item.phone ? (
                    <CardAction
                      href={`https://wa.me/${item.phone}?text=${encodeURIComponent(item.message)}`}
                      external
                    >
                      <MessageCircle size={14} aria-hidden />
                      Send on WhatsApp
                    </CardAction>
                  ) : (
                    <CardAction onClick={() => copyMessage(item.message)}>
                      <Copy size={14} aria-hidden />
                      Copy message
                    </CardAction>
                  )
                }
              >
                {(item.usualOrder.length > 0 || item.loyaltyPoints > 0) && (
                  <div className="flex flex-wrap gap-x-6 gap-y-3">
                    {item.usualOrder.length > 0 && (
                      <div>
                        <BodyLabel>Usually orders</BodyLabel>
                        <p className="text-[13px] font-semibold text-gray-900">
                          {item.usualOrder.join(" + ")}
                        </p>
                      </div>
                    )}
                    {item.loyaltyPoints > 0 && (
                      <div>
                        <BodyLabel>Loyalty points</BodyLabel>
                        <p className="text-[13px] font-semibold tabular-nums text-gray-900">
                          {item.loyaltyPoints.toLocaleString("en-US")}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-auto">
                  <Recommendation
                    details={
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-medium text-gray-500">
                            Message to send
                          </span>
                          <button
                            type="button"
                            onClick={() => copyMessage(item.message)}
                            className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold text-blue-700 transition-colors hover:bg-blue-50"
                          >
                            <Copy size={11} aria-hidden />
                            Copy
                          </button>
                        </div>
                        <p className="mt-1.5 rounded-md border border-gray-100 bg-white px-3 py-2 text-[12px] italic leading-relaxed text-gray-600">
                          “{item.message}”
                        </p>
                      </div>
                    }
                  >
                    {item.tip}
                  </Recommendation>
                </div>
              </InsightCard>
            );
          })}
        </CardGrid>
      </AiSectionBody>
    </section>
  );
}
