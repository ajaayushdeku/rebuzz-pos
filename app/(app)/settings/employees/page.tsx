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

import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import StaffFormModal from "@/components/settingsComponents/staffs/StaffFormModal";
import HeaderActionButton from "@/components/ui/HeaderActionButton";
import ColumnPicker, {
  readStoredColumns,
  storeColumns,
  type TableColumn,
} from "@/components/ui/ColumnPicker";
import { CHART_PALETTE } from "@/components/dashboardComponents/chartCard";

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
  /** Whether this employee's bills print without being asked to. */
  canAutoPrint?: boolean;
};

/**
 * One employee's auto-print switch.
 *
 * Disabled while its own request is in flight rather than spinning the whole
 * table: the other rows are independent, and locking them would make one slow
 * response look like a broken page.
 */
function AutoPrintToggle({
  enabled,
  saving,
  name,
  onToggle,
}: {
  enabled: boolean;
  saving: boolean;
  name: string;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={`Auto print for ${name || "employee"}`}
      title={enabled ? "Auto print is on" : "Auto print is off"}
      disabled={saving}
      onClick={onToggle}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 ${
        saving ? "cursor-wait opacity-60" : "cursor-pointer"
      } ${enabled ? "bg-blue-600" : "bg-gray-300"}`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform duration-200 ${
          enabled ? "translate-x-[19px]" : "translate-x-[3px]"
        }`}
      />
    </button>
  );
}

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

/**
 * Columns in the order they are drawn. Actions is locked: it holds edit and
 * delete, and taking it away removes what a row can do rather than what it
 * shows.
 */
const STAFF_COLUMNS: TableColumn[] = [
  { key: "serial", label: "S.No" },
  { key: "name", label: "Employee Name" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "role", label: "Role" },
  { key: "status", label: "Status" },
  { key: "autoPrint", label: "Auto print" },
  { key: "actions", label: "Actions", locked: true },
];

/**
 * Each column's width. Declared rather than measured: with auto layout the
 * columns were sized from whatever rows were on screen, so searching, paging
 * or a longer email moved every one of them. Employee Name is left out on
 * purpose — it takes the remaining space.
 */
const COLUMN_WIDTHS: Record<string, string> = {
  serial: "w-14",
  email: "w-64",
  phone: "w-36",
  role: "w-28",
  status: "w-28",
  autoPrint: "w-28",
  actions: "w-24",
};

const COLUMNS_STORAGE_KEY = "rebuzz-staff-table-columns";
const MIN_COLUMNS = 3;

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
  /** Rows with an auto-print request in flight, so each toggle waits alone. */
  const [autoPrintSaving, setAutoPrintSaving] = useState<Set<string>>(
    new Set(),
  );

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

  // ── Auto print ────────────────────────────────────────────────────────────
  /**
   * Flip an employee's auto-print, showing the new state straight away.
   *
   * The row is updated before the request and put back if it fails, rather
   * than re-fetching the whole list: a toggle that sits still for a round trip
   * gets clicked twice, and the second click asks for the opposite of what the
   * first one did.
   */
  const toggleAutoPrint = async (member: StaffMember) => {
    const next = !member.canAutoPrint;

    setAutoPrintSaving((prev) => new Set(prev).add(member._id));
    setStaff((prev) =>
      prev.map((s) =>
        s._id === member._id ? { ...s, canAutoPrint: next } : s,
      ),
    );

    try {
      const res = await fetch(`/api/staff/${member._id}/autoprint`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ canAutoPrint: next }),
      });
      if (!res.ok)
        throw new Error(await readError(res, "Failed to update auto print"));

      toast.success(
        next
          ? `Auto print enabled for ${member.name || "employee"}`
          : `Auto print disabled for ${member.name || "employee"}`,
      );
    } catch (err) {
      setStaff((prev) =>
        prev.map((s) =>
          s._id === member._id
            ? { ...s, canAutoPrint: member.canAutoPrint }
            : s,
        ),
      );
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setAutoPrintSaving((prev) => {
        const nextSet = new Set(prev);
        nextSet.delete(member._id);
        return nextSet;
      });
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

  // Initialiser, not an effect: reading storage in an effect renders one frame
  // with the wrong columns, and this repo's lint rules forbid it besides.
  const [visibleColumns, setVisibleColumns] = useState<string[]>(() =>
    readStoredColumns(COLUMNS_STORAGE_KEY, STAFF_COLUMNS, MIN_COLUMNS),
  );

  const shownColumns = new Set(visibleColumns);
  const showColumn = (key: string) =>
    shownColumns.has(key) ||
    STAFF_COLUMNS.some((c) => c.key === key && c.locked);

  // The loading and empty rows span the whole table, so this has to move with
  // whichever headers are actually rendered.
  const colCount = STAFF_COLUMNS.filter((c) => showColumn(c.key)).length;

  const handleColumnsChange = (next: string[]) => {
    setVisibleColumns(next);
    storeColumns(COLUMNS_STORAGE_KEY, next);
    // Sorting by a column you can no longer see leaves the rows in an order
    // with nothing on screen to explain it.
    setSortConfig((prev) => (prev && !next.includes(prev.key) ? null : prev));
  };

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

          <HeaderActionButton
            variant="dashed"
            icon={Plus}
            hideLabelOnMobile
            label="Add New Employee"
            onClick={openAdd}
          />
        </div>

        {/* ── Search + Filter ── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6 mt-6">
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

          <ColumnPicker
            columns={STAFF_COLUMNS}
            visible={visibleColumns}
            onChange={handleColumnsChange}
            minVisible={MIN_COLUMNS}
            className="w-full sm:w-[150px]"
          />
        </div>

        {/* ── Staff Table ── */}
        {/* Table always renders; loading + empty states live inside the tbody. */}
        <div className="bg-white overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <table
            className="w-full table-fixed text-sm"
            // Scales with what is actually shown. A fixed floor sized for
            // every column left a horizontal scrollbar over empty space
            // once a few were hidden.
            style={{ minWidth: `${Math.max(640, colCount * 150)}px` }}
          >
            {/* Built from the visible columns, in the same order the header
                draws them, so hiding one drops its track with it. */}
            <colgroup>
              {STAFF_COLUMNS.filter((column) => showColumn(column.key)).map(
                (column) => (
                  <col key={column.key} className={COLUMN_WIDTHS[column.key]} />
                ),
              )}
            </colgroup>
            <thead>
              <tr
                className="border-b text-[11px] tracking-wider"
                style={{
                  borderColor: CHART_PALETTE.grid,
                  color: CHART_PALETTE.axis,
                }}
              >
                {showColumn("serial") && (
                  <th className="text-left pb-3 pt-3 px-4 font-normal">
                    S.No.
                  </th>
                )}
                {showColumn("name") && (
                  <th
                    className="text-left pb-3 pt-3 px-4 font-normal cursor-pointer select-none hover:text-gray-600"
                    onClick={() => toggleSort("name")}
                  >
                    <span className="flex items-center gap-1">
                      Employee Name {SortIcon({ colKey: "name" })}
                    </span>
                  </th>
                )}
                {showColumn("email") && (
                  <th className="text-left pb-3 pt-3 px-4 font-normal">
                    Email
                  </th>
                )}
                {showColumn("phone") && (
                  <th className="text-left pb-3 pt-3 px-4 font-normal">
                    Phone
                  </th>
                )}
                {showColumn("role") && (
                  <th className="text-center pb-3 pt-3 px-4 font-normal">
                    Role
                  </th>
                )}
                {showColumn("status") && (
                  <th className="text-center pb-3 pt-3 px-4 font-normal">
                    Status
                  </th>
                )}
                {showColumn("autoPrint") && (
                  <th className="text-center pb-3 pt-3 px-4 font-normal">
                    Auto print
                  </th>
                )}
                <th className="text-right pb-3 pt-3 px-4 font-normal">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={colCount} className="text-center py-16">
                    <div className="flex items-center justify-center gap-2 text-gray-400">
                      <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                      <span className="text-sm">Loading staff...</span>
                    </div>
                  </td>
                </tr>
              ) : paged.length === 0 ? (
                <tr>
                  <td
                    colSpan={colCount}
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
                    {showColumn("serial") && (
                      <td className="py-3 px-4 text-gray-400 text-[11px]">
                        {page * pageSize + idx + 1}
                      </td>
                    )}
                    {showColumn("name") && (
                      <td className="py-3 px-4">
                        <span
                          className="font-medium  text-[13px]"
                          style={{ color: CHART_PALETTE.title }}
                        >
                          {staffMember.name || "—"}
                        </span>
                      </td>
                    )}
                    {showColumn("email") && (
                      <td className="py-3 px-4">
                        <div
                          className="flex items-center gap-1.5 text-xs"
                          style={{ color: CHART_PALETTE.title }}
                        >
                          <Mail className="h-3.5 w-3.5 shrink-0 text-gray-500" />
                          {staffMember.email || "—"}
                        </div>
                      </td>
                    )}
                    {showColumn("phone") && (
                      <td className="py-3 px-4">
                        <div
                          className="flex items-center gap-1.5 text-xs tracking-wide"
                          style={{ color: CHART_PALETTE.title }}
                        >
                          <Phone className="h-3.5 w-3.5 text-gray-500 shrink-0" />
                          {staffMember.phone || "—"}
                        </div>
                      </td>
                    )}
                    {showColumn("role") && (
                      <td className="py-3 px-4 text-xs text-center">
                        <RoleBadge role={staffMember.role} />
                      </td>
                    )}
                    {showColumn("status") && (
                      <td className="py-3 px-4 text-xs text-center">
                        <StatusBadge deactivated={staffMember.isDeactivated} />
                      </td>
                    )}

                    {/* Auto print */}
                    {showColumn("autoPrint") && (
                      <td
                        className="py-3 px-4 text-center"
                        // The row opens the employee elsewhere; a switch that
                        // navigated away as it was flipped would be unusable.
                        onClick={(e) => e.stopPropagation()}
                      >
                        <AutoPrintToggle
                          enabled={!!staffMember.canAutoPrint}
                          saving={autoPrintSaving.has(staffMember._id)}
                          name={staffMember.name}
                          onToggle={() => toggleAutoPrint(staffMember)}
                        />
                      </td>
                    )}
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
