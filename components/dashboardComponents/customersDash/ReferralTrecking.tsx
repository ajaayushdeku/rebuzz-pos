"use client";

import { ChartCard } from "../chartCard";
import LockDimFeactureOverlay from "@/components/LockDimFeactureOverlay";
import { Share2 } from "lucide-react";

type ReferralStatus = "completed" | "pending";

type Referral = {
  id: string;
  refId: string;
  referrer: string;
  referredCustomer: string;
  status: ReferralStatus;
  reward: string;
};

const REFERRALS: Referral[] = [
  {
    id: "1",
    refId: "REF-001",
    referrer: "Alice Smith",
    referredCustomer: "John Doe",
    status: "completed",
    reward: "$10 Credit",
  },
  {
    id: "2",
    refId: "REF-002",
    referrer: "Bob Jones",
    referredCustomer: "Sarah Connor",
    status: "pending",
    reward: "Free Coffee",
  },
];

const STATUS_STYLES = {
  completed:
    "bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-400/15 dark:border-emerald-400/25 dark:text-emerald-300",
  pending:
    "bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-400/15 dark:border-amber-400/25 dark:text-amber-300",
};

export default function ReferralTracking() {
  const completed = REFERRALS.filter((r) => r.status === "completed").length;
  const pending = REFERRALS.filter((r) => r.status === "pending").length;

  return (
    <ChartCard
      icon={Share2}
      // Violet, as before: Tailwind's violet-600 / violet-200 / violet-50.
      iconColor="#7c3aed"
      iconBorder="#ddd6fe"
      iconBg="#f5f3ff"
      title="Referral Tracking"
      subtitle="Track which customers bring in new customers via referrals"
      // Clipped so the lock overlay follows the card's rounded corners.
      className="overflow-hidden select-none"
    >
      {/* Lock overlay — a direct child of the card, so it covers the header
          as well as the table. */}
      <LockDimFeactureOverlay component_name="Referral Tracking" />

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-[#e8eaed] dark:border-white/10">
              <th className="pb-2.5 pt-1 text-left text-[11px] font-normal text-[#5f6368] dark:text-[#a9b4c7]">
                Ref ID
              </th>
              <th className="pb-2.5 pt-1 text-left text-[11px] font-normal text-[#5f6368] dark:text-[#a9b4c7]">
                Referrer
              </th>
              <th className="pb-2.5 pt-1 text-left text-[11px] font-normal text-[#5f6368] dark:text-[#a9b4c7]">
                Referred Customer
              </th>
              <th className="pb-2.5 pt-1 text-left text-[11px] font-normal text-[#5f6368] dark:text-[#a9b4c7]">
                Status
              </th>
              <th className="pb-2.5 pt-1 text-right text-[11px] font-normal text-[#5f6368] dark:text-[#a9b4c7]">
                Reward
              </th>
            </tr>
          </thead>

          <tbody>
            {REFERRALS.map((referral) => (
              <tr
                key={referral.id}
                className="border-b border-[#e8eaed] transition-colors last:border-0 hover:bg-[#f8f9fa] dark:border-white/10 dark:hover:bg-white/10"
              >
                <td className="py-3 text-xs tabular-nums text-[#9aa0a6] dark:text-[#9aa6bd]">
                  {referral.refId}
                </td>
                <td className="py-3 text-[13px] text-[#3c4043] dark:text-[#e8ecf4]">
                  {referral.referrer}
                </td>
                <td className="py-3 text-[13px] text-[#5f6368] dark:text-[#a9b4c7]">
                  {referral.referredCustomer}
                </td>
                <td className="py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-[11px] capitalize ${STATUS_STYLES[referral.status]}`}
                  >
                    {referral.status}
                  </span>
                </td>
                <td className="py-3 text-right text-[13px] font-medium text-violet-600 dark:text-violet-400">
                  {referral.reward}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="mt-4 rounded-xl border px-4 py-2.5 border-[#e3e3e3] dark:border-white/10">
        <p className="text-[11px] leading-relaxed text-[#5f6368] dark:text-[#a9b4c7]">
          <span className="text-[#3c4043] dark:text-[#e8ecf4]">
            {REFERRALS.length} active referrals
          </span>{" "}
          — {completed} completed, {pending} pending conversion. Total rewards
          issued:
          <span className="text-[#3c4043] dark:text-[#e8ecf4]">
            {" "}
            $10 Credit + Free Coffee
          </span>
          .
        </p>
      </div>
    </ChartCard>
  );
}
