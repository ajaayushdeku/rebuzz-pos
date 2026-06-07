"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Search,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Pencil,
  Loader2,
} from "lucide-react";
import { Customer } from "./customer-columns";
import CustomerDetailModal from "./CustomerDetailModal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";

const TIER_STYLES: Record<string, string> = {
  Bronze: "bg-amber-100 text-amber-800 border-amber-200",
  Silver: "bg-slate-200 text-slate-800 border-slate-300",
  Gold: "bg-yellow-100 text-yellow-800 border-yellow-300",
  Platinum: "bg-indigo-100 text-indigo-800 border-indigo-300",
};

function TierBadge({ tier }: { tier: string }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${TIER_STYLES[tier] || "bg-gray-100 text-gray-700 border-gray-200"}`}
    >
      {tier}
    </span>
  );
}

type SortConfig = { key: string; direction: "asc" | "desc" } | null;

const inputClass =
  "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition";

type EditForm = {
  name: string;
  email: string;
  phone: string;
  countryCode: string;
  note: string;
  customerPan: string;
};

function EditCustomerModal({
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
  const [form, setForm] = useState<EditForm>({
    name: customer?.name ?? "",
    email: customer?.email ?? "",
    phone: customer?.phone ?? "",
    countryCode: "NP +977",
    note: "",
    customerPan: "",
  });

  // Sync form when customer changes
  useEffect(() => {
    if (customer) {
      setForm({
        name: customer.name ?? "",
        email: customer.email ?? "",
        phone: customer.phone ?? "",
        countryCode: "NP +977",
        note: "",
        customerPan: "",
      });
    }
  }, [customer]);

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

  const fields: { key: keyof EditForm; label: string; type?: string }[] = [
    { key: "name", label: "Full Name" },
    { key: "email", label: "Email", type: "email" },
    { key: "phone", label: "Phone", type: "tel" },
    { key: "countryCode", label: "Country Code" },
    { key: "customerPan", label: "PAN Number" },
    { key: "note", label: "Note" },
  ];

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-gray-900">
            Edit Customer
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-1">
          {fields.map(({ key, label, type }) => (
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
                placeholder={label}
                className={inputClass}
              />
            </div>
          ))}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={saving}
            className="text-sm rounded-lg"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg"
          >
            {saving ? (
              <span className="flex items-center gap-1.5">
                <Loader2 size={13} className="animate-spin" />
                Saving...
              </span>
            ) : (
              "Save Changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LoyaltyPointModal({
  customer,
  open,
  onClose,
}: {
  customer: Customer | null;
  open: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [points, setPoints] = useState("");
  const [saving, setSaving] = useState(false);

  // Sync when customer changes
  useEffect(() => {
    if (customer) setPoints(String(customer.loyaltyPoint ?? 0));
  }, [customer]);

  const handleSave = async () => {
    if (!customer?.id) return;
    const value = parseFloat(points);
    if (isNaN(value) || value < 0) {
      toast.error("Enter a valid point value");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/customers/${customer.id}/loyalty-point`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loyaltyPoint: value }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Loyalty points updated");
      queryClient.invalidateQueries({ queryKey: ["customers-list"] });
      onClose();
    } catch {
      toast.error("Failed to update loyalty points");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-gray-900">
            Update Loyalty Points
          </DialogTitle>
        </DialogHeader>

        {customer && (
          <p className="text-xs text-gray-400 -mt-2">
            Customer:{" "}
            <span className="font-medium text-gray-700">{customer.name}</span>
          </p>
        )}

        <div className="py-1">
          <label className="text-xs font-medium text-gray-500 block mb-1.5">
            Loyalty Points
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
              ★
            </span>
            <input
              type="number"
              min={0}
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              className="w-full pl-7 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              placeholder="0"
            />
          </div>
          {customer && (
            <p className="text-xs text-gray-400 mt-1.5">
              Current: {customer.loyaltyPoint ?? 0} pts
            </p>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={saving}
            className="text-sm rounded-lg"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg"
          >
            {saving ? (
              <span className="flex items-center gap-1.5">
                <Loader2 size={13} className="animate-spin" />
                Saving...
              </span>
            ) : (
              "Update Points"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function CustomerTable({
  customers,
}: {
  customers: Customer[];
}) {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [loyaltyCustomer, setLoyaltyCustomer] = useState<Customer | null>(null);
  const [loyaltyOpen, setLoyaltyOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [page, setPage] = useState(0);
  const pageSize = 10;

  const handleRowClick = (customer: Customer) => {
    setSelectedCustomer(customer);
    setModalOpen(true);
  };

  const handleEdit = (e: React.MouseEvent, customer: Customer) => {
    e.stopPropagation();
    setEditCustomer(customer);
    setEditOpen(true);
  };

  const filtered = useMemo(() => {
    if (!search) return customers;
    const q = search.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        c.phone.includes(q),
    );
  }, [customers, search]);

  const sorted = useMemo(() => {
    if (!sortConfig) return filtered;
    return [...filtered].sort((a, b) => {
      const aVal = String((a as Record<string, unknown>)[sortConfig.key] ?? "");
      const bVal = String((b as Record<string, unknown>)[sortConfig.key] ?? "");
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
    <>
      {/* Search */}
      <div className="relative mb-4">
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

      {/* Table — horizontally scrollable on mobile */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
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
                  Customer Name {SortIcon({ colKey: "name" })}
                </span>
              </th>
              <th className="text-center pb-3 pt-3 px-4 font-medium">
                Loyalty Status
              </th>
              <th className="text-center pb-3 pt-3 px-4 font-medium">Points</th>

              <th className="text-center pb-3 pt-3 px-4 font-medium">
                Purchases
              </th>

              <th className="text-center pb-3 pt-3 px-4 font-medium">
                Due Amount
              </th>
              <th className="text-right pb-3 pt-3 px-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="text-center py-12 text-sm text-gray-400"
                >
                  No customers found
                </td>
              </tr>
            ) : (
              paged.map((customer, idx) => (
                <tr
                  key={customer.id}
                  onClick={() => handleRowClick(customer)}
                  className="border-b border-gray-50 last:border-0 cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <td className="py-3 px-4 text-gray-400 text-xs">
                    {page * pageSize + idx + 1}
                  </td>

                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">
                        {customer.name}
                      </span>
                      {customer.isDeactivated && (
                        <span className="text-xs text-red-500">Inactive</span>
                      )}
                    </div>
                  </td>

                  <td className="py-3 px-4 text-center">
                    <TierBadge tier={customer.loyaltyStatus} />
                  </td>

                  <td className="py-3 px-4 text-center">
                    <div
                      className="gap-1.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="font-semibold text-gray-800">
                        {customer.loyaltyPoint}
                      </span>

                      <button
                        onClick={() => {
                          setLoyaltyCustomer(customer);
                          setLoyaltyOpen(true);
                        }}
                        className="p-1 px-2 text-blue-300 hover:text-orange-500 hover:bg-orange-50 rounded-md transition-colors"
                        title="Update loyalty points"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                    </div>
                  </td>

                  <td className="py-3 px-4 text-center text-gray-600">
                    {customer.numberOfPurchases ?? "—"}
                  </td>

                  <td className="py-3 px-4 text-center font-semibold">
                    {customer.totalDueAmount !== undefined
                      ? `$${customer.totalDueAmount.toFixed(2)}`
                      : "—"}
                  </td>
                  <td className="py-3 px-4">
                    <div
                      className="flex items-center justify-end"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={(e) => handleEdit(e, customer)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit customer"
                      >
                        <Pencil className="h-3.5 w-3.5" />
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
          Page {page + 1} of {totalPages} · {sorted.length} customers
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

      <CustomerDetailModal
        customer={selectedCustomer}
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedCustomer(null);
        }}
      />

      <EditCustomerModal
        customer={editCustomer}
        open={editOpen}
        onClose={() => {
          setEditOpen(false);
          setEditCustomer(null);
        }}
      />

      <LoyaltyPointModal
        customer={loyaltyCustomer}
        open={loyaltyOpen}
        onClose={() => {
          setLoyaltyOpen(false);
          setLoyaltyCustomer(null);
        }}
      />
    </>
  );
}
