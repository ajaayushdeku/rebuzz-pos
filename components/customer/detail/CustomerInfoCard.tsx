"use client";

import { User, Mail, Phone, Hash, FileText, Pencil } from "lucide-react";
import type { Customer } from "@/lib/types/customer";
import { CustomerAvatar } from "@/components/customer/CustomerAvatar";
import { ComponentHeader } from "@/components/ComponentHeader";
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
        iconColor="text-blue-500"
        iconBg="bg-blue-50"
        action={
          <button
            onClick={onEdit}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
            title="Edit customer"
          >
            <Pencil size={14} />
          </button>
        }
      >
        <ComponentHeader
          title="Customer Information"
          subHeader="Customer Details"
        />
      </CardHeader>

      {/* Photo */}
      <div className="mb-1 flex items-center gap-4 border-b border-gray-50 pb-4">
        <CustomerAvatar
          src={imageUrl}
          name={customer.name}
          className="h-16 w-16 shrink-0 border border-gray-200"
          textClass="text-xl"
          onClick={onViewPhoto}
        />
        <div className="min-w-0">
          <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
            Profile Photo
          </p>
          <p className="truncate text-sm font-medium text-gray-900">
            {imageUrl ? customer.name : "No photo uploaded"}
          </p>
          {!imageUrl && (
            <button
              onClick={onEdit}
              className="mt-0.5 text-xs text-blue-600 hover:text-blue-700"
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
