"use client";

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
  completed: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  pending: "bg-amber-100 text-amber-700 border border-amber-200",
};

export default function ReferralTracking() {
  const completed = REFERRALS.filter((r) => r.status === "completed").length;
  const pending = REFERRALS.filter((r) => r.status === "pending").length;

  return (
    <div className="relative bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <LockDimFeactureOverlay component_name="Referral Tracking" />

      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
            <Share2 size={15} className="text-violet-600" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900">
              Referral Tracking
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Track which customers bring in new customers via referrals
            </p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="pb-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                Ref ID
              </th>
              <th className="pb-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                Referrer
              </th>
              <th className="pb-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                Referred Customer
              </th>
              <th className="pb-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="pb-3 text-right text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                Reward
              </th>
            </tr>
          </thead>

          <tbody>
            {REFERRALS.map((referral) => (
              <tr
                key={referral.id}
                className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors"
              >
                <td className="py-3.5 text-xs font-mono text-gray-500">
                  {referral.refId}
                </td>
                <td className="py-3.5 text-xs font-semibold text-gray-900">
                  {referral.referrer}
                </td>
                <td className="py-3.5 text-xs text-gray-600">
                  {referral.referredCustomer}
                </td>
                <td className="py-3.5">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${STATUS_STYLES[referral.status]}`}
                  >
                    {referral.status}
                  </span>
                </td>
                <td className="py-3.5 text-right text-xs font-bold text-violet-600">
                  {referral.reward}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="mt-4 rounded-xl border border-violet-100 bg-violet-50 px-4 py-3.5">
        <p className="text-xs text-violet-700 leading-relaxed">
          <span className="font-bold">{REFERRALS.length} active referrals</span>{" "}
          — {completed} completed, {pending} pending conversion. Total rewards
          issued:
          <span className="font-semibold"> $10 Credit + Free Coffee</span>.
        </p>
      </div>
    </div>
  );
}
