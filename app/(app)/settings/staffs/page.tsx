"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Plus, X, Check, Loader2, UserCog } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/ui/data-table";
import { StaffMember, getStaffColumns } from "@/components/staff/staff-columns";

// ── Types ───────────────────────────────────────────────────────────────────
interface StaffFormData {
  name: string;
  email: string;
  phone: string;
  role: string;
}

const emptyForm: StaffFormData = {
  name: "",
  email: "",
  phone: "",
  role: "staff",
};

// ── Input styling ───────────────────────────────────────────────────────────
const inputClass =
  "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition";

export default function StaffManagementPage() {
  // ── State ─────────────────────────────────────────────────────────────────
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editStaff, setEditStaff] = useState<StaffMember | null>(null);
  const [form, setForm] = useState<StaffFormData>(emptyForm);
  const [formErrors, setFormErrors] = useState<
    Partial<Record<keyof StaffFormData, string>>
  >({});
  const [saving, setSaving] = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ── Fetch staff ───────────────────────────────────────────────────────────
  const fetchStaff = () => {
    setLoading(true);
    fetch("/api/staff")
      .then((res) => res.json())
      .then((data) => {
        const list: StaffMember[] = data?.data?.users || data?.users || [];
        setStaff(list);
      })
      .catch((err) => {
        toast.error(
          err instanceof Error ? err.message : "Failed to load staff",
        );
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    (async () => {
      await Promise.resolve();
      fetchStaff();
    })();
  }, []);

  // ── Open modal for add/edit ───────────────────────────────────────────────
  const openAdd = () => {
    setEditStaff(null);
    setForm(emptyForm);
    setFormErrors({});
    setModalOpen(true);
  };

  const openEdit = (staffMember: StaffMember) => {
    setEditStaff(staffMember);
    setForm({
      name: staffMember.name || "",
      email: staffMember.email || "",
      phone: staffMember.phone || "",
      role: staffMember.role || "staff",
    });
    setFormErrors({});
    setModalOpen(true);
  };

  // ── Validation ────────────────────────────────────────────────────────────
  const validate = (): boolean => {
    const e: Partial<Record<keyof StaffFormData, string>> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "Invalid email format";
    if (!form.phone.trim()) e.phone = "Phone number is required";
    if (!form.role) e.role = "Role is required";
    setFormErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Save (create or update) ───────────────────────────────────────────────
  const handleSave = async () => {
    if (!validate()) return;

    setSaving(true);
    try {
      if (editStaff) {
        // Update
        const res = await fetch("/api/staff", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: editStaff._id,
            name: form.name.trim(),
            email: form.email.trim(),
            phone: form.phone.trim(),
            role: form.role,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to update staff");
        toast.success("Staff updated successfully");
      } else {
        // Create
        const res = await fetch("/api/staff", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name.trim(),
            email: form.email.trim(),
            phone: form.phone.trim(),
            role: form.role,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to create staff");
        toast.success("Staff created successfully");
      }

      setModalOpen(false);
      fetchStaff();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async (userId: string) => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/staff?userId=${userId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete staff");
      toast.success("Staff deleted successfully");
      setDeleteConfirm(null);
      fetchStaff();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setDeleting(false);
    }
  };

  // ── Set form field ────────────────────────────────────────────────────────
  const set = (key: keyof StaffFormData, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (formErrors[key])
      setFormErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  // ── Role filter config for DataTable ──────────────────────────────────────
  const roleFilters = [
    {
      columnId: "role",
      label: "Role",
      options: ["basic", "staff"],
    },
  ];

  const columns = getStaffColumns(openEdit, (id: string) =>
    setDeleteConfirm(id),
  );

  return (
    <div className="min-h-screen bg-50 px-6 py-8 md:px-10">
      <div className="max-w-7xl mx-auto">
        {/* ── Header ─────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-bold text-xl md:text-2xl truncate">
              Manage Staff
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Manage all employees and staff members
            </p>
          </div>

          <Button
            onClick={openAdd}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add New Staff
          </Button>
        </div>

        {/* ── Staff Table using DataTable ────────────────── */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          </div>
        ) : staff.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-12 text-center">
            <UserCog className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">No staff members found</p>
            <p className="text-sm text-gray-400 mt-1">
              Click &ldquo;Add New Staff&rdquo; to get started
            </p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={staff}
            searchColumn="name"
            searchPlaceholder="Search by name, email or phone..."
            pageSize={10}
            filters={roleFilters}
            showColumnToggle
          />
        )}

        {/* ── Add/Edit Modal ──────────────────────────────── */}
        {modalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={() => setModalOpen(false)}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal header */}
              <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {editStaff ? "Edit Staff" : "Add New Staff"}
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {editStaff
                      ? "Update staff member information"
                      : "Create a new staff account"}
                  </p>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Modal body */}
              <div className="p-6 space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5 tracking-wide">
                    Staff Name
                  </label>
                  <Input
                    type="text"
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                    className={`${inputClass} ${formErrors.name ? "border-red-300 focus:ring-red-400" : ""}`}
                    placeholder="e.g. John Doe"
                  />
                  {formErrors.name && (
                    <p className="text-xs text-red-500 mt-1">
                      {formErrors.name}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5 tracking-wide">
                    Email
                  </label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                    className={`${inputClass} ${formErrors.email ? "border-red-300 focus:ring-red-400" : ""}`}
                    placeholder="e.g. john@example.com"
                  />
                  {formErrors.email && (
                    <p className="text-xs text-red-500 mt-1">
                      {formErrors.email}
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5 tracking-wide">
                    Phone Number
                  </label>
                  <Input
                    type="text"
                    value={form.phone}
                    onChange={(e) => set("phone", e.target.value)}
                    className={`${inputClass} ${formErrors.phone ? "border-red-300 focus:ring-red-400" : ""}`}
                    placeholder="e.g. +977-9841234567"
                  />
                  {formErrors.phone && (
                    <p className="text-xs text-red-500 mt-1">
                      {formErrors.phone}
                    </p>
                  )}
                </div>

                {/* Role */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5 tracking-wide">
                    Staff Role
                  </label>
                  <Select
                    value={form.role}
                    onValueChange={(val) => set("role", val)}
                  >
                    <SelectTrigger
                      className={`h-11 rounded-xl border-gray-200 bg-white ${formErrors.role ? "border-red-300" : ""}`}
                    >
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-gray-200 shadow-xl">
                      <SelectItem
                        value="basic"
                        className="py-2.5 cursor-pointer"
                      >
                        Basic
                      </SelectItem>

                      <SelectItem
                        value="staff"
                        className="py-2.5 cursor-pointer"
                      >
                        Staff
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {formErrors.role && (
                    <p className="text-xs text-red-500 mt-1">
                      {formErrors.role}
                    </p>
                  )}
                </div>
              </div>

              {/* Modal footer */}
              <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-3">
                <Button
                  onClick={() => setModalOpen(false)}
                  variant="outline"
                  className="rounded-lg flex items-center gap-2 border-gray-300 text-gray-700 hover:bg-gray-100"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      {editStaff ? "Update Staff" : "Add Staff"}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ── Delete Confirmation ─────────────────────────── */}
        {deleteConfirm && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={() => setDeleteConfirm(null)}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 text-center">
                <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                  <Loader2 className="h-6 w-6 text-red-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Delete Staff?
                </h3>
                <p className="text-sm text-gray-500 mt-2">
                  This action cannot be undone. The staff member will be
                  permanently removed.
                </p>
              </div>
              <div className="px-6 pb-6 flex gap-3">
                <Button
                  onClick={() => setDeleteConfirm(null)}
                  variant="outline"
                  className="flex-1 rounded-lg border-gray-300 text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleDelete(deleteConfirm)}
                  disabled={deleting}
                  className="flex-1 rounded-lg bg-red-600 hover:bg-red-700 text-white"
                >
                  {deleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Delete"
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
