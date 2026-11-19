"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import {
  Copy,
  HeartHandshake,
  MessageCircle,
  Star,
  ChevronUp,
  ChevronDown,
  Check,
  ThumbsDown,
} from "lucide-react";

import {
  useCustomerRetentionFeedback,
  useSaveCustomerRetentionFeedback,
} from "@/hooks/useCustomerRetentionFeedback";

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
import type { PeriodKind } from "@/services/apiPeriodInsights.client";

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
          .map((message, index) => `Option ${index + 1}: ${message.text}`)
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
  kind,
  periodId,
  isAdmin,
}: {
  items: RetentionInsight[];
  state: AiSectionState<RetentionInsight>;
  onDismiss: (id: string) => void;
  kind: PeriodKind;
  periodId: string;
  isAdmin: boolean;
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
        iconClassName="border-blue-200 bg-blue-50 text-blue-600 dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-300"
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
              textClassName="text-blue-700 hover:bg-blue-100 border-blue-300 hover:border-blue-400 dark:hover:border-blue-400/60 dark:hover:bg-blue-400/20 dark:border-blue-400/40 dark:text-blue-300"
            />

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
  hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600
  dark:border-[#293750] dark:bg-[#182338]
  dark:text-[#aab4c4]
  dark:hover:border-blue-400/40
  dark:hover:bg-blue-400/10 dark:hover:text-blue-300
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
                          href={`https://wa.me/${item.phone}?text=${encodeURIComponent(item.styles[0].messages[0].text)}`}
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
                      // phone={item.phone}
                      tip={item.tip}
                      itemId={item.id}
                      kind={kind}
                      periodId={periodId}
                      isAdmin={isAdmin}
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
  tip,
  itemId,
  kind,
  periodId,
  isAdmin,
}: {
  styles: RetentionInsight["styles"];
  tip: string;
  itemId: string;
  kind: PeriodKind;
  periodId: string;
  isAdmin: boolean;
}) {
  const [selectedStyle, setSelectedStyle] = useState(0);
  const [selectedOption, setSelectedOption] = useState(0);

  const [showRejectionForm, setShowRejectionForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const { data: feedback = [], isLoading: isFeedbackLoading } =
    useCustomerRetentionFeedback(kind, periodId);

  const saveFeedback = useSaveCustomerRetentionFeedback();

  const activeStyle = styles[selectedStyle];
  const activeMessage = activeStyle?.messages[selectedOption];

  if (!activeStyle || !activeMessage) return null;

  // Find the saved decision for this exact message.
  const savedFeedback = feedback.find(
    (entry) => entry.messageId === activeMessage.id,
  );

  const isSaving = saveFeedback.isPending || isFeedbackLoading;

  async function handleFeedback(
    decision: "approved" | "disapproved",
    reason: string | null = null,
  ) {
    if (!isAdmin || !periodId || isSaving) return;

    try {
      await saveFeedback.mutateAsync({
        kind,
        periodId,
        messageId: activeMessage.id,
        retentionItemId: itemId,
        styleId: activeStyle.id,
        styleTitle: activeStyle.title,
        optionIndex: selectedOption,
        message: activeMessage.text,
        decision,
        rejectionReason: decision === "disapproved" ? reason : null,
        style: null,
      });

      setShowRejectionForm(false);
      setRejectionReason("");

      toast.success(
        decision === "approved"
          ? "Message approved"
          : "Message marked as not suitable",
      );
    } catch (error) {
      console.error("[Retention Feedback] Save failed:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Couldn't save your feedback. Please try again.",
      );
    }
  }

  return (
    <div className="mt-2">
      {/* Style selector */}
      <div>
        <div className="flex items-center justify-between">
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
                  setShowRejectionForm(false);
                  setRejectionReason("");
                }}
                className={`flex shrink-0 items-center gap-2 rounded-full border px-3 py-1 text-left transition-all duration-200 ${
                  active
                    ? "border-pink-300 bg-pink-50 dark:border-pink-400/40 dark:bg-pink-400/10"
                    : "border-[#e8eaed] bg-white hover:border-pink-200 hover:bg-pink-50/60 dark:border-[#293750] dark:bg-[#182338] dark:hover:border-pink-400/30 dark:hover:bg-pink-400/[0.06]"
                }`}
              >
                <span
                  className={`text-[11px] font-semibold ${
                    active
                      ? "text-pink-700 dark:text-pink-300"
                      : "text-[#737b89] dark:text-[#aab4c4] hover:text-pink-500"
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
      <div className="overflow-hidden rounded-xl">
        <div className="py-3.5">
          <Recommendation
            details={
              <div className="space-y-1.5">
                <div className="flex flex-col items-start justify-between gap-3 border-b border-[#edf0f3] pb-3 dark:border-white/10">
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
                          onClick={() => {
                            setSelectedOption(index);
                            setShowRejectionForm(false);
                            setRejectionReason("");
                          }}
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

                {/* Preview heading and copy */}
                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#9299a5] dark:text-[#8491a6]">
                    Message preview
                  </span>

                  <button
                    type="button"
                    onClick={() => copyMessage(activeMessage.text)}
                    className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold text-blue-700 transition-colors hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-400/15"
                  >
                    <Copy size={11} aria-hidden />
                    Copy
                  </button>
                </div>

                <p className="mt-1 rounded-md border border-[#e8eaed] bg-white px-3 py-2 text-[12px] italic leading-relaxed text-[#5f6368] dark:border-white/10 dark:bg-white/5 dark:text-[#a9b4c7]">
                  “{activeMessage.text}”
                </p>

                {/* Feedback controls */}
                {isAdmin && (
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#edf0f3] pt-3 dark:border-white/10">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-medium text-[#9299a5] dark:text-[#8491a6]">
                        Is this message suitable?
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={isSaving}
                        onClick={() => handleFeedback("approved")}
                        aria-pressed={savedFeedback?.decision === "approved"}
                        className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11px] font-semibold transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
                          savedFeedback?.decision === "approved"
                            ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-300"
                            : "border-[#e8eaed] bg-white text-[#737b89] hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 dark:border-[#293750] dark:bg-[#182338] dark:text-[#aab4c4] dark:hover:border-emerald-400/30 dark:hover:text-emerald-300"
                        }`}
                      >
                        <Check size={13} />
                        Approve
                      </button>

                      <button
                        type="button"
                        disabled={isSaving}
                        onClick={() => {
                          if (showRejectionForm) {
                            setShowRejectionForm(false);
                            return;
                          }

                          setRejectionReason(
                            savedFeedback?.decision === "disapproved"
                              ? (savedFeedback.rejectionReason ?? "")
                              : "",
                          );

                          setShowRejectionForm(true);
                        }}
                        aria-pressed={savedFeedback?.decision === "disapproved"}
                        className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11px] font-semibold transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
                          savedFeedback?.decision === "disapproved"
                            ? "border-red-300 bg-red-50 text-red-700 dark:border-red-400/30 dark:bg-red-400/10 dark:text-red-300"
                            : "border-[#e8eaed] bg-white text-[#737b89] hover:border-red-300 hover:bg-red-50 hover:text-red-700 dark:border-[#293750] dark:bg-[#182338] dark:text-[#aab4c4] dark:hover:border-red-400/30 dark:hover:text-red-300"
                        }`}
                      >
                        <ThumbsDown size={13} />
                        Not suitable
                      </button>
                    </div>
                  </div>
                )}

                {showRejectionForm && (
                  <div
                    className="
      mt-3 space-y-3 rounded-xl
      border border-rose-200/80
      bg-gradient-to-br from-rose-50 via-white to-[#fff7f7]
      p-3.5 shadow-sm shadow-rose-100/60

      dark:border-rose-400/20
      dark:bg-gradient-to-br dark:from-[#2b202b]
      dark:via-[#241e2a] dark:to-[#211e2a]
      dark:shadow-black/10
    "
                  >
                    <div>
                      <p className="text-[12px] font-semibold text-rose-800 dark:text-rose-200">
                        Why is this message not suitable?
                      </p>
                      <p className="mt-0.5 text-[11px] leading-relaxed text-rose-700/70 dark:text-[#b9aab9]">
                        Optionally explain what should be improved.
                      </p>
                    </div>

                    <textarea
                      value={rejectionReason}
                      onChange={(event) =>
                        setRejectionReason(event.target.value)
                      }
                      placeholder="e.g. The message doesn't reflect this customer's usual preferences..."
                      maxLength={500}
                      rows={3}
                      disabled={isSaving}
                      className="
        w-full resize-none rounded-lg
        border border-rose-200/90
        bg-white/90 px-3 py-2.5
        text-[12px] leading-relaxed text-[#37313a]
        outline-none transition-all duration-200
        placeholder:text-[#aaa0a7]
        focus:border-rose-400 focus:ring-2 focus:ring-rose-100
        disabled:cursor-not-allowed disabled:opacity-50

        dark:border-[#51404e]
        dark:bg-[#191923]/80
        dark:text-[#eee7ef]
        dark:placeholder:text-[#887c8b]
        dark:focus:border-rose-400/60
        dark:focus:ring-rose-400/10
      "
                    />

                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[10px] font-medium text-[#93838c] dark:text-[#a99aa9]">
                        {rejectionReason.length}/500 characters · Optional
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={isSaving}
                          onClick={() => {
                            setShowRejectionForm(false);
                            setRejectionReason("");
                          }}
                          className="
            rounded-lg px-3 py-1.5
            text-[11px] font-semibold
            text-[#756773] transition-colors
            hover:bg-rose-100/70
            disabled:cursor-not-allowed disabled:opacity-50
            dark:text-[#c0b2c1]
            dark:hover:bg-white/[0.06]
          "
                        >
                          Cancel
                        </button>

                        <button
                          type="button"
                          disabled={isSaving}
                          onClick={() =>
                            handleFeedback(
                              "disapproved",
                              rejectionReason.trim() || null,
                            )
                          }
                          className="
            inline-flex items-center gap-1.5
            rounded-lg border border-rose-700/10
            bg-rose-600 px-3 py-1.5
            text-[11px] font-semibold text-white
            shadow-sm shadow-rose-900/10
            transition-all duration-200
            hover:bg-rose-700 hover:shadow-md
            active:scale-[0.98]
            disabled:cursor-not-allowed disabled:opacity-50
            dark:border-rose-300/10
            dark:bg-rose-500/90
            dark:hover:bg-rose-500
          "
                        >
                          <ThumbsDown size={12} />
                          Confirm rejection
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {savedFeedback && (
                  <div className="mt-2 space-y-1">
                    <p className="text-[10px] text-[#9299a5] dark:text-[#8491a6]">
                      {savedFeedback.decision === "approved"
                        ? "This message has been approved."
                        : "This message has been marked as not suitable."}
                    </p>

                    {savedFeedback.decision === "disapproved" &&
                      savedFeedback.rejectionReason && (
                        <p className="rounded-lg border border-red-200 bg-red-50/60 px-3 py-2 text-[11px] leading-relaxed text-red-700 dark:border-red-400/20 dark:bg-red-400/[0.05] dark:text-red-300">
                          <span className="font-semibold">Reason: </span>
                          {savedFeedback.rejectionReason}
                        </p>
                      )}
                  </div>
                )}
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
