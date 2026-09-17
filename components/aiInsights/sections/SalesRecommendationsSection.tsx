"use client";

import { CircleCheck, Info, TrendingUp, TriangleAlert } from "lucide-react";

import type {
  RecommendationKind,
  SalesRecommendation,
} from "@/lib/mockData/mock-ai-insights";
import {
  DismissButton,
  EmptySection,
  GenerateMoreButton,
  SectionHeader,
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
  onDismiss,
  onGenerate,
}: {
  items: SalesRecommendation[];
  onDismiss: (id: string) => void;
  onGenerate: () => void;
}) {
  return (
    <section>
      <SectionHeader
        icon={TrendingUp}
        iconClassName="bg-blue-50 text-blue-600"
        title="Sales Recommendations"
        subtitle="Automated performance alerts"
        actions={
          <GenerateMoreButton
            textClassName="text-blue-600"
            onClick={onGenerate}
          />
        }
      />

      {items.length === 0 ? (
        <EmptySection message="No sales alerts right now." />
      ) : (
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
                className="relative flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm"
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
      )}
    </section>
  );
}
