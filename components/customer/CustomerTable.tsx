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
  ChevronLeft,
  ChevronRight,
  Users,
} from "lucide-react";
import { Customer } from "./customer-columns";
import CustomerDetailModal from "./CustomerDetailModal";
import EditCustomerModal from "./EditCustomerModal";
import LoyaltyPointModal from "./LoyaltyPointModal";
import DeleteCustomerModal from "./DeleteCustomerModal";
import LoadingState from "@/components/ui/LoadingState";
import toast from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatAmount, formatCurrencySymbol } from "@/utils/helper";
import { useTierStyle } from "@/hooks/useLoyaltyTiers";

/**
 * Not a tier, so it is deliberately the quietest thing in the column — it
 * reads as "not banded" rather than as a rank of its own. Every real tier is
 * painted by the loyalty settings, so there is no table of names here.
 */
const NO_TIER_STYLE = "bg-gray-50 text-gray-500 border-gray-200";

/**
 * One tier badge.
 *
 * `className` carries the colours the loyalty settings assigned to that tier,
 * so a business's own tier names are painted the same here as they are on the
 * settings page. Without one — "No tier", or the render before the ladder
 * loads — the badge stays neutral rather than guessing at a colour.
 */
function TierBadge({ tier, className }: { tier: string; className?: string }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
        className ?? NO_TIER_STYLE
      }`}
    >
      {tier}
    </span>
  );
}

export function WhatsAppIcon({
  className,
  size,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      width={size}
      height={size}
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
    </svg>
  );
}

/**
 * Build a wa.me chat URL from a customer's phone. Numbers are stored without a
 * country code, so local 10-digit numbers are prefixed with Nepal's 977.
 */
export function whatsappLink(phone: string): string {
  const digits = (phone || "").replace(/\D/g, "");
  const full = digits.length === 10 ? `977${digits}` : digits;
  return `https://wa.me/${full}`;
}

type SortConfig = { key: string; direction: "asc" | "desc" } | null;

export default function CustomerTable({
  customers,
  isLoading = false,
}: {
  customers: Customer[];
  isLoading?: boolean;
}) {
  const router = useRouter();
  const { currency } = useCurrency();

  /**
   * The ladder, for its colours only.
   *
   * The tier NAME arrives already resolved on the customer — the mapper bands
   * against this same ladder — so re-deriving it here would be a second
   * implementation to keep in step. What the customer cannot carry is how the
   * settings page paints that tier, which is what this is for.
   */
  const tierStyle = useTierStyle();
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
      <div className="relative mb-4 mt-6">
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
              <th className="text-center pb-3 pt-3 px-4 font-medium">
                Contact
              </th>
              <th className="text-right pb-3 pt-3 px-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {/* Loading lives in the tbody so the header row and the
                controls above stay visible, matching the settings
                tables. */}
            {isLoading ? (
              <tr>
                <td colSpan={8}>
                  <LoadingState message="Loading customers..." />
                </td>
              </tr>
            ) : paged.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="text-center py-2 text-sm text-gray-400"
                >
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                      <Users size={24} className="text-gray-500" />
                    </div>
                    <p className="text-sm font-medium text-gray-500">
                      No customers found
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Customers you add will appear here.
                    </p>
                  </div>
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
                    {(() => {
                      // No configured colour — an unconfigured business, or
                      // the moment before the ladder loads — leaves TierBadge
                      // on its own palette, so the column never goes blank.
                      const style = tierStyle(customer.loyaltyStatus);
                      return (
                        <TierBadge
                          tier={customer.loyaltyStatus}
                          className={
                            style
                              ? `${style.bgColor} ${style.color}`
                              : undefined
                          }
                        />
                      );
                    })()}
                  </td>

                  <td className="py-3 px-4 text-xs text-center">
                    <div
                      className="gap-1.5 items-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="font-semibold text-gray-800 ">
                        {/* {formatAmount(customer.loyaltyPoint, currency.locale)}{" "} */}
                        {(customer.loyaltyPoint ?? 0).toLocaleString()}
                        <span className=" ml-1 text-[9px] text-gray-400">
                          pts
                        </span>
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

                  <td
                    className="py-3 px-4 text-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {customer.phone ? (
                      <a
                        href={whatsappLink(customer.phone)}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={`Chat on WhatsApp — ${customer.phone}`}
                        className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-green-600 hover:bg-green-50 transition-colors"
                      >
                        <WhatsAppIcon className="h-4 w-4" />
                      </a>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
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

      <DeleteCustomerModal
        customer={deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        deleting={deleting}
        onConfirm={handleDelete}
      />
    </>
  );
}
