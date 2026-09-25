"use client";

import { UserPlus } from "lucide-react";
import { useCustomersList } from "@/hooks/useCustomersList";
import CustomerTable from "@/components/customer/CustomerTable";
import CustomerFormModal from "@/components/invoice/CustomerFormModal";
import { useState } from "react";
import HeaderActionButton from "@/components/ui/HeaderActionButton";

export default function Page() {
  const { data: customers = [], isLoading } = useCustomersList();
  const [createModalOpen, setCreateModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-surface-page px-6 py-8 md:px-10">
      <div className="w-full mx-auto">
        <div className="flex flex-col justify-between gap-4 pb-5 sm:flex-row sm:items-end">
          <div className="min-w-0">
            <h1 className="truncate text-[22px] font-semibold tracking-[1px] text-[#3c4043] md:text-[26px]">
              Customers
            </h1>
            <p className="mt-1 max-w-xl text-[12px] leading-relaxed text-[#5f6368]">
              Manage your customer records
            </p>
          </div>
          <HeaderActionButton
            variant="dashed"
            icon={UserPlus}
            hideLabelOnMobile
            label="Add new customer"
            onClick={() => setCreateModalOpen(true)}
          />
        </div>

        <div
          aria-hidden
          className="mb-6 h-px w-full bg-gradient-to-r from-[#dadce0] via-[#e8eaed] to-transparent"
        />

        <CustomerTable customers={customers} isLoading={isLoading} />
      </div>

      <CustomerFormModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
      />
    </div>
  );
}
