"use client";

import { HeartHandshake, Lightbulb, Send } from "lucide-react";

import type {
  RetentionInsight,
  RetentionStatus,
} from "@/lib/mockData/mock-ai-insights";
import {
  ActionButton,
  Card,
  CardGrid,
  comingSoon,
  DismissButton,
  EmptySection,
  GenerateMoreButton,
  SectionHeader,
  TipBox,
  useMoney,
} from "../parts";

/** One colour for how far gone a customer is, used on the avatar and the pill. */
const STATUS: Record<RetentionStatus, { avatar: string; pill: string }> = {
  "At risk": {
    avatar: "bg-red-50 text-red-600",
    pill: "bg-red-50 text-red-600",
  },
  "Cooling off": {
    avatar: "bg-amber-50 text-amber-700",
    pill: "bg-amber-50 text-amber-700",
  },
};

export default function CustomerRetentionSection({
  items,
  onDismiss,
  onGenerate,
}: {
  items: RetentionInsight[];
  onDismiss: (id: string) => void;
  onGenerate: () => void;
}) {
  const money = useMoney();

  return (
    <section>
      <SectionHeader
        icon={HeartHandshake}
        iconClassName="bg-pink-50 text-pink-600"
        title="Customer Retention Radar"
        subtitle="Regulars going quiet, and how to win them back"
        actions={
          <GenerateMoreButton
            textClassName="text-pink-600"
            onClick={onGenerate}
          />
        }
      />

      {items.length === 0 ? (
        <EmptySection message="No regulars going quiet right now." />
      ) : (
        <CardGrid>
          {items.map((item) => {
            const tone = STATUS[item.status];
            return (
              <Card key={item.id} className="gap-3">
                <DismissButton
                  label={item.name}
                  onClick={() => onDismiss(item.id)}
                />

                <div className="flex items-center gap-3 pr-6">
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${tone.avatar}`}
                    aria-hidden
                  >
                    {item.name.charAt(0).toUpperCase()}
                  </span>
                  <div>
                    <h3 className="text-[14px] font-semibold text-gray-900">
                      {item.name}
                    </h3>
                    <p className="text-[11px] text-gray-400">{item.profile}</p>
                  </div>
                </div>

                <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-gray-500">
                  <span
                    className={`rounded px-1.5 py-0.5 font-bold ${tone.pill}`}
                  >
                    {item.status}
                  </span>
                  <span>
                    Last visit {item.daysSinceVisit} days ago ·{" "}
                    {money(item.spendPerVisit)}
                    /visit
                  </span>
                </p>

                <p className="text-[13px] text-gray-600">
                  Usually orders:{" "}
                  <span className="font-semibold text-gray-900">
                    {item.usualOrder}
                  </span>
                </p>

                <TipBox icon={Lightbulb}>{item.tip}</TipBox>

                <ActionButton
                  tone="pink"
                  icon={Send}
                  onClick={() => comingSoon("Sending win-back offers")}
                >
                  Send win-back offer
                </ActionButton>
              </Card>
            );
          })}
        </CardGrid>
      )}
    </section>
  );
}
