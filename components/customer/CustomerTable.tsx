"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Edit3,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Users,
} from "lucide-react";
import { Customer } from "./customer-columns";
import { getCustomerImageUrl } from "@/lib/types/customer";
import { CustomerAvatar } from "./CustomerAvatar";
import CustomerDetailModal from "./CustomerDetailModal";
import EditCustomerModal from "./EditCustomerModal";
import LoyaltyPointModal from "./LoyaltyPointModal";
import DeleteCustomerModal from "./DeleteCustomerModal";
import LoadingState from "@/components/ui/LoadingState";
import PhotoViewer from "@/components/ui/PhotoViewer";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";
import ColumnPicker, {
  readStoredColumns,
  storeColumns,
  type TableColumn,
} from "@/components/ui/ColumnPicker";
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
const NO_TIER_STYLE =
  "bg-gray-50 text-gray-500 border-gray-200 dark:bg-white/5 dark:text-[#9aa6bd] dark:border-white/15";

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

// The mark itself now lives in `components/ui`, where the landing page
// and the help page can reach it without importing this table.
export { WhatsAppIcon };

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

/**
 * Columns in the order they are drawn. Actions is locked: it holds edit and
 * delete, and taking it away removes what a row can do rather than what it
 * shows.
 */
const CUSTOMER_COLUMNS: TableColumn[] = [
  { key: "profile", label: "Profile" },
  { key: "name", label: "Customer Name" },
  { key: "loyaltyStatus", label: "Loyalty Status" },
  { key: "points", label: "Points" },
  { key: "purchases", label: "Purchases" },
  { key: "dueAmount", label: "Due Amount" },
  { key: "contact", label: "Contact" },
  { key: "actions", label: "Actions", locked: true },
];

/**
 * Each column's width. Declared rather than measured: with auto layout the
 * columns were sized from whatever rows were on screen, so filtering or
 * paging moved every one of them. Customer Name is left out on purpose — it
 * takes the remaining space.
 */
const COLUMN_WIDTHS: Record<string, string> = {
  profile: "w-25",
  loyaltyStatus: "w-32",
  points: "w-45",
  purchases: "w-28",
  dueAmount: "w-32",
  contact: "w-32",
  actions: "w-25",
};

const COLUMNS_STORAGE_KEY = "rebuzz-customer-table-columns";
const MIN_COLUMNS = 3;

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
  /** The photo being shown full-size, if any. */
  const [photoTarget, setPhotoTarget] = useState<{
    src: string | null;
    name: string;
  } | null>(null);
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

  // Initialiser, not an effect: reading storage in an effect renders one frame
  // with the wrong columns, and this repo's lint rules forbid it besides.
  const [visibleColumns, setVisibleColumns] = useState<string[]>(() =>
    readStoredColumns(COLUMNS_STORAGE_KEY, CUSTOMER_COLUMNS, MIN_COLUMNS),
  );

  const shownColumns = new Set(visibleColumns);
  const showColumn = (key: string) =>
    shownColumns.has(key) ||
    CUSTOMER_COLUMNS.some((c) => c.key === key && c.locked);

  // The loading and empty rows span the whole table, so this has to move with
  // whichever headers are actually rendered. It was a hard-coded 9 against
  // eight columns.
  const colCount = CUSTOMER_COLUMNS.filter((c) => showColumn(c.key)).length;

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
    <>
      {/* Search + column picker */}
      <div className="mb-4 mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#7b869b]"
          />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            placeholder="Search by name, email or phone..."
            className="w-full pl-9 pr-4 py-2.5 text-[13px] border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition dark:border-white/15 dark:bg-white/5 dark:text-[#e8ecf4] dark:placeholder:text-[#7b869b]"
          />
        </div>

        <ColumnPicker
          columns={CUSTOMER_COLUMNS}
          visible={visibleColumns}
          onChange={handleColumnsChange}
          minVisible={MIN_COLUMNS}
          className="w-full sm:w-[150px]"
        />
      </div>

      {/* Table — horizontally scrollable on mobile */}
      {/* <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto"> */}
      <div className="bg-white overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] dark:bg-transparent">
        <table
          className="w-full table-fixed text-sm"
          // Scales with what is actually shown. A fixed floor sized for every
          // column left a horizontal scrollbar over empty space once a few
          // were hidden.
          style={{ minWidth: `${Math.max(640, colCount * 150)}px` }}
        >
          {/* Built from the visible columns, in the same order the header
              draws them, so hiding one drops its track with it. Customer Name
              carries no width: it takes the slack. */}
          <colgroup>
            {CUSTOMER_COLUMNS.filter((column) => showColumn(column.key)).map(
              (column) => (
                <col key={column.key} className={COLUMN_WIDTHS[column.key]} />
              ),
            )}
          </colgroup>
          <thead>
            <tr className="border-b text-[11px] tracking-wider border-[#e8eaed] dark:border-white/10 text-[#5f6368] dark:text-[#a9b4c7]">
              {/* <th className="text-left pb-3 pt-3 px-4 font-medium w-12">
                S.No
              </th> */}
              {/* No label: the column is one 32px avatar wide, and "Photo"
                  over it would be wider than the thing it names. */}
              {/* <th className="w-12 pb-3 pt-3 px-4 font-medium" /> */}
              {showColumn("profile") && (
                <th className=" text-left pb-3 pt-3 px-4 font-normal cursor-pointer select-none hover:text-gray-600 dark:hover:text-[#e8ecf4]">
                  Profile
                </th>
              )}
              {showColumn("name") && (
                <th
                  className="text-left pb-3 pt-3 px-4 font-normal cursor-pointer select-none hover:text-gray-600 dark:hover:text-[#e8ecf4]"
                  onClick={() => toggleSort("name")}
                >
                  <span className="flex items-center gap-1">
                    Customer Name {SortIcon({ colKey: "name" })}
                  </span>
                </th>
              )}

              {showColumn("loyaltyStatus") && (
                <th className="text-center pb-3 pt-3 px-4 font-normal">
                  Loyalty Status
                </th>
              )}
              {showColumn("points") && (
                <th className="text-right pb-3 pt-3 pl-4 pr-8 font-normal ">
                  Points
                  <span className="ml-0.5 text-[9px] text-gray-400 dark:text-[#7b869b]">
                    ( pts )
                  </span>
                </th>
              )}

              {showColumn("purchases") && (
                <th className="text-center pb-3 pt-3 px-4 font-normal">
                  Purchases
                </th>
              )}

              {showColumn("dueAmount") && (
                <th className="text-right pb-3 pt-3 px-4 font-normal">
                  Due Amount
                </th>
              )}
              {showColumn("contact") && (
                <th className="text-right pb-3 pt-3 px-4 font-normal">
                  Contact
                </th>
              )}
              <th className="text-right pb-3 pt-3 px-4 font-normal">Actions</th>
            </tr>
          </thead>
          <tbody>
            {/* Loading lives in the tbody so the header row and the
                controls above stay visible, matching the settings
                tables. */}
            {isLoading ? (
              <tr>
                <td colSpan={colCount}>
                  <LoadingState message="Loading customers..." />
                </td>
              </tr>
            ) : paged.length === 0 ? (
              <tr>
                <td
                  colSpan={colCount}
                  className="text-center py-2 text-sm text-gray-400 dark:text-[#9aa6bd]"
                >
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3 dark:bg-white/10">
                      <Users
                        size={24}
                        className="text-gray-500 dark:text-[#9aa6bd]"
                      />
                    </div>
                    <p className="text-sm font-medium text-gray-500 dark:text-[#c3ccdc]">
                      No customers found
                    </p>
                    <p className="text-xs text-gray-400 mt-1 dark:text-[#7b869b]">
                      Customers you add will appear here.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              paged.map((customer) => (
                <tr
                  key={customer.id}
                  onClick={() => handleRowClick(customer)}
                  className="border-b border-gray-50 last:border-0 cursor-pointer hover:bg-gray-50 transition-colors dark:border-white/5 dark:hover:bg-white/5"
                >
                  {/* <td className="py-3 px-4 text-gray-400 text-xs">
                    {page * pageSize + idx + 1}
                  </td> */}

                  {/* The row opens the customer; the photo opens the photo.
                      Without stopping propagation the click would do both,
                      and the navigation would win. */}
                  {showColumn("profile") && (
                    <td
                      className="py-3 px-4"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <CustomerAvatar
                        src={getCustomerImageUrl(customer.image)}
                        name={customer.name}
                        className="h-9 w-9"
                        textClass="text-[11px]"
                        // `CustomerAvatar` only wires this up when it has a real
                        // photo, so the initials fallback keeps a plain cursor
                        // rather than promising a picture that is not there.
                        onClick={() =>
                          setPhotoTarget({
                            src: getCustomerImageUrl(customer.image),
                            name: customer.name,
                          })
                        }
                      />
                    </td>
                  )}

                  {showColumn("name") && (
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span
                          className="truncate text-[13px] font-medium text-[#3c4043] dark:text-[#e8ecf4]"
                          title={customer.name}
                        >
                          {customer.name}
                        </span>
                        {customer.isDeactivated && (
                          <span className="text-xs text-red-500 dark:text-[#f87171]">
                            Inactive
                          </span>
                        )}
                      </div>
                    </td>
                  )}

                  {showColumn("loyaltyStatus") && (
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
                  )}

                  {showColumn("points") && (
                    <td className="py-3 px-4 text-xs text-right">
                      <div
                        className="gap-1.5 items-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span className="font-medium text-[13px] tracking-wide  text-[#3c4043] dark:text-[#e8ecf4]">
                          {/* {formatAmount(customer.loyaltyPoint, currency.locale)}{" "} */}
                          {formatAmount(
                            customer.loyaltyPoint ?? 0,
                            currency.locale,
                          )}
                          <span className=" ml-1 text-[9px] text-gray-400 dark:text-[#7b869b]">
                            pts
                          </span>
                        </span>

                        <button
                          onClick={() => {
                            setLoyaltyCustomer(customer);
                            setLoyaltyOpen(true);
                          }}
                          className="p-1 px-2 text-blue-300 hover:text-cyan-500 hover:bg-cyan-50 rounded-md transition-colors cursor-pointer dark:text-[#7ba2e3] dark:hover:bg-cyan-400/15 dark:hover:text-cyan-300"
                          title="Update loyalty points"
                        >
                          <Edit3 className="h-3 w-3" />
                        </button>
                      </div>
                    </td>
                  )}

                  {showColumn("purchases") && (
                    <td className="py-3 px-4 text-xs text-center font-medium tracking-wide  text-[#3c4043] dark:text-[#e8ecf4]">
                      {customer.numberOfPurchases ?? "—"}
                    </td>
                  )}

                  {showColumn("dueAmount") && (
                    <td className="py-3 px-4 text-[13px] text-right tracking-wide font-medium text-[#3c4043] dark:text-[#e8ecf4]">
                      {customer.totalDueAmount !== undefined
                        ? formatCurrencySymbol(
                            customer.totalDueAmount,
                            currency.symbol,
                            currency.locale,
                          )
                        : "—"}
                    </td>
                  )}

                  {showColumn("contact") && (
                    <td
                      className="py-3 px-4 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {customer.phone ? (
                        <a
                          href={whatsappLink(customer.phone)}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={`Chat on WhatsApp — ${customer.phone}`}
                          className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-green-600 hover:bg-green-50 transition-colors dark:text-emerald-300 dark:hover:bg-emerald-400/15"
                        >
                          <WhatsAppIcon className="h-4 w-4" />
                        </a>
                      ) : (
                        <span className="text-gray-300 dark:text-[#6b7588]">
                          —
                        </span>
                      )}
                    </td>
                  )}

                  <td className="py-3 px-4">
                    <div
                      className="flex items-center justify-end gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={(e) => handleEdit(e, customer)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors dark:text-[#7b869b] dark:hover:bg-blue-400/15 dark:hover:text-[#a8c4ee]"
                        title="Edit customer"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(customer)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors dark:text-[#7b869b] dark:hover:bg-red-400/15 dark:hover:text-[#f87171]"
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
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 dark:border-white/10">
        <button
          onClick={() => setPage(Math.max(0, page - 1))}
          disabled={page === 0}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            page === 0
              ? "text-gray-300 cursor-not-allowed dark:text-[#6b7588]"
              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-[#a9b4c7] dark:hover:bg-white/10 dark:hover:text-[#e8ecf4]"
          }`}
        >
          <ChevronLeft size={14} />
          Previous
        </button>

        <span className="text-xs text-gray-400 font-medium dark:text-[#9aa6bd]">
          Page {page + 1} of {totalPages} · {sorted.length} customers
        </span>

        <button
          onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
          disabled={page >= totalPages - 1}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            page >= totalPages - 1
              ? "text-gray-300 cursor-not-allowed dark:text-[#6b7588]"
              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-[#a9b4c7] dark:hover:bg-white/10 dark:hover:text-[#e8ecf4]"
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

      <PhotoViewer
        open={!!photoTarget}
        src={photoTarget?.src ?? null}
        alt={photoTarget?.name ?? ""}
        onClose={() => setPhotoTarget(null)}
      />
    </>
  );
}
