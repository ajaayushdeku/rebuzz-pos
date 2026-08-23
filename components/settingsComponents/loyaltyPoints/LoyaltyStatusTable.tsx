"use client";

import { Trophy, Edit3, Trash2 } from "lucide-react";
import { type LoyaltyStatus, pointRange } from "./loyaltyStatusConfig";
import TierBadge from "./TierBadge";

/**
 * The tier ladder. Rows arrive already sorted by threshold, so each one's
 * point range can be read off the next row's minimum.
 */
export default function LoyaltyStatusTable({
  statuses,
  editingId,
  onEdit,
  onDelete,
}: {
  /** Sorted ascending by `minPoints`. */
  statuses: LoyaltyStatus[];
  /** Row currently open in the modal, highlighted so the two stay connected. */
  editingId: string | null;
  onEdit: (status: LoyaltyStatus) => void;
  onDelete: (status: LoyaltyStatus) => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* Count header — the table gave no sense of how many tiers exist
          without counting the rows. */}
      <div className="flex items-center justify-between gap-2 border-b border-gray-200 px-4 py-3">
        <p className="text-sm font-semibold text-gray-900">Loyalty Tiers</p>
        <span className="text-xs font-medium tabular-nums text-gray-400">
          {statuses.length} {statuses.length === 1 ? "tier" : "tiers"}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-[11px] uppercase tracking-wider text-gray-400">
              <th className="w-10 px-4 py-3 text-left font-semibold">Lvl</th>
              <th className="px-4 py-3 text-left font-semibold">Status</th>
              <th className="px-4 py-3 text-center font-semibold">
                Point Range
              </th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {statuses.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10">
                  <div className="flex flex-col items-center text-center">
                    <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
                      <Trophy size={22} className="text-gray-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-500">
                      No loyalty tiers yet
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      Add one to start ranking customers.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              statuses.map((status, idx) => {
                const isEditing = editingId === status.id;

                return (
                  <tr
                    key={status.id}
                    className={`transition-colors ${
                      isEditing ? "bg-blue-50/60" : "hover:bg-gray-50"
                    }`}
                  >
                    <td className="px-4 py-3 text-xs font-semibold tabular-nums text-gray-300">
                      {idx + 1}
                    </td>
                    <td className="px-4 py-3">
                      <TierBadge
                        name={status.name}
                        color={status.color}
                        bgColor={status.bgColor}
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-sm font-medium tabular-nums text-gray-800">
                        {pointRange(status, statuses[idx + 1])}
                      </span>
                      <span className="ml-1 text-xs text-gray-400">pts</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onEdit(status)}
                          className={`rounded-md p-1.5 transition-colors ${
                            isEditing
                              ? "bg-blue-100 text-blue-600"
                              : "text-gray-400 hover:bg-blue-50 hover:text-blue-600"
                          }`}
                          title="Edit"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(status)}
                          className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
