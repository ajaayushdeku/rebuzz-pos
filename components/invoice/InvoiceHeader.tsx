import { Plus } from "lucide-react";
import HeaderActionButton from "@/components/ui/HeaderActionButton";
import PageHeader from "@/components/ui/PageHeader";

export default function InvoiceHeader() {
  return (
    <PageHeader
      title="Invoices"
      subtitle="Manage your invoices"
      actions={
        <HeaderActionButton
          variant="dashed"
          hideLabelOnMobile
          icon={Plus}
          label="Create an invoice"
          href="/invoices/add"
        />
      }
    />
  );
}
