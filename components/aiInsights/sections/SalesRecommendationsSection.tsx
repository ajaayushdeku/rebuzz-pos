"use client";

import { CircleCheck, Info, TrendingUp, TriangleAlert } from "lucide-react";

import type { AiSectionState } from "@/hooks/useAiSection";
import {
  SALES_WINDOW_DAYS,
  type RecommendationKind,
  type SalesRecommendation,
} from "@/lib/ai-insights/sections/salesRecommendations";
import {
  AiSectionBody,
  DismissButton,
  SectionHeader,
  SectionMoreButton,
  SectionRefreshButton,
} from "../parts";

const KIND = {
  warning: {
    icon: TriangleAlert,
    className: "text-amber-500",
    label: "Warning",
  },
  info: { icon: Info, className: "text-blue-500", label: "Suggestion" },
  success: {
    icon: CircleCheck,
    className: "text-emerald-500",
    label: "Working well",
  },
} satisfies Record<
  RecommendationKind,
  { icon: unknown; className: string; label: string }
>;

export default function SalesRecommendationsSection({
  items,
  state,
  onDismiss,
}: {
  /** The recommendations still on the page, after dismissals. */
  items: SalesRecommendation[];
  state: AiSectionState<SalesRecommendation>;
  onDismiss: (id: string) => void;
}) {
  return (
    <section>
      <SectionHeader
        icon={TrendingUp}
        iconClassName="bg-blue-50 text-blue-600"
        title="Sales Recommendations"
        // The window is part of the subtitle so nobody reads these as
        // following a date filter this page does not have.
        subtitle={`Based on the last ${SALES_WINDOW_DAYS} days, compared with the ${SALES_WINDOW_DAYS} before`}
        actions={
          <div className="flex flex-row w-full md:w-fit items-end justify-end gap-2 absolute md:relative top-2">
            <SectionMoreButton
              state={state}
              textClassName="text-blue-700 hover:bg-blue-100 border-blue-300 hover:border-blue-400"
            />
            <SectionRefreshButton
              state={state}
              textClassName="text-blue-700 hover:bg-blue-100 border-blue-300 hover:border-blue-400"
            />
          </div>
        }
      />

      <AiSectionBody
        state={state}
        visibleCount={items.length}
        layout="list"
        noSalesMessage={`No sales in the last ${SALES_WINDOW_DAYS} days, so there is nothing to analyse yet.`}
        emptyMessage="No sales alerts right now."
      >
        <ul className="flex flex-col gap-2.5">
          {items.map((item) => {
            const kind = KIND[item.kind];
            const Icon = kind.icon;
            return (
              // `relative` anchors the screen-reader label below. An
              // absolutely positioned element with no positioned ancestor is
              // placed against the window rather than the page's scroll area,
              // so this label, some 3,000px down, stretched the window itself:
              // it grew a second scrollbar, and scrolling it lifted the whole
              // app shell away to show empty space underneath.
              <li
                key={item.id}
                className="relative flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 "
              >
                <Icon
                  size={16}
                  className={`shrink-0 ${kind.className}`}
                  aria-hidden
                />
                {/* The icon's meaning, for anyone who cannot see its colour. */}
                <span className="sr-only">{kind.label}:</span>
                <p className="flex-1 text-[13px] text-gray-700">{item.text}</p>
                <DismissButton
                  label="this recommendation"
                  onClick={() => onDismiss(item.id)}
                  className="shrink-0"
                />
              </li>
            );
          })}
        </ul>
      </AiSectionBody>
    </section>
  );
}
