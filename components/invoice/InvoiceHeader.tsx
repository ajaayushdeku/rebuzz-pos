import { Plus } from "lucide-react";
import HeaderActionButton from "@/components/ui/HeaderActionButton";

export default function InvoiceHeader() {
  return (
    // One group, so the page column's spacing falls below the rule rather
    // than between it and the title.
    <div>
      <div className="flex flex-col justify-between gap-4 pb-5 sm:flex-row sm:items-end">
        <div className="min-w-0">
          <h1 className="truncate text-[22px] font-semibold tracking-[1px] text-[#3c4043] md:text-[26px]">
            Invoices
          </h1>
          <p className="mt-1 max-w-xl text-[12px] leading-relaxed text-[#5f6368]">
            Manage your invoices
          </p>
        </div>

        <HeaderActionButton
          variant="dashed"
          hideLabelOnMobile
          icon={Plus}
          label="Create an invoice"
          href="/invoices/add"
        />
      </div>

      {/* The rule, drawn rather than bordered: it holds the hairline under the
          title and fades out across the page, so it separates the header
          without ruling a hard line across the whole screen. */}
      <div
        aria-hidden
        className="mb-6 h-px w-full bg-gradient-to-r from-[#dadce0] via-[#e8eaed] to-transparent"
      />
    </div>
  );
}
