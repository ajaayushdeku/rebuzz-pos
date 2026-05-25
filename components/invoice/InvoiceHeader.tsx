import Link from "next/link";
import { Button } from "../ui/button";
import { Plus } from "lucide-react";

export default function InvoiceHeader() {
  return (
    <div className="flex items-center justify-between mb-8">
      <h1 className="text-4xl font-bold text-gray-900">
        Invoices
      </h1>
      <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl">
        <Plus className="mt-0.5" />
        <Link href="/invoices/add">
          Create an invoice
        </Link>
      </Button>
    </div>
  );
}
