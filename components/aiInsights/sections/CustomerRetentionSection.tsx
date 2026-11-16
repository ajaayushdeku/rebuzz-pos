"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import {
  Copy,
  HeartHandshake,
  MessageCircle,
  // Check,
  Star,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

import type { AiSectionState } from "@/hooks/useAiSection";
import { useWindowPhrase } from "@/components/aiInsights/periodLabel";
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

function copyAllMessages(item: RetentionInsight) {
  const content = item.styles
    .map(
      (style) =>
        `${style.title}\n${style.messages
          .map((message, index) => `Option ${index + 1}: ${message}`)
          .join("\n")}`,
    )
    .join("\n\n");

  navigator.clipboard
    .writeText(content)
    .then(() => toast.success("All messages copied"))
    .catch(() => toast.error("Couldn't copy the messages"));
}

const everyText = (days: number) =>
  days <= 1 ? "every day" : `every ${days} days`;

export default function CustomerRetentionSection({
  items,
  state,
  onDismiss,
}: {
  items: RetentionInsight[];
  state: AiSectionState<RetentionInsight>;
  onDismiss: (id: string) => void;
}) {
  const windowText = useWindowPhrase(
    `the last ${RETENTION_LOOKBACK_DAYS} days`,
  );

  const money = useMoney();

  const [isBodyExpanded, setIsBodyExpanded] = useState(true);

  return (
    <section>
      <SectionHeader
        icon={HeartHandshake}
        iconClassName="bg-pink-50 text-pink-600 dark:text-pink-300 dark:bg-pink-400/10"
        title="Customer Retention Radar"
        subtitle="Personalized messages to reconnect with regular customers"
        info={{
          heading: "About these recommendations",
          body: "Each customer receives six communication styles with two personalized message suggestions per style. Messages use their visit habits, usual orders and loyalty information where available. Choose a style and message option to view, copy or send it.",
        }}
        actions={
          <>
            <SectionRefreshButton
              state={state}
              textClassName="text-pink-700 hover:bg-pink-100 border-pink-300 hover:border-pink-400 dark:hover:border-pink-400/60 dark:hover:bg-pink-400/20 dark:border-pink-400/40 dark:text-pink-300"
            />{" "}
            {/* Collapse / Expand */}
            <button
              type="button"
              onClick={() => setIsBodyExpanded((prev) => !prev)}
              aria-expanded={isBodyExpanded}
              aria-label={
                isBodyExpanded ? "Collapse section" : "Expand section"
              }
              title={isBodyExpanded ? "Collapse section" : "Expand section"}
              className="
        inline-flex shrink-0 items-center justify-center
        rounded-lg border border-[#e2e6ed]
        bg-white p-2 text-[#737b89]
        transition-all duration-200
        hover:border-violet-300 hover:bg-violet-50 hover:text-violet-600
        dark:border-white/10 dark:bg-white/[0.04]
        dark:text-[#aab4c4]
        dark:hover:border-violet-400/40
        dark:hover:bg-violet-400/10 dark:hover:text-violet-300
      "
            >
              {isBodyExpanded ? (
                <ChevronUp size={15} />
              ) : (
                <ChevronDown size={15} />
              )}
            </button>
          </>
        }
      />

      <div
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
          isBodyExpanded
            ? "grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="min-h-0 overflow-hidden">
          <AiSectionBody
            state={state}
            visibleCount={items.length}
            layout="cards"
            noSalesMessage={`No bills linked to a customer in ${windowText}. Add customers to bills to track their visits.`}
            nothingFlaggedMessage="Your regulars are all coming in at their usual pace. Nobody to win back right now."
            emptyMessage="No regulars going quiet right now."
          >
            <CardGrid>
              {items.map((item) => {
                const tone = STATUS[item.status] ?? STATUS["Cooling off"];

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
                            ? "text-red-600 dark:text-red-300"
                            : "text-amber-700 dark:text-amber-300",
                        note: `usually ${everyText(item.usualGapDays)}`,
                      },
                      {
                        label: "Per visit",
                        value: money(item.spendPerVisit),
                      },
                      {
                        label: "A month",
                        value: money(item.monthlyValue),
                        note: "at their usual pace",
                      },
                    ]}
                    // footer={
                    //   <div className="flex flex-wrap items-center gap-2">
                    //     <CardAction onClick={() => copyAllMessages(item)}>
                    //       <Copy size={14} aria-hidden />
                    //       Copy all 12 messages
                    //     </CardAction>
                    //   </div>
                    // }
                    footer={
                      item.phone && item.styles[0]?.messages[0] ? (
                        <CardAction
                          href={`https://wa.me/${item.phone}?text=${encodeURIComponent(item.styles[0].messages[0])}`}
                          external
                        >
                          <MessageCircle size={14} aria-hidden />
                          Send on WhatsApp
                        </CardAction>
                      ) : undefined
                    }
                  >
                    {(item.usualOrder.length > 0 || item.loyaltyPoints > 0) && (
                      <div className="flex flex-wrap justify-between gap-x-6 gap-y-3">
                        {item.usualOrder.length > 0 && (
                          <div>
                            <BodyLabel>Usually orders</BodyLabel>
                            <p className="text-[13px] font-semibold text-[#3c4043] dark:text-[#e8ecf4]">
                              {item.usualOrder.join(" + ")}
                            </p>
                          </div>
                        )}

                        {item.loyaltyPoints > 0 && (
                          <div>
                            <BodyLabel>Loyalty points</BodyLabel>
                            <p className="text-[13px] font-semibold tabular-nums flex flex-row items-center gap-1   text-[#3c4043] dark:text-[#e8ecf4]">
                              <Star className="h-3.5 w-3.5" />{" "}
                              {item.loyaltyPoints.toLocaleString("en-US")}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    <MessageSelector
                      styles={item.styles}
                      phone={item.phone}
                      tip={item.tip}
                    />
                  </InsightCard>
                );
              })}
            </CardGrid>
          </AiSectionBody>
        </div>
      </div>
    </section>
  );
}

function MessageSelector({
  styles,
  phone,
  tip,
}: {
  styles: RetentionInsight["styles"];
  phone: string | null;
  tip: string;
}) {
  const [selectedStyle, setSelectedStyle] = useState(0);
  const [selectedOption, setSelectedOption] = useState(0);

  const activeStyle = styles[selectedStyle];
  const activeMessage = activeStyle?.messages[selectedOption];

  if (!activeStyle || !activeMessage) return null;

  return (
    <div className="mt-2 ">
      {/* Style selector */}
      <div>
        <div className=" flex items-center justify-between">
          <BodyLabel>Choose a message style</BodyLabel>
          <span className="text-[10px] font-medium text-[#9299a5] dark:text-[#8491a6]">
            {styles.length} available
          </span>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 [scrollbar-width:thin]">
          {styles.map((style, index) => {
            const active = selectedStyle === index;

            return (
              <button
                key={style.id}
                type="button"
                onClick={() => {
                  setSelectedStyle(index);
                  setSelectedOption(0);
                }}
                className={`flex shrink-0 items-center gap-2 rounded-full border px-3 py-1 text-left transition-all duration-200 ${
                  active
                    ? "border-pink-300 bg-pink-50 shadow-sm dark:border-pink-400/40 dark:bg-pink-400/10"
                    : "border-[#e8eaed] bg-white hover:border-[#d5d9e1] dark:border-white/10 dark:bg-white/[0.025] dark:hover:border-white/20"
                }`}
              >
                {/* <span
                  className={`size-1.5 shrink-0 rounded-full ${
                    active ? "bg-pink-500" : "bg-[#c4c9d2] dark:bg-[#667085]"
                  }`}
                /> */}

                <span
                  className={`text-[11px] font-semibold ${
                    active
                      ? "text-pink-700 dark:text-pink-300"
                      : "text-[#737b89] dark:text-[#aab4c4]"
                  }`}
                >
                  {style.title}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Message preview */}
      <div className="overflow-hidden rounded-xl  bg-white  dark:bg-[#171e2c]">
        <div className="py-3.5">
          <Recommendation
            details={
              <div className="space-y-1.5">
                <div className="flex flex-col items-start justify-between gap-3 border-b border-[#edf0f3]  pb-3 dark:border-white/10">
                  <div className="min-w-0">
                    <p className="text-[12px] font-bold text-[#343a46] dark:text-[#e8ecf4]">
                      {activeStyle.title}
                    </p>
                    <p className="mt-0.5 text-[11px] text-[#89909c] dark:text-[#9ca9bc]">
                      {activeStyle.description}
                    </p>
                  </div>

                  {/* Option switch */}

                  <div className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-[#f1f3f6] p-1 dark:bg-[#151D2E]">
                    {activeStyle.messages.map((_, index) => {
                      const active = selectedOption === index;

                      return (
                        <button
                          key={index}
                          type="button"
                          onClick={() => setSelectedOption(index)}
                          aria-pressed={active}
                          className={`rounded-md px-3 py-1.5 text-[10px] font-semibold transition-all duration-200 ${
                            active
                              ? "bg-white text-[#343a46] shadow-sm dark:bg-[#303b4e] dark:text-white"
                              : "text-[#9299a5] hover:text-[#424955] dark:text-[#8995a8] dark:hover:text-[#e8ecf4]"
                          }`}
                        >
                          Option {index + 1}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex mt-3 items-center justify-between gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#9299a5] dark:text-[#8491a6]">
                    Message preview
                  </span>
                  <button
                    type="button"
                    onClick={() => copyMessage(activeMessage)}
                    className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold text-blue-700 transition-colors hover:bg-blue-50 dark:hover:bg-blue-400/15 dark:text-blue-300"
                  >
                    <Copy size={11} aria-hidden />
                    Copy
                  </button>

                  {/* <span className="rounded-md bg-pink-50 px-2 py-1 text-[10px] font-semibold text-pink-700 dark:bg-pink-400/10 dark:text-pink-300">
                    Option {selectedOption + 1} of 2
                  </span> */}
                </div>

                <p className="mt-1 rounded-md border border-[#e8eaed] bg-white dark:bg-white/5 px-3 py-2 text-[12px] italic leading-relaxed text-[#5f6368] dark:border-white/10 dark:text-[#a9b4c7]">
                  “{activeMessage}”
                </p>
              </div>
            }
          >
            <div className="flex items-start gap-2.5">
              <div className="min-w-0">
                <p className="mt-1 text-[12px] leading-relaxed text-[#626b79] dark:text-[#b3bdcc]">
                  {tip}
                </p>
              </div>
            </div>
          </Recommendation>
        </div>
      </div>
    </div>
  );
}
