import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchVendors } from "@/services/purchases/vendors/apiVendors.client";
import VendorTable from "@/components/expenses/vendors/VendorTable";

export default async function Page() {
  const [vendor] = await Promise.all([fetchVendors()]);
  return (
    <div className="min-h-screen p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold text-gray-900">Vendors</h1>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl">
          <Plus className="mt-0.5" />
          <Link href="/vendors/add">Add a vendor</Link>
        </Button>
      </div>
      <VendorTable vendor={vendor} />
    </div>
  );
}
