"use client";

import { ArrowDownRight, ArrowUpRight, BadgePercent } from "lucide-react";

import type { PricingOpportunity } from "@/lib/mockData/mock-ai-insights";
import {
  ActionButton,
  Card,
  CardGrid,
  comingSoon,
  DismissButton,
  EmptySection,
  GenerateMoreButton,
  SectionHeader,
  useMoney,
} from "../parts";

export default function PricingSection({
  items,
  onDismiss,
  onGenerate,
}: {
  items: PricingOpportunity[];
  onDismiss: (id: string) => void;
  onGenerate: () => void;
}) {
  const money = useMoney();

  return (
    <section>
      <SectionHeader
        icon={BadgePercent}
        iconClassName="bg-emerald-50 text-emerald-600"
        title="Pricing Opportunities"
        subtitle="Price moves suggested from demand sensitivity"
        actions={
          <GenerateMoreButton
            textClassName="text-emerald-700"
            onClick={onGenerate}
          />
        }
      />

      {items.length === 0 ? (
        <EmptySection message="No price changes suggested right now." />
      ) : (
        <CardGrid>
          {items.map((item) => {
            // A cut is as legitimate a suggestion as a rise — Cold Brew gains
            // by getting cheaper — so the direction gets its own colour
            // rather than both reading as the same green "win".
            const raise = item.suggestedPrice > item.currentPrice;
            const Arrow = raise ? ArrowUpRight : ArrowDownRight;
            const direction = raise ? "text-emerald-600" : "text-blue-600";

            return (
              <Card key={item.id} className="gap-4">
                <DismissButton
                  label={item.name}
                  onClick={() => onDismiss(item.id)}
                />

                <div className="flex items-start gap-3 pr-6">
                  <span className="text-2xl leading-none" aria-hidden>
                    {item.icon}
                  </span>
                  <div>
                    <h3 className="text-[14px] font-semibold text-gray-900">
                      {item.name}
                    </h3>
                    <p className="mt-1 flex items-center gap-2 font-mono text-[13px]">
                      <span className="text-gray-400 line-through">
                        {money(item.currentPrice)}
                      </span>
                      <Arrow size={14} className={direction} aria-hidden />
                      <span className={`font-semibold ${direction}`}>
                        {money(item.suggestedPrice)}
                      </span>
                      <span className="sr-only">
                        {raise ? "suggested increase" : "suggested decrease"}
                      </span>
                    </p>
                  </div>
                </div>

                <p className="text-[13px] leading-relaxed text-gray-600">
                  {item.description}
                </p>

                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                    +{money(item.monthlyUplift)}/mo
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                    {item.confidence}% confident
                  </span>
                </div>

                <ActionButton
                  tone="green"
                  onClick={() =>
                    comingSoon(`Changing the price of ${item.name}`)
                  }
                >
                  Apply new price
                </ActionButton>
              </Card>
            );
          })}
        </CardGrid>
      )}
    </section>
  );
}
