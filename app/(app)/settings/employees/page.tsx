"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  Plus,
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
  ChevronLeft,
  ChevronRight,
  UserRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import StaffFormModal from "@/components/settingsComponents/staffs/StaffFormModal";

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

/**
 * The reason a request failed, ready to toast. The staff routes answer with
 * `{ error }`, the [employeeId] route passes the backend's `{ message }`
 * straight through, and a gateway failure answers with neither (or with HTML,
 * which is why the parse is guarded — an unguarded res.json() surfaces
 * "Unexpected token <" to the user instead of the real problem).
 */
async function readError(res: Response, fallback: string): Promise<string> {
  const data = (await res.json().catch(() => null)) as {
    error?: string;
    message?: string;
  } | null;
  return data?.error || data?.message || `${fallback} (${res.status})`;
}

// ── Input styling ───────────────────────────────────────────────────────────
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
  const router = useRouter();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [page, setPage] = useState(0);
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [roleOpen, setRoleOpen] = useState(false);
  const roleRef = useRef<HTMLDivElement | null>(null);
  const pageSize = 10;

  // Close the role dropdown on outside click / Escape
  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (roleRef.current && !roleRef.current.contains(e.target as Node)) {
        setRoleOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setRoleOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  const [modalOpen, setModalOpen] = useState(false);
  const [editStaff, setEditStaff] = useState<StaffMember | null>(null);
  const [form, setForm] = useState<StaffFormData>(emptyForm);
  const [formErrors, setFormErrors] = useState<
    Partial<Record<keyof StaffFormData, string>>
  >({});
  const [saving, setSaving] = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // The row behind the open confirmation. Resolved once here rather than
  // looked up inline, so the name and email can't disagree with each other.
  const deleteTarget = deleteConfirm
    ? staff.find((s) => s._id === deleteConfirm)
    : null;

  // ── Fetch staff ───────────────────────────────────────────────────────────
  const fetchStaff = () => {
    setLoading(true);
    fetch("/api/staff")
      .then(async (res) => {
        if (!res.ok)
          throw new Error(await readError(res, "Failed to load staff"));
        return res.json();
      })
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
        if (!res.ok)
          throw new Error(await readError(res, "Failed to update staff"));
        toast.success("Staff updated successfully");
      } else {
        // multipart/form-data all the way through — the create endpoint
        // behind /api/staff takes a form body, so sending one from here too
        // keeps the request the browser makes and the request the backend
        // receives the same shape. No Content-Type header: fetch has to write
        // the multipart boundary itself.
        const body = new FormData();
        body.append("name", form.name.trim());
        body.append("email", form.email.trim());
        body.append("phone", form.phone.trim());
        body.append("role", form.role);

        const res = await fetch("/api/staff", { method: "POST", body });
        if (!res.ok)
          throw new Error(await readError(res, "Failed to create staff"));
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
      const res = await fetch(`/api/staff/${userId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok)
        throw new Error(await readError(res, "Failed to delete staff"));
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
      <div className="w-full mx-auto">
        {/* ── Header ───────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2 pb-4 border-b border-gray-200">
          <div>
            <h1 className="font-bold text-xl md:text-2xl truncate">
              Manage Employees
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Manage all employees and staff members
            </p>
          </div>

          <Button
            onClick={openAdd}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add New Employee
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
              className="w-full pl-9 pr-4 py-2.5 text-[13px] border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>
          <div ref={roleRef} className="relative w-full sm:w-[150px]">
            <button
              type="button"
              onClick={() => setRoleOpen((o) => !o)}
              className="w-full flex items-center justify-between gap-2 pl-3 pr-2.5 py-2.5 text-[13px] border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-600 cursor-pointer transition capitalize"
            >
              <span>
                {roleFilter === "all"
                  ? "All Roles"
                  : roleFilter.charAt(0).toUpperCase() + roleFilter.slice(1)}
              </span>
              <ChevronDown
                size={14}
                className={`text-gray-400 transition-transform duration-200 ${
                  roleOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            <div
              className={`absolute z-30 mt-1.5 w-full origin-top rounded-md border border-gray-200 bg-white shadow-lg p-1 transition-all duration-200 ${
                roleOpen
                  ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
                  : "opacity-0 scale-95 -translate-y-1 pointer-events-none"
              }`}
            >
              {[
                { value: "all", label: "All Roles" },
                { value: "basic", label: "Basic" },
                { value: "staff", label: "Staff" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setRoleFilter(opt.value);
                    setPage(0);
                    setRoleOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-[13px] rounded-md transition-colors cursor-pointer capitalize ${
                    roleFilter === opt.value
                      ? "bg-blue-50 text-blue-700 font-medium"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Staff Table ── */}
        {/* Table always renders; loading + empty states live inside the tbody. */}
        <div className="bg-white overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
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
                    Employee Name {SortIcon({ colKey: "name" })}
                  </span>
                </th>
                <th className="text-left pb-3 pt-3 px-4 font-medium">Email</th>
                <th className="text-left pb-3 pt-3 px-4 font-medium">Phone</th>
                <th className="text-center pb-3 pt-3 px-4 font-medium">Role</th>
                <th className="text-center pb-3 pt-3 px-4 font-medium">
                  Status
                </th>
                <th className="text-right pb-3 pt-3 px-4 font-medium">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-16">
                    <div className="flex items-center justify-center gap-2 text-gray-400">
                      <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                      <span className="text-sm">Loading staff...</span>
                    </div>
                  </td>
                </tr>
              ) : paged.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="text-center py-2 text-sm text-gray-400"
                  >
                    <div className="flex flex-col items-center justify-center py-12">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                        <UserCog size={28} className="text-gray-500" />
                      </div>
                      <p className="text-sm font-medium text-gray-500">
                        No staff members found
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Click &ldquo;Add New Staff&rdquo; to get started
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paged.map((staffMember, idx) => (
                  <tr
                    key={staffMember._id}
                    onClick={() =>
                      router.push(`/records/employee/${staffMember._id}`)
                    }
                    className="border-b border-gray-50 last:border-0 cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-3 px-4 text-gray-400 text-xs">
                      {page * pageSize + idx + 1}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-gray-900 text-xs">
                        {staffMember.name || "—"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 text-xs text-gray-600">
                        <Mail className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                        {staffMember.email || "—"}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 text-xs text-gray-600">
                        <Phone className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                        {staffMember.phone || "—"}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs text-center">
                      <RoleBadge role={staffMember.role} />
                    </td>
                    <td className="py-3 px-4 text-xs text-center">
                      <StatusBadge deactivated={staffMember.isDeactivated} />
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
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              page === 0
                ? "text-gray-300 cursor-not-allowed"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            <ChevronLeft size={14} />
            Previous
          </button>

          <span className="text-xs text-gray-400 font-medium">
            Page {page + 1} of {totalPages} · {sorted.length} staff members
          </span>

          <button
            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
            disabled={page >= totalPages - 1}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              page >= totalPages - 1
                ? "text-gray-300 cursor-not-allowed"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            Next
            <ChevronRight size={14} />
          </button>
        </div>

        {/* ── Add/Edit Modal ─────────────────────────────────── */}
        <StaffFormModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          isEdit={!!editStaff}
          form={form}
          errors={formErrors}
          onChange={set}
          onSave={handleSave}
          saving={saving}
        />

        {/* ── Delete Confirmation ────────────────────────────── */}
        <DeleteConfirmDialog
          open={!!deleteConfirm}
          onOpenChange={(o) => !o && !deleting && setDeleteConfirm(null)}
          icon={UserRound}
          title="Delete employee?"
          description={
            deleteTarget?.name
              ? `“${deleteTarget.name}”${
                  deleteTarget.email ? ` (${deleteTarget.email})` : ""
                } will be permanently removed.`
              : "This employee will be permanently removed."
          }
          warning="This action cannot be undone."
          onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
          isPending={deleting}
        />
      </div>
    </div>
  );
}
