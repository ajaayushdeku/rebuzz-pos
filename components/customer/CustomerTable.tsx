"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Pencil,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Customer } from "./customer-columns";
import CustomerDetailModal from "./CustomerDetailModal";
import EditCustomerModal from "./EditCustomerModal";
import LoyaltyPointModal from "./LoyaltyPointModal";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";

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

export default function CustomerTable({
  customers,
}: {
  customers: Customer[];
}) {
  const router = useRouter();
  const { currency } = useCurrency();
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
  const [deleteConfirm, setDeleteConfirm] = useState<Customer | null>(null);
  const [deleting, setDeleting] = useState(false);
  const queryClient = useQueryClient();
  const pageSize = 10;

  const handleRowClick = (customer: Customer) => {
    router.push(`/records/customers/${customer.id}`);
  };

  const handleEdit = (e: React.MouseEvent, customer: Customer) => {
    e.stopPropagation();
    setEditCustomer(customer);
    setEditOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteConfirm?.id) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/customers/${deleteConfirm.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          data.error || data.message || "Failed to delete customer",
        );
      }
      toast.success("Customer deleted successfully");
      setDeleteConfirm(null);
      // Refresh the customer list by invalidating queries or triggering a refetch
      queryClient.invalidateQueries({ queryKey: ["customers-list"] });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete customer",
      );
    } finally {
      setDeleting(false);
    }
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

      {/* Table â€” horizontally scrollable on mobile */}
      {/* <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto"> */}
      <div className="bg-white overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <table className="w-full text-sm min-w-[800px]">
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
                      <span className="font-medium text-xs text-gray-900">
                        {customer.name}
                      </span>
                      {customer.isDeactivated && (
                        <span className="text-xs text-red-500">Inactive</span>
                      )}
                    </div>
                  </td>

                  <td className="py-3 px-4 text-xs text-center font-semibold">
                    <TierBadge tier={customer.loyaltyStatus} />
                  </td>

                  <td className="py-3 px-4 text-xs text-center">
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

                  <td className="py-3 px-4 text-xs text-center text-gray-600">
                    {customer.numberOfPurchases ?? "â€”"}
                  </td>

                  <td className="py-3 px-4 text-xs text-center font-semibold">
                    {customer.totalDueAmount !== undefined
                      ? formatCurrencySymbol(
                          customer.totalDueAmount,
                          currency.symbol,
                          currency.locale,
                        )
                      : "â€”"}
                  </td>
                  <td className="py-3 px-4">
                    <div
                      className="flex items-center justify-end gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={(e) => handleEdit(e, customer)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit customer"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(customer)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete customer"
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
          Page {page + 1} of {totalPages} Â· {sorted.length} customers
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

      <CustomerDetailModal
        customer={selectedCustomer}
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedCustomer(null);
        }}
      />

      <EditCustomerModal
        key={editCustomer?.id ?? "no-edit-customer"}
        customer={editCustomer}
        open={editOpen}
        onClose={() => {
          setEditOpen(false);
          setEditCustomer(null);
        }}
      />

      <LoyaltyPointModal
        key={loyaltyCustomer?.id ?? "no-loyalty-customer"}
        customer={loyaltyCustomer}
        open={loyaltyOpen}
        onClose={() => {
          setLoyaltyOpen(false);
          setLoyaltyCustomer(null);
        }}
      />

      {/* â”€â”€ Delete Confirmation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {deleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
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
                Delete Customer?
              </h3>
              <p className="text-sm text-gray-500 mt-2">
                This action cannot be undone. The customer{" "}
                <span className="font-medium text-gray-700">
                  {deleteConfirm.name}
                </span>{" "}
                will be permanently removed.
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
                onClick={handleDelete}
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
    </>
  );
}
