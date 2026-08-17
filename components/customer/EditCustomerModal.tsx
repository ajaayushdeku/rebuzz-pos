"use client";

import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { Loader2, ImageIcon, X, User, Save, Phone } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import type { Customer } from "./customer-columns";
import { getCustomerImageUrl } from "@/lib/types/customer";

import ModalShell, {
  SectionLabel,
  modalInput,
  modalInputIdle,
  modalGhostButton,
  modalPrimaryButton,
} from "../ui/ModalShell";

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
    <ModalShell
      open={open}
      onClose={() => handleOpenChange(false)}
      busy={saving}
      title="Edit customer"
      subtitle={
        customer?.name
          ? `Update the details for ${customer.name}`
          : "Update the customer's details"
      }
      icon={User}
      iconColor="text-blue-600"
      iconBgColor="bg-blue-50"
      maxWidth="max-w-xl"
      footer={
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className={modalGhostButton}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !form.name.trim()}
            className={`${modalPrimaryButton} bg-blue-600 hover:bg-blue-700`}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save changes
              </>
            )}
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Profile photo */}
        <div>
          <SectionLabel>Profile photo</SectionLabel>
          <div className="mt-2 flex items-center gap-4 rounded-xl border border-gray-200 p-3">
            {previewSrc ? (
              <div className="relative shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewSrc}
                  alt="Profile preview"
                  className="h-16 w-16 rounded-full border border-gray-200 object-cover"
                />
                {/* Only a newly picked file can be discarded here — removing an
                    already-saved photo isn't supported by the API. */}
                {imageFile && (
                  <button
                    type="button"
                    onClick={clearImage}
                    aria-label="Discard selected photo"
                    className="absolute -right-1.5 -top-1.5 rounded-full bg-red-500 p-0.5 text-white shadow-sm transition hover:bg-red-600"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            ) : (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-dashed border-gray-300 bg-gray-50">
                <ImageIcon size={18} className="text-gray-400" />
              </div>
            )}

            <div className="min-w-0 flex-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-gray-700 transition hover:border-blue-400 hover:text-blue-600"
              >
                <ImageIcon size={13} />
                {imageFile ? "Change photo" : "Upload photo"}
              </button>
              <p className="mt-1.5 text-[11px] text-gray-400">
                PNG or JPG, up to 5 MB.
              </p>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />
        </div>

        {/* Name + email */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <SectionLabel>
              Name <span className="text-red-500">*</span>
            </SectionLabel>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="John Doe"
              className={`mt-2 ${modalInput} ${modalInputIdle}`}
            />
          </div>

          <div>
            <SectionLabel>Email</SectionLabel>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              placeholder="john@example.com"
              className={`mt-2 ${modalInput} ${modalInputIdle}`}
            />
          </div>
        </div>

        {/* Phone — country code and number share one bordered group so they
            read as a single field, matching CustomerFormModal's step 1. */}
        <div>
          <SectionLabel>Phone</SectionLabel>
          <div className="mt-2 flex items-center rounded-xl border border-gray-200 bg-white transition focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20">
            <span className="pl-3.5 text-gray-400">
              <Phone size={15} />
            </span>
            <input
              type="text"
              value={form.countryCode}
              onChange={(e) =>
                setForm((p) => ({ ...p, countryCode: e.target.value }))
              }
              placeholder="+977"
              aria-label="Country code"
              className="h-11 w-24 bg-transparent px-2 text-center text-[13px] tabular-nums outline-none"
            />
            <span className="h-6 w-px shrink-0 bg-gray-200" />
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
              placeholder="98XXXXXXXX"
              aria-label="Phone number"
              className="h-11 flex-1 bg-transparent px-3 text-[13px] tabular-nums outline-none"
            />
          </div>
        </div>

        <div>
          <SectionLabel>Tax ID</SectionLabel>
          <input
            type="text"
            value={form.customerPan}
            onChange={(e) =>
              setForm((p) => ({ ...p, customerPan: e.target.value }))
            }
            placeholder="PAN number (optional)"
            className={`mt-2 ${modalInput} ${modalInputIdle}`}
          />
        </div>

        <div>
          <SectionLabel>Note</SectionLabel>
          <textarea
            value={form.note}
            onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
            placeholder="Additional info... (optional)"
            rows={3}
            className="mt-2 w-full resize-none rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-[13px] outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      </div>
    </ModalShell>
  );
}
