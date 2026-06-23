"use client";
import React, { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

import { useInvoiceStore } from "@/stores/invoiceStore";

import { fetchInvoicesClient } from "@/services/apiInvoice.client";
import { fetchArchivedInvoicesClient } from "@/services/apiArchivedInvoice.client";

import { Spinner } from "@/components/ui/spinner";
import InvoiceHeader from "@/components/invoice/InvoiceHeader";
import InvoiceStats from "@/components/invoice/InvoiceStats";
import InvoiceTable from "@/components/invoice/InvoiceTable";
import ArchivedInvoicesTable from "@/components/invoice/ArchivedInvoicesTable";

export default function Page() {
  // zustand store to manage invoice state across the app. We fetch invoices here and update the store, so other components can access the data without refetching.
  const { setInvoices } = useInvoiceStore(); // `setInvoices` is used to update the store with fetched invoices

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

  console.log("Invoices:", invoices);
  console.log("Archived Invoices:", archivedInvoices);

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

  return (
    <div className="min-h-screen bg-50 px-6 py-8 md:px-10">
      <div className="max-w-7xl mx-auto space-y-8">
        <InvoiceHeader />
        <InvoiceStats invoices={invoices} />
        <InvoiceTable invoices={invoices} />
        <ArchivedInvoicesTable
          invoices={archivedInvoices}
          isLoading={archivedLoading}
        />
      </div>
    </div>
  );
}
