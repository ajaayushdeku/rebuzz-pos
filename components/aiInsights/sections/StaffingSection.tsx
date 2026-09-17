"use client";

import { Users } from "lucide-react";

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
        subtitle="Floor coverage guidance"
        actions={
          <div className="flex flex-row w-full md:w-fit items-end justify-end absolute md:relative top-2">
            <GenerateMoreButton
              textClassName="text-amber-700"
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
              <p className="pr-6 text-[13px] leading-relaxed text-gray-700">
                <span className="font-semibold text-gray-900">
                  {item.label}
                </span>{" "}
                {item.text}
              </p>
            </Card>
          ))}
        </CardGrid>
      )}
    </section>
  );
}
