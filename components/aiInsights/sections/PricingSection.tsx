"use client";

import { ArrowDownRight, ArrowUpRight, BadgePercent } from "lucide-react";

import type { PricingOpportunity } from "@/lib/mockData/mock-ai-insights";
import {
  ActionButton,
  Card,
  CardGrid,
  CardHeader,
  Chip,
  comingSoon,
  DismissButton,
  EmojiTile,
  EmptySection,
  Fact,
  Facts,
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
        sample
        subtitle="Price moves suggested from demand sensitivity"
        actions={
          <div className="flex flex-row w-full md:w-fit items-end justify-end absolute md:relative top-2">
            <GenerateMoreButton
              textClassName="text-emerald-700 hover:bg-emerald-100 border-emerald-300 hover:border-emerald-400"
              onClick={onGenerate}
            />
          </div>
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
              <Card key={item.id}>
                <DismissButton
                  label={item.name}
                  onClick={() => onDismiss(item.id)}
                />

                <CardHeader
                  lead={<EmojiTile>{item.icon}</EmojiTile>}
                  title={item.name}
                >
                  <Chip
                    className={
                      raise
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-blue-50 text-blue-700"
                    }
                  >
                    <Arrow size={11} aria-hidden />
                    {raise ? "Raise price" : "Lower price"}
                  </Chip>
                </CardHeader>

                <Facts>
                  <Fact label="Now" valueClassName="text-gray-400 line-through">
                    {money(item.currentPrice)}
                  </Fact>
                  <Fact label="Suggested" valueClassName={direction}>
                    {money(item.suggestedPrice)}
                  </Fact>
                </Facts>

                <p className="text-[13px] leading-relaxed text-gray-600">
                  {item.description}
                </p>

                <div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-3">
                  <Chip className="bg-emerald-50 text-emerald-700">
                    +{money(item.monthlyUplift)}/mo
                  </Chip>
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
