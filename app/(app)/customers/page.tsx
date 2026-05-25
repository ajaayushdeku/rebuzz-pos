"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { UserPlus } from "lucide-react";
import { fetchCustomersClient } from "@/services/apiCustomer.client";
import CustomerTable from "@/components/customer/CustomerTable";
import type { Customer } from "@/components/customer/customer-columns";

export default function Page() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCustomersClient()
      .then(setCustomers)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="min-h-screen p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="md:text-4xl text-3xl font-bold text-gray-900">
          Customers
        </h1>
        <Button
          asChild
          className="bg-blue-600 hover:bg-blue-700 px-6 py-3 text-white rounded-2xl"
        >
          <Link href="/customers/add">
            <UserPlus />
            Add new customer
          </Link>
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
  );
}
