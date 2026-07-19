"use client";

import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { Loader2, ImageIcon, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import type { Customer } from "./customer-columns";
import { getCustomerImageUrl } from "@/lib/types/customer";
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

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

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

  // Profile photo — only sent when the user picks a new one.
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Show the newly picked file if there is one, else the saved photo.
  const previewSrc = imagePreview ?? getCustomerImageUrl(customer?.image);

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error("Image must be under 5MB");
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen && customer) {
      setForm(emptyForm(customer));
      clearImage();
    }
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
      const fields = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        countryCode: form.countryCode,
        note: form.note,
        customerPan: form.customerPan,
      };

      // A new photo requires multipart so the file survives the hop to the
      // backend; otherwise keep the simpler JSON body.
      let res: Response;
      if (imageFile) {
        const formData = new FormData();
        for (const [key, value] of Object.entries(fields)) {
          formData.append(key, value ?? "");
        }
        formData.append("image", imageFile, imageFile.name);
        res = await fetch(`/api/customers/${customer.id}`, {
          method: "PUT",
          // No Content-Type header — fetch sets multipart/form-data with boundary
          body: formData,
        });
      } else {
        res = await fetch(`/api/customers/${customer.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(fields),
        });
      }
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

          {/* Profile photo */}
          <div className="mb-4">
            <label className="text-xs font-medium text-gray-500 block mb-1.5">
              Profile photo
            </label>
            <div className="flex items-center gap-3">
              {previewSrc ? (
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewSrc}
                    alt="Profile preview"
                    className="h-16 w-16 rounded-full object-cover border border-gray-200"
                  />
                  {/* Only a newly picked file can be discarded here — removing
                      an already-saved photo isn't supported by the API. */}
                  {imageFile && (
                    <button
                      type="button"
                      onClick={clearImage}
                      className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 shadow-sm hover:bg-red-600"
                      aria-label="Discard selected photo"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              ) : (
                <div className="h-16 w-16 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0">
                  <ImageIcon size={18} className="text-gray-400" />
                </div>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 flex items-center justify-center gap-2 text-xs text-gray-500 border border-dashed border-gray-300 rounded-lg px-3 py-2.5 hover:border-blue-400 hover:text-blue-600 transition"
              >
                <ImageIcon size={14} />
                {imageFile ? "Change photo" : "Upload photo"}
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
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
