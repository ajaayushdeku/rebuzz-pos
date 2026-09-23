"use client";

import { useState, useMemo } from "react";
import { Search, User, UserCog, Users } from "lucide-react";
import StaffStatBox, {
  StaffBoxProps,
} from "@/components/dashboardComponents/staffDash/StaffStatBox";
import RangeBadge from "@/components/ui/RangeBadge";
import SegmentedControl from "@/components/ui/SegmentedControl";

const ROLE_OPTIONS = [
  { value: "all", label: "All", icon: Users },
  { value: "staff", label: "Staff", icon: User },
  { value: "basic", label: "Basic", icon: UserCog },
] as const;

type RoleFilter = (typeof ROLE_OPTIONS)[number]["value"];

export default function StaffBoxContainer({
  staffList,
}: {
  staffList: StaffBoxProps[];
}) {
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredList = useMemo(() => {
    let list = staffList;

    // Role filter
    if (roleFilter !== "all") {
      list = list.filter((staff) => {
        const resolvedRole = staff.role ?? resolveRole(staff.staffPosition);
        return resolvedRole.toLowerCase() === roleFilter.toLowerCase();
      });
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      list = list.filter((staff) =>
        staff.staffName.toLowerCase().includes(query),
      );
    }

    return list;
  }, [staffList, roleFilter, searchQuery]);

  const displayStaff = filteredList;

  return (
    <div className="mt-4 -mx-2 sm:mx-0">
      {/* Custom thin scrollbar styles */}
      <style jsx global>{`
        .scrollbar-custom {
          scrollbar-width: none;
        }
        .scrollbar-custom::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      {/* Filter bar: role buttons + search */}
      <div className="flex flex-row items-start sm:items-center justify-between gap-3 mb-4 mt-6 px-2 sm:px-0">
        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search employee..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 w-full rounded-lg border border-[#dadce0] bg-white py-5 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Role filter */}
        <div className="relative flex  items-center  gap-2">
          <RangeBadge variant="pill" className="absolute top-[-30px] right-0" />{" "}
          <SegmentedControl
            label="Role:"
            accent="blue"
            options={ROLE_OPTIONS}
            value={roleFilter}
            onChange={setRoleFilter}
          />
        </div>
      </div>

      {displayStaff.length === 0 ? (
        <div className="flex flex-col items-center py-8 text-center">
          <span className="text-sm text-[#3c4043]">
            No staff data available
          </span>
          <p className="mt-1 max-w-sm text-xs text-[#9aa0a6]">
            Try switching to a different date range or filter to see staff
            members and their performance.
          </p>
        </div>
      ) : (
        /* Responsive: 2-column grid on large screens, horizontal scroll on small/medium */
        <div className="lg:grid lg:grid-cols-3 lg:gap-3 flex gap-3 overflow-x-auto px-2 sm:px-0 lg:overflow-visible scrollbar-custom">
          {displayStaff.map((staff) => (
            <div
              // staffId, not staffName — two people can share a name, and a
              // name key would collide and drop a card.
              key={staff.staffId}
              className="shrink-0 w-[85vw] sm:w-[360px] lg:w-auto lg:shrink"
            >
              <StaffStatBox {...staff} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Normalise the raw position string to a known role key.
 */
function resolveRole(
  position: string | undefined,
): "Owner" | "Staff" | "Basic" {
  if (!position) return "Basic";
  const p = position.toLowerCase().trim();
  if (p === "owner" || p === "admin") return "Owner";
  if (p === "staff") return "Staff";
  return "Basic";
}
