"use client";

import { UserPlus } from "lucide-react";
import { useCustomersList } from "@/hooks/useCustomersList";
import CustomerTable from "@/components/customer/CustomerTable";
import CustomerFormModal from "@/components/invoice/CustomerFormModal";
import { useState } from "react";
import HeaderActionButton from "@/components/ui/HeaderActionButton";
import PageHeader from "@/components/ui/PageHeader";

export default function Page() {
  const { data: customers = [], isLoading } = useCustomersList();
  const [createModalOpen, setCreateModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-surface-page px-6 py-8 md:px-10">
      <div className="w-full mx-auto">
        <PageHeader
          title="Customers"
          subtitle="Manage your customer records"
          actions={
            <HeaderActionButton
              variant="dashed"
              icon={UserPlus}
              hideLabelOnMobile
              label="Add new customer"
              onClick={() => setCreateModalOpen(true)}
            />
          }
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
