"use client";

import { User, Mail, Phone, Hash, FileText, Pencil } from "lucide-react";
import type { Customer } from "@/lib/types/customer";
import { CustomerAvatar } from "@/components/customer/CustomerAvatar";
import {
  CardInfo,
  CHART_PALETTE,
} from "@/components/dashboardComponents/chartCard";
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
        iconColor="text-blue-600"
        iconBg="bg-blue-50"
        action={
          <button
            onClick={onEdit}
            title="Edit customer"
            className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-[#dadce0] bg-white px-3 py-1 text-[11px] text-[#3c4043] transition-colors hover:bg-[#f8f9fa]"
          >
            <Pencil size={11} />
            Edit
          </button>
        }
      >
        <div className="min-w-0">
          <h3
            className="flex items-center gap-1.5 text-[15px] font-normal"
            style={{ color: CHART_PALETTE.title }}
          >
            Customer Information
            <CardInfo
              heading="Reading this card"
              label="Customer Information"
              // What the blanks mean, since most fields are optional.
              body="What this customer gave you when they were added. A dash means the field was left blank — edit the customer to fill it in. The Tax ID / PAN is what appears on their invoices."
            />
          </h3>
          <p
            className="mt-0.5 text-xs tracking-wide"
            style={{ color: CHART_PALETTE.subtitle }}
          >
            Contact details and identification
          </p>
        </div>
      </CardHeader>

      {/* Photo */}
      <div className="mb-1 flex items-center gap-4 border-b border-[#e8eaed] pb-4">
        <CustomerAvatar
          src={imageUrl}
          name={customer.name}
          className="h-16 w-16 shrink-0 border border-[#e3e3e3]"
          textClass="text-xl"
          onClick={onViewPhoto}
        />
        <div className="min-w-0">
          <p className="text-[11px]" style={{ color: CHART_PALETTE.subtitle }}>
            Profile photo
          </p>
          <p
            className="truncate text-[14px] font-medium"
            style={{ color: CHART_PALETTE.title }}
          >
            {imageUrl ? customer.name : "No photo uploaded"}
          </p>
          {!imageUrl && (
            <button
              onClick={onEdit}
              className="mt-0.5 cursor-pointer text-[11px] hover:underline"
              style={{ color: CHART_PALETTE.blue }}
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
