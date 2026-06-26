"use client";

import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import StaffStatBox, {
  StaffBoxProps,
} from "@/components/dashboardComponents/staffDash/StaffStatBox";

const ROLE_OPTIONS = [
  { value: "all", label: "All" },
  { value: "staff", label: "Staff" },
  { value: "basic", label: "Basic" },
];

export default function StaffBoxContainer({
  staffList,
}: {
  staffList: StaffBoxProps[];
}) {
  const [roleFilter, setRoleFilter] = useState("all");
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
    <div className="my-4 -mx-2 sm:mx-0">
      {/* Custom thin scrollbar styles */}
      <style jsx global>{`
        .scrollbar-custom {
          scrollbar-width: thin;
          scrollbar-color: #d1d5db transparent;
        }
        .scrollbar-custom::-webkit-scrollbar {
          height: 5px;
        }
        .scrollbar-custom::-webkit-scrollbar-track {
          background: transparent;
        }
        .scrollbar-custom::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 9999px;
        }
        .scrollbar-custom::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
      `}</style>

      {/* Filter bar: role buttons + search */}
      <div className="flex flex-row items-start sm:items-center justify-between gap-3 mb-4 px-2 sm:px-0">
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
            className="w-full h-9 pl-9 pr-3 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Role filter */}
        <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-1">
          {ROLE_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setRoleFilter(value)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                roleFilter === value
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {displayStaff.length === 0 ? (
        <div className="flex flex-col items-center py-8 text-gray-400 text-sm">
          <span className="font-medium">No staff data available</span>
          <p className="mt-1 text-xs text-gray-300">
            Try switching to a different date range or filter to see staff
            members and their performance.
          </p>
        </div>
      ) : (
        /* Responsive: 2-column grid on large screens, horizontal scroll on small/medium */
        <div className="lg:grid lg:grid-cols-2 lg:gap-3 flex gap-3 overflow-x-auto pb-3 px-2 sm:px-0 lg:overflow-visible scrollbar-custom">
          {displayStaff.map((staff, idx) => (
            <div
              key={staff.staffName}
              className="shrink-0 w-[85vw] sm:w-[360px] lg:w-auto lg:shrink"
            >
              <StaffStatBox {...staff} colorIndex={idx} />
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
