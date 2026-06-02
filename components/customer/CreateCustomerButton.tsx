"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import CustomerFormModal from "@/components/invoice/CustomerFormModal";

export default function CreateCustomerButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        className="bg-blue-600 hover:bg-blue-700 px-4 py-2.5 text-white rounded-xl text-sm font-semibold"
        onClick={() => setOpen(true)}
      >
        <UserPlus className="h-4 w-4 mr-1.5" />
        New Customer
      </Button>

      <CustomerFormModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
