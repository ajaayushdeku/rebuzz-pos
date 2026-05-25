"use client";

import { useState } from "react";
import { DataTable } from "../ui/data-table";
import { Customer, getCustomerColumns } from "./customer-columns";
import CustomerDetailModal from "./CustomerDetailModal";

export default function CustomerTable({
  customers,
}: {
  customers: Customer[];
}) {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [modalOpen, setModalOpen] = useState(false);

  const handleRowClick = (customer: Customer) => {
    setSelectedCustomer(customer);
    setModalOpen(true);
  };

  const columns = getCustomerColumns;

  return (
    <>
      <DataTable
        columns={columns}
        data={customers}
        searchColumn="name"
        searchPlaceholder="Search by name..."
        pageSize={10}
        onRowClick={handleRowClick}
        showColumnToggle
      />

      <CustomerDetailModal
        customer={selectedCustomer}
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedCustomer(null);
        }}
      />
    </>
  );
}
