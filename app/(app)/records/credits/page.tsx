"use client";

import { useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Wallet, HandCoins, Users, Loader2 } from "lucide-react";

// import { Spinner } from "@/components/ui/spinner";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";
import CreditsTable from "@/components/credit/CreditsTable";
import {
  fetchCreditsClient,
  fetchCreditsByStatus,
} from "@/services/apiCredit.client";

type TabKey = "credited" | "completed" | "archived";

export default function Page() {
  const { currency } = useCurrency();
  const [activeTab, setActiveTab] = useState<TabKey>("credited");
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const {
    data: credits = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["credits"],
    queryFn: fetchCreditsClient,
  });

  const {
    data: completedCredits = [],
    isLoading: completedLoading,
    error: completedError,
  } = useQuery({
    queryKey: ["credits", "completed"],
    queryFn: () => fetchCreditsByStatus("completed"),
  });

  const {
    data: archivedCredits = [],
    isLoading: archivedLoading,
    error: archivedError,
  } = useQuery({
    queryKey: ["credits", "archived"],
    queryFn: () => fetchCreditsByStatus("archived"),
  });

  const stats = useMemo(() => {
    const totalDue = credits.reduce((s, c) => s + (c.dueAmount ?? 0), 0);
    const totalValue = credits.reduce((s, c) => s + (c.grandTotal ?? 0), 0);
    return { count: credits.length, totalDue, totalValue };
  }, [credits]);

  if (isLoading)
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-blue-500" />
        <span className="ml-3 text-sm text-gray-500">Loading credits...</span>
      </div>
    );

  if (error)
    return (
      <div className="flex items-center justify-center w-screen h-screen text-2xl">
        {":( Error loading credits"}
      </div>
    );

  const statItems = [
    {
      label: "Total Credits",
      value: stats.count,
      icon: Users,
      iconColor: "text-blue-600",
      bgColor: "bg-blue-50",
      valueColor: "text-gray-900",
      format: "number" as const,
      subText: `${stats.count === 1 ? "Credit" : "Credits"} Total`,
    },
    {
      label: "Credit Value",
      value: stats.totalValue,
      icon: Wallet,
      iconColor: "text-violet-600",
      bgColor: "bg-violet-50",
      valueColor: "text-gray-900",
      format: "currency" as const,
      subText: "Total value of all credits",
    },
    {
      label: "Outstanding Due",
      value: stats.totalDue,
      icon: HandCoins,
      iconColor: "text-red-600",
      bgColor: "bg-red-50",
      valueColor: "text-red-700",
      format: "currency" as const,
      subText: "Total amount due",
    },
  ];

  const tabs: Array<{ key: TabKey; label: string; count: number | null }> = [
    { key: "credited", label: "Credited", count: credits.length },
    {
      key: "completed",
      label: "Completed",
      count: completedLoading ? null : completedCredits.length,
    },
    {
      key: "archived",
      label: "Archived",
      count: archivedLoading ? null : archivedCredits.length,
    },
  ];

  // Left/Right/Home/End move between tabs, per the WAI-ARIA tabs pattern.
  const handleTabKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const current = tabs.findIndex((t) => t.key === activeTab);
    let next: number | null = null;

    if (e.key === "ArrowRight") next = (current + 1) % tabs.length;
    if (e.key === "ArrowLeft") next = (current - 1 + tabs.length) % tabs.length;
    if (e.key === "Home") next = 0;
    if (e.key === "End") next = tabs.length - 1;
    if (next === null) return;

    e.preventDefault();
    setActiveTab(tabs[next].key);
    tabRefs.current[next]?.focus();
  };

  return (
    <div className="min-h-screen bg-50 px-6 py-8 md:px-10">
      <div className="w-full mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2 pb-4 border-b border-gray-200">
          <div>
            <h1 className="font-bold text-xl md:text-2xl truncate">Credits</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Invoices moved to credit and their outstanding dues
            </p>
          </div>
        </div>

        {/* Stats — always reflect all credits, regardless of the selected tab */}
        <div className="bg-white py-2 mb-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {statItems.map((item) => {
              const displayValue =
                item.format === "currency"
                  ? formatCurrencySymbol(
                      item.value,
                      currency.symbol,
                      currency.locale,
                    )
                  : item.value.toLocaleString();

              return (
                <div
                  key={item.label}
                  className="bg-white rounded-xl border border-gray-100 shadow-sm p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-400 font-medium">
                      {item.label}
                    </span>
                    <div
                      className={`w-7 h-7 rounded-lg ${item.bgColor} flex items-center justify-center shrink-0`}
                    >
                      <item.icon size={16} className={item.iconColor} />
                    </div>
                  </div>
                  <p
                    className={`text-lg font-bold truncate ${item.valueColor}`}
                  >
                    {displayValue}
                  </p>
                  {item.subText && (
                    <p className="text-[11px] text-gray-400 truncate">
                      {item.subText}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Tabs — the rule runs edge to edge and the pill sits on top of it */}
        <div className="relative flex justify-center mt-8">
          <span
            aria-hidden="true"
            className="absolute inset-x-0 top-1/2 h-px bg-gray-200"
          />
          <div
            role="tablist"
            aria-label="Credit status"
            onKeyDown={handleTabKeyDown}
            className="relative flex items-center gap-1 rounded-full bg-[#e4f2fe] p-1"
          >
            {tabs.map((tab, i) => {
              const selected = tab.key === activeTab;

              return (
                <button
                  key={tab.key}
                  ref={(el) => {
                    tabRefs.current[i] = el;
                  }}
                  type="button"
                  role="tab"
                  id={`credits-tab-${tab.key}`}
                  aria-selected={selected}
                  aria-controls={`credits-panel-${tab.key}`}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 rounded-full px-5 py-2 text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#e4f2fe] ${
                    selected
                      ? "bg-white font-bold text-blue-950 shadow-sm"
                      : "font-semibold text-blue-800 hover:text-blue-950"
                  }`}
                >
                  {tab.label}
                  <span
                    className="inline-flex min-w-6 items-center justify-center rounded-full px-2 py-0.5 text-xs font-bold ring-1 
                     bg-[#e4f2fe] text-blue-950 ring-blue-900"
                  >
                    {tab.count === null ? "–" : tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Panels */}
        <div
          role="tabpanel"
          id={`credits-panel-${activeTab}`}
          aria-labelledby={`credits-tab-${activeTab}`}
          tabIndex={0}
          className="focus-visible:outline-none"
        >
          {activeTab === "credited" && <CreditsTable credits={credits} />}

          {/* Completed — all actions except Record payment (they're paid) */}
          {activeTab === "completed" && (
            <CreditsTable
              credits={completedCredits}
              actionsMode="full"
              creditStatus="completed"
              // showStatusFilter={false}
              isLoading={completedLoading}
              error={completedError}
            />
          )}

          {/* Archived — no Actions column */}
          {activeTab === "archived" && (
            <CreditsTable
              credits={archivedCredits}
              actionsMode="none"
              creditStatus="archived"
              showStatusFilter={false}
              isLoading={archivedLoading}
              error={archivedError}
            />
          )}
        </div>
      </div>
    </div>
  );
}
