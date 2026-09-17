"use client";

import { Coffee, HeartHandshake, Lightbulb, Send } from "lucide-react";

import type {
  RetentionInsight,
  RetentionStatus,
} from "@/lib/mockData/mock-ai-insights";
import {
  ActionButton,
  Card,
  CardGrid,
  CardHeader,
  CardLabel,
  Chip,
  comingSoon,
  DismissButton,
  EmptySection,
  Fact,
  Facts,
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
        sample
        subtitle="Regulars going quiet, and how to win them back"
        actions={
          <div className="flex flex-row w-full md:w-fit items-end justify-end absolute md:relative top-2">
            <GenerateMoreButton
              textClassName="text-pink-700 hover:bg-pink-100 border-pink-300 hover:border-pink-400"
              onClick={onGenerate}
            />
          </div>
        }
      />

      {items.length === 0 ? (
        <EmptySection message="No regulars going quiet right now." />
      ) : (
        <CardGrid>
          {items.map((item) => {
            const tone = STATUS[item.status];
            return (
              <Card key={item.id}>
                <DismissButton
                  label={item.name}
                  onClick={() => onDismiss(item.id)}
                />

                <CardHeader
                  lead={
                    <span
                      className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${tone.avatar}`}
                      aria-hidden
                    >
                      {item.name.charAt(0).toUpperCase()}
                    </span>
                  }
                  title={item.name}
                >
                  <Chip className={tone.pill}>{item.status}</Chip>
                  <span className="text-[11px] text-gray-400">
                    {item.profile}
                  </span>
                </CardHeader>

                <Facts>
                  <Fact label="Last visit">{item.daysSinceVisit} days ago</Fact>
                  <Fact label="Spend per visit">
                    {money(item.spendPerVisit)}
                  </Fact>
                </Facts>

                <div>
                  <CardLabel icon={Coffee}>Usually orders</CardLabel>
                  <p className="text-[13px] font-semibold text-gray-900">
                    {item.usualOrder}
                  </p>
                </div>

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
