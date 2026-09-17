"use client";

import { Lightbulb, RefreshCw, TriangleAlert } from "lucide-react";

import type { SlowItemInsight } from "@/lib/mockData/mock-ai-insights";
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
} from "../parts";

/**
 * A falling number and a pattern are different kinds of signal, so they look
 * different: "-27%" is a warning in red, "Morning only" is an observation in a
 * softer rose.
 */
const isChange = (signal: string) => /^[+-]?\d/.test(signal);

export default function SlowItemsSection({
  items,
  onDismiss,
  onGenerate,
}: {
  items: SlowItemInsight[];
  onDismiss: (id: string) => void;
  onGenerate: () => void;
}) {
  return (
    <section>
      <SectionHeader
        icon={TriangleAlert}
        iconClassName="bg-red-50 text-red-500"
        title="Slow Item Insights"
        subtitle="Fixes for underperforming items"
        actions={
          <GenerateMoreButton
            icon={RefreshCw}
            textClassName="text-red-600"
            onClick={onGenerate}
          />
        }
      />

      {items.length === 0 ? (
        <EmptySection message="No slow items flagged right now." />
      ) : (
        <CardGrid>
          {items.map((item) => (
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
                  <p className="mt-1 flex items-center gap-2 text-[11px]">
                    <span
                      className={`rounded px-1.5 py-0.5 font-bold ${
                        isChange(item.signal)
                          ? "bg-red-50 text-red-600"
                          : "bg-rose-50 text-rose-600"
                      }`}
                    >
                      {item.signal}
                    </span>
                    <span className="text-gray-400">{item.context}</span>
                  </p>
                </div>
              </div>

              <p className="text-[13px] leading-relaxed text-gray-600">
                {item.description}
              </p>

              <TipBox icon={Lightbulb}>{item.tip}</TipBox>

              <ActionButton
                tone={item.tone}
                onClick={() => comingSoon(item.action)}
              >
                {item.action}
              </ActionButton>
            </Card>
          ))}
        </CardGrid>
      )}
    </section>
  );
}
