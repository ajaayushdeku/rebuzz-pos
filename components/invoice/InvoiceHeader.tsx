import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function InvoiceHeader() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2 pb-4 border-b border-gray-200">
      <div>
        <h1 className="font-bold text-xl md:text-2xl truncate">Invoices</h1>
        <p className="text-xs text-gray-400 mt-0.5">Manage your invoices</p>
      </div>

      <Button
        asChild
        className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
      >
        <Link href="/invoices/add">
          <Plus className="h-4 w-4" />
          Create an invoice
        </Link>
      </Button>
    </div>
  );
}
