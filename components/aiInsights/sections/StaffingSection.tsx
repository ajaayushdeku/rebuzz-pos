"use client";

import {
  Award,
  Coffee,
  Gauge,
  TrendingDown,
  UserRoundCheck,
  Users,
  type LucideIcon,
} from "lucide-react";

import type { AiSectionState } from "@/hooks/useAiSection";
import { hourLabel } from "@/lib/ai-insights/sections/hourPlaybook";
import {
  STAFFING_WINDOW_DAYS,
  type StaffingInsight,
  type StaffingKind,
} from "@/lib/ai-insights/sections/staffing";
import {
  AiSectionBody,
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
  type Metric,
} from "../parts";

/** Each kind of card: its label, icon and accent. */
const KIND: Record<
  StaffingKind,
  { label: string; icon: LucideIcon; accent: AccentName }
> = {
  "stretched-hour": {
    label: "Stretched at the till",
    icon: Gauge,
    accent: "red",
  },
  "spare-hour": { label: "Spare hands", icon: Coffee, accent: "amber" },
  "key-person": {
    label: "Relied on",
    icon: UserRoundCheck,
    accent: "amber",
  },
  "top-performer": { label: "Top order-taker", icon: Award, accent: "emerald" },
  "low-spend": { label: "Smaller orders", icon: TrendingDown, accent: "blue" },
};

/** The figures for each kind of card, all worked out by the app. */
function useMetrics(item: StaffingInsight): Metric[] {
  const money = useMoney();
  const h = item.hour;
  const p = item.person;

  if (h) {
    return [
      {
        label: "Orders / day",
        value: String(h.ordersPerDay),
        note: `up to ${h.busiestDay} in one day`,
      },
      {
        label: "At the till",
        value: `${h.staffTaking} ${h.staffTaking === 1 ? "person" : "people"}`,
        note: h.mainTakerName
          ? `mostly ${h.mainTakerName.split(" ")[0]}`
          : undefined,
      },
      {
        label: "Per person",
        value: String(h.ordersPerPerson),
        valueClassName:
          item.kind === "stretched-hour" ? "text-red-600" : undefined,
        note: "orders",
      },
    ];
  }
  if (p) {
    const typical = p.typicalOrder === null ? "—" : money(p.typicalOrder);
    return [
      {
        label: "Orders",
        value: String(p.orders),
        note: `${p.sharePct}% of all`,
      },
      {
        label: "Per order",
        value: typical,
        valueClassName: item.kind === "low-spend" ? "text-blue-700" : undefined,
        note:
          item.teamTypicalOrder !== null
            ? `team ${money(item.teamTypicalOrder)}`
            : undefined,
      },
      {
        label: "Busiest hour",
        value: p.busiestHour === null ? "—" : hourLabel(p.busiestHour),
        note: `${p.ordersPerActiveHour} orders an hour`,
      },
    ];
  }
  return [];
}

function StaffingCard({
  item,
  onDismiss,
}: {
  item: StaffingInsight;
  onDismiss: (id: string) => void;
}) {
  const kind = KIND[item.kind];
  const metrics = useMetrics(item);
  const person = item.person;
  const subject = item.hour ? item.hour.label : (person?.name ?? "");

  return (
    <InsightCard
      accent={kind.accent}
      lead={
        item.hour ? (
          <span
            className={`flex h-10 shrink-0 items-center rounded-lg px-2.5 text-[14px] font-bold ${
              kind.accent === "red"
                ? "bg-red-50 text-red-600"
                : "bg-amber-50 text-amber-600"
            }`}
          >
            {item.hour.label}
          </span>
        ) : (
          <LeadTile accent={kind.accent}>
            <span className="text-sm font-bold">
              {(person?.name ?? "?").charAt(0).toUpperCase()}
            </span>
          </LeadTile>
        )
      }
      label={
        <>
          <kind.icon size={11} aria-hidden />
          {kind.label}
          {person && <LabelNote>{person.name}</LabelNote>}
        </>
      }
      title={item.title}
      onDismiss={() => onDismiss(item.id)}
      dismissLabel={`${subject} ${item.title}`}
      metrics={metrics}
      // A person on the staff list has their own page; an hour, or the
      // owner, who is not on the list, goes to the staff overview.
      footer={
        <CardAction
          href={
            person?.onStaffList
              ? `/records/employee/${person.id}`
              : "/dashboard/employee"
          }
          primary={false}
        >
          {person?.onStaffList
            ? "View staff details"
            : "View staff performance"}
        </CardAction>
      }
    >
      <p className="text-[13px] leading-relaxed text-gray-600">
        {item.description}
      </p>
      <div className="mt-auto">
        <Recommendation>{item.tip}</Recommendation>
      </div>
    </InsightCard>
  );
}

export default function StaffingSection({
  items,
  state,
  onDismiss,
}: {
  /** The cards still on the page, after dismissals. */
  items: StaffingInsight[];
  state: AiSectionState<StaffingInsight>;
  onDismiss: (id: string) => void;
}) {
  return (
    <section>
      <SectionHeader
        icon={Users}
        iconClassName="bg-amber-50 text-amber-600"
        title="Staffing Recommendations"
        // Said up front: the POS only records who rang up each bill, so this
        // is about the till, not the whole floor or the kitchen.
        subtitle={`Who takes orders at the till, hour by hour, over the last ${STAFFING_WINDOW_DAYS / 7} weeks`}
        actions={
          <div className="flex flex-row w-full md:w-fit items-end justify-end absolute md:relative top-2">
            <SectionRefreshButton
              state={state}
              textClassName="text-amber-700 hover:bg-amber-100 border-amber-300 hover:border-amber-400"
            />
          </div>
        }
      />

      <AiSectionBody
        state={state}
        visibleCount={items.length}
        layout="cards"
        noSalesMessage={`Not enough orders in the last ${STAFFING_WINDOW_DAYS / 7} weeks to read who takes them. It needs at least 20 orders over 7 days.`}
        nothingFlaggedMessage="Orders are spread evenly across your team. Nothing to change right now."
        emptyMessage="No staffing changes suggested right now."
      >
        <CardGrid>
          {items.map((item) => (
            <StaffingCard key={item.id} item={item} onDismiss={onDismiss} />
          ))}
        </CardGrid>
      </AiSectionBody>
    </section>
  );
}
