"use client";

import { useEffect, useState, useMemo } from "react";
import toast from "react-hot-toast";
import {
  Plus,
  X,
  Check,
  Loader2,
  UserCog,
  Search,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Shield,
  Mail,
  Phone,
  Pencil,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ── Types ───────────────────────────────────────────────────────────────────
interface StaffFormData {
  name: string;
  email: string;
  phone: string;
  role: string;
}

type StaffMember = {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  isEmployee?: boolean;
  isDeactivated?: boolean;
  emailVerified?: boolean;
};

const emptyForm: StaffFormData = {
  name: "",
  email: "",
  phone: "",
  role: "staff",
};

// ── Input styling ───────────────────────────────────────────────────────────
const inputClass =
  "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition";

type SortConfig = { key: string; direction: "asc" | "desc" } | null;

// ── Role badge ──────────────────────────────────────────────────────────────
function RoleBadge({ role }: { role: string }) {
  const isStaff = role === "staff";
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
        isStaff
          ? "bg-purple-50 text-purple-700 border border-purple-200"
          : "bg-blue-50 text-blue-700 border border-blue-200"
      }`}
    >
      {isStaff ? (
        <Shield className="h-3 w-3" />
      ) : (
        <UserCog className="h-3 w-3" />
      )}
      {isStaff ? "Staff" : "Basic"}
    </span>
  );
}

// ── Status badge ────────────────────────────────────────────────────────────
function StatusBadge({ deactivated }: { deactivated?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
        deactivated
          ? "bg-red-50 text-red-600 border border-red-200"
          : "bg-green-50 text-green-700 border border-green-200"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          deactivated ? "bg-red-500" : "bg-green-500"
        }`}
      />
      {deactivated ? "Disabled" : "Active"}
    </span>
  );
}

export default function StaffManagementPage() {
  // ── State ─────────────────────────────────────────────────────────────────
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [page, setPage] = useState(0);
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const pageSize = 10;

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

  // ── Filter, sort, paginate ────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let result = staff;
    const q = search.toLowerCase();
    if (q) {
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q) ||
          s.phone.includes(q),
      );
    }
    if (roleFilter !== "all") {
      result = result.filter((s) => s.role === roleFilter);
    }
    return result;
  }, [staff, search, roleFilter]);

  const sorted = useMemo(() => {
    if (!sortConfig) return filtered;
    return [...filtered].sort((a, b) => {
      const aVal = String(
        (a as unknown as Record<string, unknown>)[sortConfig.key] ?? "",
      );
      const bVal = String(
        (b as unknown as Record<string, unknown>)[sortConfig.key] ?? "",
      );
      const cmp = aVal.localeCompare(bVal, undefined, { numeric: true });
      return sortConfig.direction === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paged = sorted.slice(page * pageSize, (page + 1) * pageSize);

  const toggleSort = (key: string) => {
    setSortConfig((prev) =>
      prev?.key === key && prev.direction === "asc"
        ? { key, direction: "desc" }
        : { key, direction: "asc" },
    );
  };

  const SortIcon = ({ colKey }: { colKey: string }) =>
    sortConfig?.key === colKey ? (
      sortConfig.direction === "asc" ? (
        <ChevronUp className="h-3 w-3" />
      ) : (
        <ChevronDown className="h-3 w-3" />
      )
    ) : (
      <ArrowUpDown className="h-3 w-3 opacity-30" />
    );

  return (
    <div className="min-h-screen bg-50 px-6 py-8 md:px-10">
      <div className="max-w-7xl mx-auto">
        {/* ── Header ─────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2 pb-4 border-b border-gray-200">
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

        {/* ── Search + Filter ── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
          <div className="relative flex-1">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              placeholder="Search by name, email or phone..."
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(0);
            }}
            className="px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600"
          >
            <option value="all">All Roles</option>
            <option value="basic">Basic</option>
            <option value="staff">Staff</option>
          </select>
        </div>

        {/* ── Staff Table ── */}
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
          <>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
              <table className="w-full text-sm min-w-[1000px]">
                <thead>
                  <tr className="text-xs text-gray-400 border-b border-gray-100">
                    <th className="text-left pb-3 pt-3 px-4 font-medium w-12">
                      S.No
                    </th>
                    <th
                      className="text-left pb-3 pt-3 px-4 font-medium cursor-pointer select-none hover:text-gray-600"
                      onClick={() => toggleSort("name")}
                    >
                      <span className="flex items-center gap-1">
                        Staff Name {SortIcon({ colKey: "name" })}
                      </span>
                    </th>
                    <th className="text-left pb-3 pt-3 px-4 font-medium">
                      Email
                    </th>
                    <th className="text-left pb-3 pt-3 px-4 font-medium">
                      Phone
                    </th>
                    <th className="text-center pb-3 pt-3 px-4 font-medium">
                      Role
                    </th>
                    <th className="text-center pb-3 pt-3 px-4 font-medium">
                      Status
                    </th>
                    <th className="text-right pb-3 pt-3 px-4 font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paged.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="text-center py-12 text-sm text-gray-400"
                      >
                        No staff members found
                      </td>
                    </tr>
                  ) : (
                    paged.map((staffMember, idx) => (
                      <tr
                        key={staffMember._id}
                        className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-3 px-4 text-gray-400 text-xs">
                          {page * pageSize + idx + 1}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-medium text-gray-900">
                            {staffMember.name || "—"}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5 text-sm text-gray-600">
                            <Mail className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                            {staffMember.email || "—"}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5 text-sm text-gray-600">
                            <Phone className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                            {staffMember.phone || "—"}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <RoleBadge role={staffMember.role} />
                        </td>
                        <td className="py-3 px-4 text-center">
                          <StatusBadge
                            deactivated={staffMember.isDeactivated}
                          />
                        </td>
                        <td className="py-3 px-4">
                          <div
                            className="flex items-center justify-end gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => openEdit(staffMember)}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(staffMember._id)}
                              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between py-4">
              <span className="text-sm text-gray-500">
                Page {page + 1} of {totalPages} · {sorted.length} staff members
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Next
                </button>
              </div>
            </div>
          </>
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
                  <Trash2 className="h-6 w-6 text-red-500" />
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
