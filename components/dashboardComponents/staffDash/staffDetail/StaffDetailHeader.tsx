"use client";

import { ArrowLeft, Crown, Hash, Mail, Phone, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { initials } from "@/lib/utils";
import { DateRangeFilter } from "@/components/dashboardComponents/staffDash/DateRangeFilter";
import type { DateRangeValue } from "@/components/dashboardComponents/staffDash/DateRangeFilter";
import { CHART_PALETTE } from "../../chartCard";

interface StaffDetailHeaderProps {
  employeeId: string;
  name: string;
  /** "staff", "admin" or the page's "Basic" default. */
  role?: string;
  phone?: string;
  email?: string;
  dateRange: DateRangeValue;
  onDateRangeChange: (range: DateRangeValue) => void;
  storageKey?: string;
}

/**
 * One flat colour per role, worn by both the chip and the initial circle, so
 * the role is readable from across the page: gold for an owner, rose for
 * staff, cyan for a basic account.
 */
const ROLE_STYLE: Record<
  string,
  { solid: string; glow: string; icon: typeof Crown }
> = {
  owner: { solid: "#fbc847", glow: "rgba(255, 186, 12, 0.4)", icon: Crown },
  admin: { solid: "#fbc847", glow: "rgba(255, 183, 0, 0.4)", icon: Crown },
  staff: { solid: "#e11d48", glow: "rgba(225,29,72,0.35)", icon: UserRound },
  basic: { solid: "#0891b2", glow: "rgba(8,145,178,0.35)", icon: UserRound },
};

/** Anything the API sends that isn't one of the known roles reads as basic. */
const DEFAULT_ROLE_STYLE = ROLE_STYLE.basic;

/** One line of the meta row — an icon and its value, muted. */
function Meta({
  icon: Icon,
  value,
  title,
}: {
  icon: typeof Phone;
  value: string;
  title?: string;
}) {
  return (
    <span
      className="flex items-center gap-1.5"
      style={{ color: CHART_PALETTE.subtitle }}
      title={title ?? value}
    >
      <Icon size={11} className="shrink-0" />
      <span className="truncate">{value}</span>
    </span>
  );
}

export default function StaffDetailHeader({
  employeeId,
  name,
  role,
  phone,
  email,
  dateRange,
  onDateRangeChange,
  storageKey,
}: StaffDetailHeaderProps) {
  const router = useRouter();
  const roleStyle = ROLE_STYLE[role?.toLowerCase() ?? ""] ?? DEFAULT_ROLE_STYLE;
  const RoleIcon = roleStyle.icon;

  return (
    <div className="mb-6 flex flex-col gap-4 rounded-2xl bg-white  sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <button
          onClick={() => router.push("/dashboard/employee")}
          aria-label="Back to employees"
          title="Back to employees"
          className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-[#dadce0] bg-white text-[#5f6368] transition-colors hover:bg-[#f8f9fa] hover:text-[#3c4043]"
        >
          <ArrowLeft size={16} />
        </button>

        {/* The initial circle: the role's flat colour, with the staff mark
            drawn over the initials. */}
        <div
          className="relative flex h-11 w-11 shrink-0 select-none items-center justify-center rounded-full text-sm font-semibold tracking-wide text-white"
          style={{
            backgroundColor: roleStyle.solid,
            boxShadow: `0 6px 14px -6px ${roleStyle.glow}`,
          }}
          title={name}
        >
          <UserRound
            aria-hidden
            size={30}
            strokeWidth={1.5}
            className="pointer-events-none absolute text-white/65"
          />
          <span>{initials(name || "Staff")}</span>
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1
              className="truncate  text-lg font-semibold tracking-tight md:text-2xl"
              style={{ color: CHART_PALETTE.title }}
            >
              {name || "Staff"}
            </h1>
            {role && (
              <span
                className="inline-flex shrink-0 items-center justify-center  gap-1 rounded-full px-2 py-[3px] text-[10px] font-semibold uppercase tracking-[0.08em] text-white"
                style={{
                  backgroundColor: roleStyle.solid,
                  boxShadow: `0 4px 10px -5px ${roleStyle.glow}`,
                }}
              >
                <RoleIcon size={10} className="shrink-0" />
                <p className="mt-0.5"> {role}</p>
              </span>
            )}
          </div>

          {/* Everything that identifies this person, on one muted line. */}
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
            <Meta
              icon={Hash}
              value={`${employeeId.slice(0, 8)}…`}
              title={`Employee ID: ${employeeId}`}
            />
            {phone && <Meta icon={Phone} value={phone} />}
            {email && <Meta icon={Mail} value={email} />}
          </div>
        </div>
      </div>

      <div className="shrink-0">
        <DateRangeFilter
          value={dateRange}
          onChange={onDateRangeChange}
          storageKey={storageKey}
        />
      </div>
    </div>
  );
}
