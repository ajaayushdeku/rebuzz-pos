"use client";

import ArchivedInvoicesTable from "@/components/invoice/ArchivedInvoicesTable";
import InvoiceHeader from "@/components/invoice/InvoiceHeader";
import InvoiceStats from "@/components/invoice/InvoiceStats";
import InvoiceTable from "@/components/invoice/InvoiceTable";
import { Spinner } from "@/components/ui/spinner";
import { fetchArchivedInvoicesClient } from "@/services/apiArchivedInvoice.client";
import { fetchInvoicesClient } from "@/services/apiInvoice.client";
import { useInvoiceStore } from "@/stores/invoiceStore";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

type TabKey = "invoices" | "archived";

export default function Page() {
  // zustand store to manage invoice state across the app. We fetch invoices here and update the store, so other components can access the data without refetching.
  const { setInvoices } = useInvoiceStore(); // `setInvoices` is used to update the store with fetched invoices

  const [activeTab, setActiveTab] = useState<TabKey>("invoices");
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  // useQuery from react-query to fetch invoices. It provides loading and error states, and the fetched data.
  const {
    isLoading,
    data: invoices = [],
    error,
  } = useQuery({
    queryKey: ["invoice"],
    queryFn: fetchInvoicesClient,
  });

  // useQuery to fetch archived invoices
  const { data: archivedInvoices = [], isLoading: archivedLoading } = useQuery({
    queryKey: ["archived-invoices"],
    queryFn: fetchArchivedInvoicesClient,
  });

  // useEffect to update the invoice store whenever new data is fetched. This ensures that the store always has the latest invoices, and any component that uses the store will re-render with the new data.
  useEffect(() => {
    if (invoices.length > 0) {
      setInvoices(invoices); // Update the invoice store with the fetched invoices. This allows other components that consume the store to access the latest invoice data without needing to fetch it again.
    }
  }, [invoices, setInvoices]);

  if (isLoading)
    return (
      <div className="flex items-center justify-center min-h-screen ">
        <Spinner className="size-8" />
      </div>
    );
  if (error)
    return (
      <div className="flex items-center justify-center w-screen h-screen text-2xl">
        {":( Error loading invoices"}
      </div>
    );

  const tabs: Array<{ key: TabKey; label: string; count: number | null }> = [
    { key: "invoices", label: "Invoices", count: invoices.length },
    {
      key: "archived",
      label: "Archived",
      count: archivedLoading ? null : archivedInvoices.length,
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
        <InvoiceHeader />

        {/* Stats stay put — they always reflect the full invoice list */}
        <InvoiceStats invoices={invoices} />

        {/* Tabs — the rule runs edge to edge and the pill sits on top of it */}
        <div className="relative flex justify-center">
          <span
            aria-hidden="true"
            className="absolute inset-x-0 top-1/2 h-px bg-gray-200"
          />
          <div
            role="tablist"
            aria-label="Invoice view"
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
                  id={`invoices-tab-${tab.key}`}
                  aria-selected={selected}
                  aria-controls={`invoices-panel-${tab.key}`}
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
          id={`invoices-panel-${activeTab}`}
          aria-labelledby={`invoices-tab-${activeTab}`}
          tabIndex={0}
          className="focus-visible:outline-none"
        >
          {activeTab === "invoices" && <InvoiceTable invoices={invoices} />}

          {activeTab === "archived" && (
            <ArchivedInvoicesTable
              invoices={archivedInvoices}
              isLoading={archivedLoading}
            />
          )}
        </div>
      </div>
    </div>
  );
}
