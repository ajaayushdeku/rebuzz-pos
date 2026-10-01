"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import CustomerFormModal from "@/components/invoice/CustomerFormModal";

export default function CreateCustomerButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="inline-flex h-9 shrink-0 cursor-pointer border border-dashed border-blue-300 bg-white text-blue-600 hover:border-blue-400 hover:bg-blue-50 active:bg-blue-100 select-none items-center justify-center gap-2 tracking-wide whitespace-nowrap rounded-lg  px-3.5 text-sm font-semibold transition-colors outline-none focus-visible:border-blue-500 focus-visible:ring-[3px] focus-visible:ring-blue-500/30 active:translate-y-px disabled:pointer-events-none disabled:opacity-50 dark:border-[#7ba2e3]/40 dark:bg-white/5 dark:text-[#7ba2e3] dark:hover:border-[#7ba2e3]/60 dark:hover:bg-white/10"
        onClick={() => setOpen(true)}
      >
        <UserPlus className="h-4 w-4" />
        <span className="hidden lg:block">Add New Customer</span>
      </button>

      <CustomerFormModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
