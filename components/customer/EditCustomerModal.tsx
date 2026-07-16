"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import type { Customer } from "./customer-columns";
import SettingsModalShell, {
  modalCancelBtn,
  modalPrimaryBtn,
  modalInputClass as inputClass,
} from "@/components/settingsComponents/SettingsModalShell";

export type EditCustomerForm = {
  name: string;
  email: string;
  phone: string;
  countryCode: string;
  note: string;
  customerPan: string;
};

const emptyForm = (customer: Customer | null): EditCustomerForm => ({
  name: customer?.name ?? "",
  email: customer?.email ?? "",
  phone: customer?.phone ?? "",
  countryCode: "NP +977",
  note: customer?.note ?? "",
  customerPan: customer?.customerPan ?? "",
});

const CONTACT_FIELDS: {
  key: keyof EditCustomerForm;
  label: string;
  type?: string;
  placeholder?: string;
}[] = [
  { key: "name", label: "Full Name", placeholder: "John Doe" },
  { key: "email", label: "Email", type: "email", placeholder: "john@example.com" },
  { key: "phone", label: "Phone", type: "tel", placeholder: "98XXXXXXXX" },
  { key: "countryCode", label: "Country Code" },
];

const EXTRA_FIELDS: {
  key: keyof EditCustomerForm;
  label: string;
  placeholder?: string;
}[] = [
  {
    key: "customerPan",
    label: "Tax ID / PAN Number",
    placeholder: "PAN number (optional)",
  },
  { key: "note", label: "Note", placeholder: "Additional info..." },
];

/**
 * Edit a customer's details. Shared by the customers table and the customer
 * detail page.
 */
export default function EditCustomerModal({
  customer,
  open,
  onClose,
}: {
  customer: Customer | null;
  open: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<EditCustomerForm>(() => emptyForm(customer));

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen && customer) setForm(emptyForm(customer));
    if (!nextOpen) onClose();
  };

  const handleSave = async () => {
    if (!customer?.id) return;
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/customers/${customer.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          countryCode: form.countryCode,
          note: form.note,
          customerPan: form.customerPan,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Customer updated");
      queryClient.invalidateQueries({ queryKey: ["customers-list"] });
      onClose();
    } catch {
      toast.error("Failed to update customer");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SettingsModalShell
      open={open}
      onOpenChange={handleOpenChange}
      title="Edit Customer"
      description={
        customer?.name
          ? `Update the details for ${customer.name}`
          : "Update the customer's details"
      }
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className={modalCancelBtn}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !form.name.trim()}
            className={modalPrimaryBtn}
          >
            {saving ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </button>
        </>
      }
    >
      <div className="space-y-5">
        {/* ── Contact ── */}
        <div>
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-gray-800">Contact</h3>
            <p className="text-xs text-gray-500">
              How you reach this customer
            </p>
          </div>

          <div className="space-y-3">
            {CONTACT_FIELDS.map(({ key, label, type, placeholder }) => (
              <div key={key}>
                <label className="text-xs font-medium text-gray-500 block mb-1.5">
                  {label}
                </label>
                <input
                  type={type ?? "text"}
                  value={form[key]}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, [key]: e.target.value }))
                  }
                  placeholder={placeholder ?? label}
                  className={inputClass}
                />
              </div>
            ))}
          </div>
        </div>

        {/* ── Additional ── */}
        <div>
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-gray-800">Additional</h3>
            <p className="text-xs text-gray-500">
              Tax details and internal notes
            </p>
          </div>

          <div className="space-y-3">
            {EXTRA_FIELDS.map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="text-xs font-medium text-gray-500 block mb-1.5">
                  {label}
                </label>
                <input
                  value={form[key]}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, [key]: e.target.value }))
                  }
                  placeholder={placeholder ?? label}
                  className={inputClass}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </SettingsModalShell>
  );
}
