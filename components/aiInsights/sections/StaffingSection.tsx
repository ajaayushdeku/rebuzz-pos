"use client";

import { UserRoundCog, Users } from "lucide-react";

import type { StaffingInsight } from "@/lib/mockData/mock-ai-insights";
import {
  Card,
  CardGrid,
  DismissButton,
  EmptySection,
  GenerateMoreButton,
  SectionHeader,
} from "../parts";

export default function StaffingSection({
  items,
  onDismiss,
  onGenerate,
}: {
  items: StaffingInsight[];
  onDismiss: (id: string) => void;
  onGenerate: () => void;
}) {
  return (
    <section>
      <SectionHeader
        icon={Users}
        iconClassName="bg-amber-50 text-amber-600"
        title="Staffing Recommendations"
        sample
        subtitle="Floor coverage guidance"
        actions={
          <div className="flex flex-row w-full md:w-fit items-end justify-end absolute md:relative top-2">
            <GenerateMoreButton
              textClassName="text-amber-700 hover:bg-amber-100 border-amber-300 hover:border-amber-400"
              onClick={onGenerate}
            />
          </div>
        }
      />

      {items.length === 0 ? (
        <EmptySection message="No staffing changes suggested right now." />
      ) : (
        <CardGrid>
          {items.map((item) => (
            <Card key={item.id}>
              <DismissButton
                label={item.label}
                onClick={() => onDismiss(item.id)}
              />
              {/* The label was the first words of the sentence; on its own
                  line it reads as a heading, and the advice under it has room. */}
              <div className="flex items-start gap-3 pr-8">
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600"
                  aria-hidden
                >
                  <UserRoundCog size={16} />
                </span>
                <div className="min-w-0">
                  <h3 className="text-[14px] font-semibold leading-snug text-gray-900">
                    {item.label}
                  </h3>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-gray-600">
                    {item.text}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </CardGrid>
      )}
    </section>
  );
}
