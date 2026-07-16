"use client";

import { Loader2 } from "lucide-react";
import SettingsModalShell, {
  modalCancelBtn,
  modalPrimaryBtn,
  modalInputClass as inputClass,
} from "@/components/settingsComponents/SettingsModalShell";

export interface StaffFormData {
  name: string;
  email: string;
  phone: string;
  role: string;
}

export type StaffFormErrors = Partial<Record<keyof StaffFormData, string>>;

const errorClass = "border-red-300 focus:ring-red-400";

const FIELDS: {
  key: "name" | "email" | "phone";
  label: string;
  type: string;
  placeholder: string;
}[] = [
  { key: "name", label: "Staff Name", type: "text", placeholder: "e.g. John Doe" },
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
    <SettingsModalShell
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Edit Staff" : "Add New Staff"}
      description={
        isEdit
          ? "Update this staff member's information"
          : "Create a new staff account"
      }
      footer={
        <>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={saving}
            className={modalCancelBtn}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className={modalPrimaryBtn}
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
        </>
      }
    >
      <div className="space-y-5">
        {/* ── Contact ── */}
        <div>
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-gray-800">Details</h3>
            <p className="text-xs text-gray-500">
              How this staff member signs in and is contacted
            </p>
          </div>

          <div className="space-y-3">
            {FIELDS.map(({ key, label, type, placeholder }) => (
              <div key={key}>
                <label className="text-xs font-medium text-gray-500 block mb-1.5">
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
            <h3 className="text-sm font-semibold text-gray-800">Role</h3>
            <p className="text-xs text-gray-500">
              Controls what this staff member can access
            </p>
          </div>

          <label className="text-xs font-medium text-gray-500 block mb-1.5">
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
    </SettingsModalShell>
  );
}
