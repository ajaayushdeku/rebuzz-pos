"use client";

import {
  ArrowLeft,
  Crown,
  ShieldCheck,
  Hash,
  Mail,
  Phone,
  UserRound,
  UserRoundCog,
} from "lucide-react";
import { useRouter } from "next/navigation";
// import { initials } from "@/lib/utils";
import { DateRangeFilter } from "@/components/dashboardComponents/staffDash/DateRangeFilter";
import type { DateRangeValue } from "@/components/dashboardComponents/staffDash/DateRangeFilter";

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
  /**
   * The staff record is still in flight, so the identity half of the header
   * stands in as placeholders. Pass it as `loading && !user`, not the page's
   * `loading` alone: that flag goes true again on every date-range change, and
   * a name already on screen should not fall back to a grey box.
   */
  loading?: boolean;
}

/**
 * One flat colour per role, worn by both the chip and the initial circle, so
 * the role is readable from across the page: gold for an owner, rose for
 * staff, cyan for a basic account.
 */
const ROLE_STYLE: Record<
  string,
  {
    solid: string;
    darkSolid: string;
    glow: string;
    icon: typeof Crown;
  }
> = {
  owner: {
    solid: "#fbc847",
    darkSolid: "#8A6410",
    glow: "rgba(255, 186, 12, 0.4)",
    icon: Crown,
  },
  admin: {
    solid: "#00A63E",
    darkSolid: "#166534",
    glow: "rgba(0, 255, 94, 0.4)",
    icon: ShieldCheck,
  },
  staff: {
    solid: "#e11d48",
    darkSolid: "#9F1239",
    glow: "rgba(225,29,72,0.35)",
    icon: UserRound,
  },
  basic: {
    solid: "#0891b2",
    darkSolid: "#155E75",
    glow: "rgba(8,145,178,0.35)",
    icon: UserRoundCog,
  },
};

const ROLE_BADGE_CLASS: Record<string, string> = {
  owner:
    "bg-amber-500 text-white dark:bg-amber-400/15 dark:text-amber-300 dark:border dark:border-amber-400/30",
  admin:
    "bg-green-600 text-white dark:bg-green-300/10 dark:text-green-300 dark:border dark:border-green-400/30",
  staff:
    "bg-rose-600 text-white dark:bg-rose-400/15 dark:text-rose-300 dark:border dark:border-rose-400/30",
  basic:
    "bg-cyan-600 text-white dark:bg-cyan-400/15 dark:text-cyan-300 dark:border dark:border-cyan-400/30",
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
      className="flex items-center gap-1.5 text-[#9aa0a6] dark:text-[#9aa6bd]"
      title={title ?? value}
    >
      <Icon size={11} className="shrink-0" />
      <span className="truncate">{value}</span>
    </span>
  );
}

/**
 * The identity block while the staff record loads.
 *
 * Only this half of the header is replaced. The back button and the date
 * filter work without the record, and the filter in particular has to stay
 * live: it is what re-triggers the page's fetch, so greying it out would make
 * the control disappear at the moment it was used.
 *
 * The block sizes are the real ones — `h-7 md:h-8` is the `text-lg
 * md:text-2xl` line box, `h-6` the role chip's, `h-4` a meta line's — so the
 * header does not resettle when the name lands.
 */
function IdentitySkeleton() {
  return (
    <div className="mb-6 flex  gap-4 rounded-2xl bg-white dark:bg-[#0F1420]  flex-row items-center justify-between">
      {" "}
      <div className="flex min-w-0 items-center gap-3">
        <div className="hidden sm:block w-9 h-9 rounded-lg bg-gray-100 shadow-sm shrink-0 dark:bg-white/10" />

        <div className="hidden h-11 w-11 shrink-0 animate-pulse rounded-full bg-gray-100 sm:block dark:bg-white/10" />

        <div className="min-w-0 animate-pulse">
          <div className="flex items-center gap-2">
            <div className="h-7 w-32 rounded bg-gray-100 sm:w-44 md:h-8 dark:bg-white/10" />
            <div className="h-6 w-16 shrink-0 rounded-full bg-gray-100 dark:bg-white/10" />
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
            <div className="h-4 w-20 rounded bg-gray-100 dark:bg-white/10" />
            <div className="h-4 w-24 rounded bg-gray-100 dark:bg-white/10" />
            <div className="h-4 w-28 rounded bg-gray-100 dark:bg-white/10" />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="h-9 w-10 sm:w-45 bg-gray-100 rounded-md dark:bg-white/10" />
      </div>
    </div>
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
  loading = false,
}: StaffDetailHeaderProps) {
  const router = useRouter();
  const roleStyle = ROLE_STYLE[role?.toLowerCase() ?? ""] ?? DEFAULT_ROLE_STYLE;
  const RoleIcon = roleStyle.icon;

  return (
    <>
      {loading ? (
        <IdentitySkeleton />
      ) : (
        <div className="mb-6 flex  gap-4 rounded-2xl bg-white dark:bg-[#0F1420]  flex-row items-center justify-between">
          <div className="flex min-w-0 items-center gap-3 ">
            <button
              onClick={() => router.push("/dashboard/employee")}
              aria-label="Back to employees"
              title="Back to employees"
              className="hidden sm:flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-[#dadce0] bg-white dark:bg-white/5 text-[#5f6368] transition-colors hover:bg-[#f8f9fa] hover:text-[#3c4043] dark:border-white/15 dark:text-[#a9b4c7] dark:hover:bg-white/10 dark:hover:text-[#e8ecf4]"
            >
              <ArrowLeft size={16} />
            </button>

            {role && (
              <div
                className={`hidden sm:flex relative h-11 w-11 shrink-0 select-none items-center justify-center rounded-full text-sm font-semibold tracking-wide text-white  ${
                  ROLE_BADGE_CLASS[role.toLowerCase()] ?? ROLE_BADGE_CLASS.basic
                }`}
                // style={{
                //   backgroundColor: roleStyle.solid,
                //   boxShadow: `0 6px 14px -6px ${roleStyle.glow}`,
                // }}
                title={name}
              >
                <RoleIcon
                  aria-hidden
                  size={25}
                  strokeWidth={2}
                  className="pointer-events-none absolute "
                />
                {/* <span className="text-gray-900 z-100">
              {initials(name || "Staff")}
            </span> */}
              </div>
            )}

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="truncate  text-lg font-semibold tracking-tight md:text-2xl text-[#3c4043] dark:text-[#e8ecf4]">
                  {name || "Staff"}
                </h1>
                {role && (
                  <span
                    className={`inline-flex shrink-0 items-center justify-center gap-1 rounded-full border border-transparent px-2 py-[2.5px] text-[10px] font-semibold uppercase tracking-[0.08em] ${
                      ROLE_BADGE_CLASS[role.toLowerCase()] ??
                      ROLE_BADGE_CLASS.basic
                    }`}
                  >
                    <RoleIcon size={12} className="shrink-0" />
                    <p className="mt-0.5">{role}</p>
                  </span>
                )}
              </div>

              {/* Everything that identifies this person, on one muted line. */}
              <div className="mt-1 flex flex-wrap w-[90%] sm:w-full items-center gap-x-3 gap-y-1 text-[11px]">
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
      )}
    </>
  );
}
