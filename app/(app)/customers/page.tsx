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
    <div className="min-h-screen bg-50 px-6 py-8 md:px-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-bold text-xl md:text-2xl truncate">
              Customers
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Manage your customer records
            </p>
          </div>
          <Button
            asChild
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
          >
            <Link href="/customers/add">
              <UserPlus className="h-4 w-4" />
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
    </div>
  );
}
