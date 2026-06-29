"use client";

import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import { useCustomersList } from "@/hooks/useCustomersList";
import CustomerTable from "@/components/customer/CustomerTable";
import CustomerFormModal from "@/components/invoice/CustomerFormModal";
import { useState } from "react";

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
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
            onClick={() => setCreateModalOpen(true)}
          >
            <UserPlus className="h-4 w-4" />
            Add new customer
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-gray-400">
            Loading customers...
          </div>
        ) : (
          <CustomerTable customers={customers} />
        )}
      </div>

      <CustomerFormModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
      />
    </div>
  );
}
