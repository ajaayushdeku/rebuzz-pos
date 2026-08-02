"use client";

import CustomerDateFilter from "./CustomerDateFilter";

export default function CustomerHeader() {
  return (
    <div className="flex items-center gap-2">
      <CustomerDateFilter />
    </div>
  );
}
