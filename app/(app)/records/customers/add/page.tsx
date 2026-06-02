"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";
import CustomerFormModal from "@/components/invoice/CustomerFormModal";

export default function AddCustomerPage() {
  const router = useRouter();
  const [open, setOpen] = useState(true);

  const handleClose = () => {
    setOpen(false);
    router.push("/records/customers");
  };

  return <CustomerFormModal open={open} onClose={handleClose} />;
}
