"use client";

import { User, Mail, Phone, Hash, FileText, Pencil } from "lucide-react";
import type { Customer } from "@/lib/types/customer";
import { CustomerAvatar } from "@/components/customer/CustomerAvatar";
import { CardInfo } from "@/components/dashboardComponents/chartCard";
import DetailRow from "./DetailRow";
import { DETAIL_CARD, CardHeader } from "./DetailCardShell";

export default function CustomerInfoCard({
  customer,
  imageUrl,
  onEdit,
  onViewPhoto,
}: {
  customer: Customer;
  imageUrl: string | null;
  onEdit: () => void;
  onViewPhoto?: () => void;
}) {
  const rows = [
    { icon: <User size={15} />, label: "Name", value: customer.name },
    { icon: <Mail size={15} />, label: "Email", value: customer.email },
    { icon: <Phone size={15} />, label: "Phone", value: customer.phone },
    {
      icon: <Hash size={15} />,
      label: "Tax ID / PAN",
      value: customer.customerPan || null,
    },
    { icon: <FileText size={15} />, label: "Note", value: customer.note },
  ];

  return (
    <div className={DETAIL_CARD}>
      <CardHeader
        icon={User}
        iconColor="text-blue-600 dark:text-[#7ba2e3]"
        iconBg="bg-blue-50 dark:bg-blue-400/10"
        action={
          <button
            onClick={onEdit}
            title="Edit customer"
            className="flex shrink-0 cursor-pointer dark:bg-white/5 items-center gap-1.5 rounded-full border border-[#dadce0] bg-white px-3 py-1 text-[11px] text-[#3c4043] transition-colors hover:bg-[#f8f9fa] dark:border-white/15 dark:text-[#e8ecf4] dark:hover:bg-white/10"
          >
            <Pencil size={11} />
            Edit
          </button>
        }
      >
        <div className="min-w-0">
          <h3 className="flex items-center gap-1.5 text-[15px] font-normal text-[#3c4043] dark:text-[#e8ecf4]">
            Customer Information
            <CardInfo
              heading="Reading this card"
              label="Customer Information"
              // What the blanks mean, since most fields are optional.
              body="What this customer gave you when they were added. A dash means the field was left blank — edit the customer to fill it in. The Tax ID / PAN is what appears on their invoices."
            />
          </h3>
          <p className="mt-0.5 text-xs tracking-wide text-[#9aa0a6] dark:text-[#9aa6bd]">
            Contact details and identification
          </p>
        </div>
      </CardHeader>

      {/* Photo */}
      <div className="mb-1 flex items-center gap-4 border-b border-[#e8eaed] pb-4 dark:border-white/10">
        <CustomerAvatar
          src={imageUrl}
          name={customer.name}
          className="h-16 w-16 shrink-0 border border-[#474B54]"
          textClass="text-xl"
          onClick={onViewPhoto}
        />
        <div className="min-w-0">
          <p className="text-[11px] text-[#9aa0a6] dark:text-[#9aa6bd]">
            Profile photo
          </p>
          <p className="truncate text-[14px] font-medium text-[#3c4043] dark:text-[#e8ecf4]">
            {imageUrl ? customer.name : "No photo uploaded"}
          </p>
          {!imageUrl && (
            <button
              onClick={onEdit}
              className="mt-0.5 cursor-pointer text-[11px] hover:underline text-[#1a73e8] dark:text-[#7ba2e3]"
            >
              Upload a photo
            </button>
          )}
        </div>
      </div>

      <div>
        {rows.map((row) => (
          <DetailRow
            key={row.label}
            icon={row.icon}
            label={row.label}
            value={row.value ?? "—"}
          />
        ))}
      </div>
    </div>
  );
}
