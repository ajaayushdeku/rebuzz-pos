"use client";

import { BadgePercent, Loader2 } from "lucide-react";
import ModalShell from "@/components/ui/ModalShell";

export interface StaffFormData {
  name: string;
  email: string;
  phone: string;
  role: string;
}

export type StaffFormErrors = Partial<Record<keyof StaffFormData, string>>;

const errorClass = "border-red-300 focus:ring-red-400";

const inputClass =
  "w-full h-9 rounded-lg border border-slate-200 px-3 text-[13px] text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition";

const FIELDS: {
  key: "name" | "email" | "phone";
  label: string;
  type: string;
  placeholder: string;
}[] = [
  {
    key: "name",
    label: "Staff Name",
    type: "text",
    placeholder: "e.g. John Doe",
  },
  {
    key: "email",
    label: "Email",
    type: "email",
    placeholder: "e.g. john@example.com",
  },
  {
    key: "phone",
    label: "Phone Number",
    type: "text",
    placeholder: "e.g. +977-9841234567",
  },
];

/** Add / edit a staff member. Driven entirely by the parent's form state. */
export default function StaffFormModal({
  open,
  onOpenChange,
  isEdit,
  form,
  errors,
  onChange,
  onSave,
  saving,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isEdit: boolean;
  form: StaffFormData;
  errors: StaffFormErrors;
  onChange: <K extends keyof StaffFormData>(
    key: K,
    value: StaffFormData[K],
  ) => void;
  onSave: () => void;
  saving: boolean;
}) {
  return (
    <ModalShell
      open={open}
      onClose={() => onOpenChange(false)}
      title={isEdit ? "Edit Staff" : "Add New Staff"}
      subtitle={
        isEdit
          ? "Update this staff member's information"
          : "Create a new staff account"
      }
      icon={BadgePercent}
      footer={
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={saving}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
          >
            {saving ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                Saving...
              </>
            ) : isEdit ? (
              "Update Staff"
            ) : (
              "Add Staff"
            )}
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        {/* ── Contact ── */}
        <div>
          <div className="mb-3">
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">
              Details
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              How this staff member signs in and is contacted
            </p>
          </div>

          <div className="space-y-3">
            {FIELDS.map(({ key, label, type, placeholder }) => (
              <div key={key}>
                <label className="text-[11px] font-medium uppercase tracking-[0.06em] text-slate-400 block mb-1.5">
                  {label}
                </label>
                <input
                  type={type}
                  value={form[key]}
                  onChange={(e) => onChange(key, e.target.value)}
                  placeholder={placeholder}
                  className={`${inputClass} ${errors[key] ? errorClass : ""}`}
                />
                {errors[key] && (
                  <p className="text-xs text-red-500 mt-1">{errors[key]}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Role ── */}
        <div>
          <div className="mb-3">
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">
              Role
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Controls what this staff member can access
            </p>
          </div>

          <label className="text-[11px] font-medium uppercase tracking-[0.06em] text-slate-400 block mb-1.5">
            Staff Role
          </label>
          <select
            value={form.role}
            onChange={(e) => onChange("role", e.target.value)}
            className={`${inputClass} appearance-none ${
              errors.role ? errorClass : ""
            }`}
          >
            <option value="basic">Basic</option>
            <option value="staff">Staff</option>
          </select>
          {errors.role && (
            <p className="text-xs text-red-500 mt-1">{errors.role}</p>
          )}
        </div>
      </div>
    </ModalShell>
  );
}
