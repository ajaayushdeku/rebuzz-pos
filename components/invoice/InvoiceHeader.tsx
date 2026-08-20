import { Plus } from "lucide-react";
import HeaderActionButton from "@/components/ui/HeaderActionButton";

export default function InvoiceHeader() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2 pb-4 border-b border-gray-200">
      <div>
        <h1 className="font-bold text-xl md:text-2xl truncate">Invoices</h1>
        <p className="text-xs text-gray-400 mt-0.5">Manage your invoices</p>
      </div>

      <HeaderActionButton
        variant="dashed"
        hideLabelOnMobile
        icon={Plus}
        label="Create an invoice"
        href="/invoices/add"
      />
    </div>
  );
}
