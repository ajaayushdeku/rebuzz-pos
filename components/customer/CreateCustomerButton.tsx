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
        className="flex text-sm items-center gap-2 bg-transparent border-dashed border-[1px] border-blue-400 text-blue-500 font-semibold hover:bg-blue-100 hover:text-blue-500 hover:border-blue-500  cursor-pointer"
        onClick={() => setOpen(true)}
      >
        <UserPlus className="h-4 w-4" />
        <span className="hidden lg:block">Add New Customer</span>
      </Button>

      <CustomerFormModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
