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
    <div className="min-h-screen bg-50 px-6 py-8 md:px-10">
      <div className="w-full mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2 pb-4 border-b border-gray-200">
          <div>
            <h1 className="font-bold text-xl md:text-2xl truncate">
              Customers
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
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

        <CustomerTable customers={customers} isLoading={isLoading} />
      </div>

      <CustomerFormModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
      />
    </div>
  );
}
