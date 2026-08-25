import { Fragment, useState } from "react";

import { cn } from "@/lib/utils";
import { InvoiceItem, InvoiceItemsSelectorProps } from "@/lib/types/invoice";
import { ProductVariant } from "@/lib/types/product";

import {
  Trash2,
  CirclePlus,
  GripVertical,
  Check,
  ChevronsUpDown,
  Plus,
  X,
  Layers,
  TriangleAlert,
  LucideIcon,
  Percent,
  Receipt,
  Boxes,
  DollarSignIcon,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { TableCell, TableRow } from "@/components/ui/table";
import DiscountPickerModal from "./DiscountPickerModal";
import ProductDetailModal from "./ProductDetailModal";
import ProductFormModal from "@/components/product/ProductFormModal";
import {
  formatCurrencySymbol,
  formatCurrencySymbolOnly,
  formatNumber,
} from "@/utils/helper";
import { useCurrency } from "@/providers/CurrencyContext";

// ── Compact pill representation ───────────────────────────────────────────

type PillTone = "danger" | "warning" | "info" | "tax";

/** One badge on the pills row, in both its compact and full forms. */
type RowPill = {
  key: string;
  tone: PillTone;
  icon: LucideIcon;
  /** Screen-reader / tooltip text for the collapsed dot. */
  label: string;
  /** Draws attention — used for anything the user must act on. */
  pulse?: boolean;
  /** The full badge, shown on wide screens and inside the dot's popover. */
  element: React.ReactNode;
};

const DOT_TONE: Record<PillTone, string> = {
  danger: "bg-red-100 text-red-600 ring-red-300/70",
  warning: "bg-amber-100 text-amber-600 ring-amber-300/70",
  info: "bg-blue-100 text-blue-600 ring-blue-300/70",
  tax: "bg-rose-100 text-rose-600 ring-rose-400/80",
};

function PillDot({
  pill,
  isOpen,
  onToggle,
}: {
  pill: RowPill;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const Icon = pill.icon;

  return (
    <div className="flex shrink-0 items-center">
      <button
        type="button"
        aria-label={pill.label}
        aria-expanded={isOpen}
        title={pill.label}
        onClick={onToggle}
        className={cn(
          "grid h-5 w-5 shrink-0 place-items-center rounded-full ring-2 cursor-pointer",
          "transition-all duration-300 ease-out hover:scale-110",
          "focus:outline-none focus-visible:ring-offset-1",
          "motion-reduce:transition-none motion-reduce:hover:scale-100",
          DOT_TONE[pill.tone],
          isOpen && "scale-110 ring-offset-1",
          // Only pulse while collapsed — once it's open it has the user's
          // attention and a throbbing badge is just noise.
          pill.pulse && !isOpen && "animate-pulse",
        )}
      >
        <Icon className="h-3 w-3" strokeWidth={2.4} />
      </button>

      <div
        className={cn(
          "grid transition-all duration-300 ease-out",
          "motion-reduce:transition-none",
          isOpen ? "grid-cols-[1fr] opacity-100" : "grid-cols-[0fr] opacity-0",
        )}
      >
        <div className="overflow-hidden">
          <div
            className={cn(
              "pl-1.5 whitespace-nowrap transition-transform duration-300 ease-out",
              "motion-reduce:transition-none",
              isOpen ? "translate-x-0" : "-translate-x-2",
            )}
            // Collapsed content is inert: not tabbable, not clickable.
            {...(isOpen
              ? {}
              : ({ inert: true, "aria-hidden": true } as unknown as {
                  inert: boolean;
                  "aria-hidden": boolean;
                }))}
          >
            {pill.element}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Stock display ─────────────────────────────────────────────────────────

type StockLevel = "untracked" | "out" | "low" | "ok";

/**
 * How a stock count should read in the UI.
 *
 * `untracked` covers the two cases that both mean "no number worth showing":
 * the product doesn't use stocks at all, or the API returned no count for it.
 * Those are deliberately not rendered as "0" — an untracked product is not an
 * empty one.
 */
function stockLevel(
  tracksStock: boolean,
  inStock: number | undefined,
  lowStock: number | undefined,
): StockLevel {
  if (!tracksStock || inStock === undefined) return "untracked";
  if (inStock <= 0) return "out";
  // "out" is already returned above, so inStock >= 1 here and a lowStock of 0
  // can never match — no extra guard needed.
  if (lowStock !== undefined && inStock <= lowStock) return "low";
  return "ok";
}

const STOCK_TONE: Record<Exclude<StockLevel, "untracked">, string> = {
  out: "border-red-200 bg-red-50 text-red-600",
  low: "border-amber-200 bg-amber-50 text-amber-700",
  ok: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

/** Badge copy for a stock level — "12 in stock" / "3 left" / "Out of stock". */
function stockLabel(
  level: Exclude<StockLevel, "untracked">,
  inStock: number,
  locale: string,
): string {
  if (level === "out") return "Out of stock";
  const count = formatNumber(inStock, locale);
  return level === "low" ? `${count} left` : `${count} in stock`;
}

export default function InvoiceItemsSelector({
  products,
  items,
  onItemsChange,
  masterDiscounts,
  // onAddDiscount,
  // onRemoveDiscount,
  activeTax,
  // refetchProducts,
}: InvoiceItemsSelectorProps) {
  const { currency } = useCurrency();
  const [search, setSearch] = useState("");
  const [activeRowId, setActiveRowId] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  // Track which row's product popover is open (per-row, not shared)
  const [productPopoverRow, setProductPopoverRow] = useState<string | null>(
    null,
  );

  // Inside the component, add state:
  const [discountModalItemId, setDiscountModalItemId] = useState<string | null>(
    null,
  );
  const [productDetailModal, setProductDetailModal] = useState<{
    itemId: string;
    productName: string;
    isCustom: boolean;
  } | null>(null);

  // ── Variant picker state ──
  const [variantPicker, setVariantPicker] = useState<{
    itemId: string;
    productId: string;
    productName: string;
    variants: ProductVariant[];
  } | null>(null);

  // ── Stock validation errors per item ──
  const [stockErrors, setStockErrors] = useState<Record<string, string>>({});

  // Which collapsed pill is expanded, as "<itemId>:<pillKey>". One at a time
  // so an expanded badge never pushes another one off the row.
  const [expandedPill, setExpandedPill] = useState<string | null>(null);

  // ── Row reordering ──
  // Tracked by ID, never by index. Everything downstream — the existing-item
  // set, the raw-ticket lookup, the original-price fingerprints in
  // InvoiceForm — keys off `item.id`, so a row keeps its identity wherever it
  // sits. Reorder the array; never rebuild the objects.
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  /** Move `fromId` to `toId`'s position, preserving every object identity. */
  const moveRow = (fromId: string, toId: string) => {
    if (fromId === toId) return;
    const from = items.findIndex((i) => i.id === fromId);
    const to = items.findIndex((i) => i.id === toId);
    if (from === -1 || to === -1) return;

    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onItemsChange(next);
  };

  /** Keyboard equivalent — the grip is focusable, arrows shift the row. */
  const nudgeRow = (id: string, direction: -1 | 1) => {
    const from = items.findIndex((i) => i.id === id);
    const to = from + direction;
    if (from === -1 || to < 0 || to >= items.length) return;
    moveRow(id, items[to].id);
  };

  const netUnitPrice = (item: InvoiceItem) => {
    const perUnit = item.discounts.reduce((sum, dId) => {
      const d = masterDiscounts.find((m) => m._id === dId);
      if (!d) return sum;
      return (
        sum + (d.type === "percentage" ? (item.price * d.rate) / 100 : d.rate)
      );
    }, 0);
    return Math.max(0, item.price - perUnit);
  };

  const getStockWarning = (
    item: InvoiceItem,
  ): { type: "low" | "exceeded" | null; message: string } => {
    const product = products.find((p) => p.id === item.productId);
    if (!product || !product.usesStocks) {
      return { type: null, message: "" };
    }

    // If the item has a selected variant, check the variant's stock
    if (item.variantId && product.variants) {
      const variant = product.variants.find((v) => v.id === item.variantId);
      if (!variant) return { type: null, message: "" };

      const variantStock = variant.inStock ?? 0;
      const variantLow = variant.lowStock ?? 0;

      if (item.quantity > variantStock) {
        return {
          type: "exceeded",
          message: `Only ${formatNumber(variantStock, currency.locale)} in stock.`,
        };
      }

      if (
        variantLow > 0 &&
        item.quantity > 0 &&
        variantStock > 0 &&
        variantStock <= variantLow
      ) {
        return {
          type: "low",
          message: `Low stock: only ${formatNumber(variantStock, currency.locale)} remaining.`,
        };
      }

      return { type: null, message: "" };
    }

    // Non-variant product - check parent stock
    if (product.inStock === undefined) {
      return { type: null, message: "" };
    }

    if (item.quantity > product.inStock) {
      return {
        type: "exceeded",
        message: `Only ${formatNumber(product.inStock, currency.locale)} in stock.`,
      };
    }

    if (
      product.lowStock !== undefined &&
      item.quantity > 0 &&
      item.quantity >= product.inStock - product.lowStock &&
      product.inStock <= product.lowStock
    ) {
      return {
        type: "low",
        message: `Low stock: only ${formatNumber(product.inStock, currency.locale)} remaining.`,
      };
    }

    return { type: null, message: "" };
  };

  const validateStock = (item: InvoiceItem) => {
    const warning = getStockWarning(item);
    if (warning.type === "exceeded") {
      setStockErrors((prev) => ({ ...prev, [item.id]: warning.message }));
    } else {
      setStockErrors((prev) => {
        const next = { ...prev };
        delete next[item.id];
        return next;
      });
    }
  };

  const openCreateModal = (rowId: string) => {
    setActiveRowId(rowId);
    setCreateModalOpen(true);
  };

  const addItem = () => {
    onItemsChange([
      ...items,
      {
        id: crypto.randomUUID(),
        productId: "",
        name: "",
        description: "",
        quantity: 1,
        price: 0,
        discounts: [],
        taxes: [],
        isTaxable: false,
      },
    ]);
  };

  const updateItem = (
    id: string,
    field: keyof InvoiceItem,
    value: string | number,
  ) => {
    const updatedItems = items.map((item) => {
      if (item.id !== id) return item;
      const updated = { ...item, [field]: value };
      // Keep variantItems.quantity in sync when quantity changes
      if (field === "quantity" && updated.variantItems) {
        updated.variantItems = {
          ...updated.variantItems,
          quantity: Number(value),
        };
      }
      return updated;
    });
    onItemsChange(updatedItems);

    // Validate stock when quantity changes and product is set
    if (field === "quantity") {
      const updatedItem = updatedItems.find((i) => i.id === id);
      if (updatedItem && updatedItem.productId) {
        validateStock(updatedItem);
      }
    }
  };

  const handleProductSelect = (itemId: string, productName: string) => {
    const product = products.find((p) => p.name === productName);
    setStockErrors((prev) => {
      const next = { ...prev };
      delete next[itemId];
      return next;
    });

    // If the product has variants, open the variant picker
    if (product?.variants && product.variants.length > 0) {
      // Close the popover first so it doesn't overlap the variant picker
      setProductPopoverRow(null);
      setVariantPicker({
        itemId,
        productId: product.id,
        productName: product.name,
        variants: product.variants,
      });
      return;
    }

    const updatedItems = items.map((item) =>
      item.id !== itemId
        ? item
        : {
            ...item,
            name: productName,
            productId: product?.id ?? "",
            price: product?.price ?? 0,
            description: product?.description ?? "",
            discounts: product?.discounts || [],
            isTaxable: product?.isTaxable ?? false, // ← pass through
            taxes: [],
            variantId: undefined,
            variantLabel: undefined,
            variantItems: undefined,
          },
    );
    onItemsChange(updatedItems);

    // Validate stock on the updated item
    const updatedItem = updatedItems.find((i) => i.id === itemId);
    if (updatedItem) {
      validateStock(updatedItem);
    }

    // If no price set, open detail modal
    if (!product?.price || product.price === 0) {
      setProductDetailModal({
        itemId,
        productName,
        isCustom: productName.toLowerCase() === "custom",
      });
    }
  };

  /** Apply a selected variant to an item. */
  const handleVariantSelect = (variant: ProductVariant) => {
    if (!variantPicker) return;
    const { itemId, productId, productName } = variantPicker;
    const variantLabel = variant.optionValues.join(" · ");

    // Inherit the parent product's discounts
    const parentProduct = products.find((p) => p.id === productId);

    const updatedItems = items.map((item) =>
      item.id !== itemId
        ? item
        : {
            ...item,
            name: `${productName} (${variantLabel})`,
            productId,
            price: variant.price,
            description: variantLabel,
            discounts: parentProduct?.discounts || [],
            isTaxable: true,
            taxes: [],
            variantId: variant.id,
            variantLabel,
            variantItems: {
              _id: variant.id,
              name: variantLabel,
              unitPrice: variant.price,
              quantity: item.quantity,
              costPrice: variant.costPrice ?? 0,
            },
          },
    );
    onItemsChange(updatedItems);

    // Validate variant stock after selection
    const updatedItem = updatedItems.find((i) => i.id === itemId);
    if (updatedItem) {
      validateStock(updatedItem);
    }

    setVariantPicker(null);
  };

  const buildRowPills = (item: InvoiceItem): RowPill[] => {
    const pills: RowPill[] = [];
    const stockError = stockErrors[item.id];
    const product = products.find((p) => p.id === item.productId);

    // Stock exceeded
    if (stockError) {
      pills.push({
        key: "stock-exceeded",
        tone: "danger",
        icon: TriangleAlert,
        label: `Stock exceeded — ${stockError}`,
        pulse: true,
        element: (
          <Badge className="flex items-center gap-1 bg-red-100 text-red-700 hover:bg-red-200 text-xs">
            <span className="text-[11px] font-semibold  tracking-wider leading-none">
              Stock Exceeded,
            </span>
            <span className="text-[11px]  font-semibold  tracking-wider leading-none">
              {stockError}
            </span>
          </Badge>
        ),
      });
    }

    // Low stock
    if (
      item.productId &&
      !stockError &&
      product?.usesStocks &&
      product.inStock !== undefined &&
      product.lowStock !== undefined &&
      product.inStock > 0 &&
      product.inStock <= product.lowStock
    ) {
      pills.push({
        key: "low-stock",
        tone: "warning",
        icon: Boxes,
        label: `Low stock — ${product.inStock} left`,
        element: (
          <Badge className="flex items-center gap-1 bg-amber-100 text-amber-700 hover:bg-amber-200 text-xs border border-amber-200">
            <span className="text-[11px]  font-semibold  tracking-wider leading-none">
              Low Stock
            </span>
            <span className="text-[11px]  font-semibold  tracking-wider leading-none">
              ({product.inStock} left)
            </span>
          </Badge>
        ),
      });
    }

    // Discounts
    item.discounts.forEach((dId) => {
      const d = masterDiscounts.find((m) => m._id === dId);
      if (!d) return;

      const amount =
        d.type === "percentage"
          ? (item.quantity * item.price * d.rate) / 100
          : d.rate * item.quantity;

      pills.push({
        key: `discount-${dId}`,
        tone: "info",
        icon: d.type === "percentage" ? Percent : DollarSignIcon,
        label: `${d.name} — ${formatCurrencySymbolOnly(currency.symbol)} ${amount.toFixed(2)} off`,
        element: (
          <Badge className="flex items-center gap-1 bg-blue-100 text-blue-700 hover:bg-blue-200 text-xs">
            <span className="text-[11px] tracking-wider font-semibold leading-none">
              {d.name}
            </span>
            {d.type === "percentage" ? (
              <>
                <span className="text-[11px] font-semibold  tracking-wider text-blue-500 leading-none">
                  ({d.rate}%) :
                </span>
                <span className="text-[11px] font-semibold  tracking-wider leading-none">
                  - {formatCurrencySymbolOnly(currency.symbol)}{" "}
                  {amount.toFixed(2)}
                </span>
              </>
            ) : (
              <>
                <span className="text-[11px] font-semibold  tracking-wider text-blue-500 leading-none">
                  ({formatCurrencySymbolOnly(currency.symbol)} {d.rate} off) :
                </span>
                <span className="text-[11px] font-semibold  tracking-wider leading-none">
                  -{" "}
                  {formatCurrencySymbol(
                    Number(amount),
                    currency.symbol,
                    currency.locale,
                  )}{" "}
                </span>
              </>
            )}
            {/* <button
              type="button"
              className="ml-0.5 rounded-full hover:bg-blue-300 p-0.5 transition-colors"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onRemoveDiscount(item.id, dId);
              }}
            >
              <X className="w-2.5 h-2.5" />
            </button> */}
          </Badge>
        ),
      });
    });

    // Tax — only when product isTaxable AND global tax active
    if (item.isTaxable && activeTax) {
      const rowTotal = item.quantity * item.price;
      const discountTotal = item.discounts.reduce((sum, dId) => {
        const d = masterDiscounts.find((m) => m._id === dId);
        if (!d) return sum;
        return (
          sum +
          (d.type === "percentage"
            ? (rowTotal * d.rate) / 100
            : d.rate * item.quantity)
        );
      }, 0);
      const taxableAmount = Math.max(0, rowTotal - discountTotal);
      const taxAmount = (taxableAmount * activeTax.rate) / 100;

      pills.push({
        key: "tax",
        tone: "tax",
        icon: Receipt,
        label: `${activeTax.name} (${activeTax.rate}%) — ${formatCurrencySymbolOnly(currency.symbol)} ${taxAmount.toFixed(2)}`,
        element: (
          <Badge className="flex items-center gap-1 bg-rose-100 text-rose-700 hover:bg-rose-200 text-xs">
            <span className="text-[11px] font-semibold  tracking-wider leading-none">
              {activeTax.name}
            </span>
            <span className="text-[11px] text-rose-500  tracking-wider leading-none">
              ({activeTax.rate}%) :
            </span>
            <span className="text-[11px] font-medium  tracking-wider  leading-none">
              +{" "}
              {formatCurrencySymbol(
                Number(taxAmount),
                currency.symbol,
                currency.locale,
              )}{" "}
            </span>

            {/* X disables taxable on this item */}
            <button
              type="button"
              className="ml-0.5 rounded-full hover:bg-rose-300 p-0.5 transition-colors"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();

                onItemsChange(
                  items.map((i) =>
                    i.id === item.id ? { ...i, isTaxable: false } : i,
                  ),
                );
              }}
            >
              <X className="w-2.5 h-2.5" />
            </button>
          </Badge>
        ),
      });
    }

    return pills;
  };

  // ── Variant picker derived data ──
  // The picker only carries the variants themselves, but whether their stock
  // counts mean anything depends on the PARENT product's `usesStocks` flag —
  // so resolve the parent once here rather than per tile.
  const variantPickerTracksStock = variantPicker
    ? (products.find((p) => p.id === variantPicker.productId)?.usesStocks ??
      false)
    : false;

  return (
    <>
      {items.map((item) => {
        // Display-only: what a single unit actually costs after this row's
        // discounts. `item.price` is untouched.
        const discountedUnit = netUnitPrice(item);

        const showDiscountedUnit =
          item.discounts.length > 0 && discountedUnit < item.price;

        const rowPills = buildRowPills(item);

        return (
          // Keyed Fragment — the bare <> here meant every item pair was an
          // unkeyed array element, which React warns about and which makes rows
          // remount on reorder.
          <Fragment key={item.id}>
            <TableRow
              draggable={draggingId === item.id}
              onDragOver={(e) => {
                if (!draggingId) return;
                // Without preventDefault the browser refuses the drop.
                e.preventDefault();
                if (dragOverId !== item.id) setDragOverId(item.id);
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (draggingId) moveRow(draggingId, item.id);
                setDraggingId(null);
                setDragOverId(null);
              }}
              onDragEnd={() => {
                setDraggingId(null);
                setDragOverId(null);
              }}
              className={cn(
                "border-b-1 w-full align-top justify-start hover:bg-blue-50/60 transition-colors",
                draggingId === item.id && "opacity-40",
                dragOverId === item.id &&
                  draggingId !== item.id &&
                  "border-t-2 border-t-blue-400",
              )}
            >
              {/* Column widths are declared in BOTH this row and
                  AddInvoiceHeader — auto table layout takes the widest of the
                  pair, so an edit to one without the other silently does
                  nothing. Keep them in sync. */}
              <TableCell className="w-[28px] px-1 ">
                {/* The row is only draggable while the grip is held, so
                    dragging a number input doesn't start a row drag. */}
                <button
                  type="button"
                  aria-label={`Reorder ${item.name || "item"}`}
                  title="Drag to reorder — or focus and use ↑ / ↓"
                  onMouseDown={() => setDraggingId(item.id)}
                  onTouchStart={() => setDraggingId(item.id)}
                  onDragStart={(e) => {
                    setDraggingId(item.id);
                    e.dataTransfer.effectAllowed = "move";
                    // Firefox won't start a drag without payload data.
                    e.dataTransfer.setData("text/plain", item.id);
                  }}
                  onKeyDown={(e) => {
                    if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
                    e.preventDefault();
                    nudgeRow(item.id, e.key === "ArrowUp" ? -1 : 1);
                  }}
                  onBlur={() => setDraggingId(null)}
                  className="mt-1.5 cursor-grab rounded p-0.5 text-gray-300 transition hover:text-gray-500 active:cursor-grabbing focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  <GripVertical className="h-4 w-4" />
                </button>
              </TableCell>

              {/* Product selector */}
              <TableCell className="w-[32%] min-w-[190px]">
                {/* The pills sit under the selector in normal flow. Absolutely
                    positioned, they needed a bottom pad on every cell in the
                    row — which left a hole under any product that happens to
                    carry no badges, and put them outside the row's hover. */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-1">
                    <Input
                      value={item.name}
                      onChange={(e) =>
                        updateItem(item.id, "name", e.target.value)
                      }
                      placeholder="Product name"
                      className="flex-1 h-8 text-xs bg-white"
                    />

                    <Popover
                      open={productPopoverRow === item.id}
                      onOpenChange={(open) =>
                        setProductPopoverRow(open ? item.id : null)
                      }
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 shrink-0 border-gray-200"
                        >
                          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-72 p-0" align="start">
                        <Command>
                          <CommandInput
                            placeholder="Search product..."
                            value={search}
                            onValueChange={setSearch}
                          />
                          <CommandList>
                            <CommandEmpty className="p-0">
                              <div className="py-4 text-center text-xs">
                                No product found.
                              </div>
                              <Button
                                variant="secondary"
                                className="w-full rounded-none border-t flex items-center justify-start gap-2 px-4 py-2 text-xs"
                                onClick={() => openCreateModal(item.id)}
                              >
                                <Plus className="h-3 w-3" />
                                <span>Create &ldquo;{search}&rdquo;</span>
                              </Button>
                            </CommandEmpty>
                            <CommandGroup>
                              {products
                                .filter((product) => {
                                  // Variant products hold stock on their variants,
                                  // so skip the parent-level stock filter for them.
                                  if (
                                    product.variants &&
                                    product.variants.length > 0
                                  ) {
                                    return true;
                                  }
                                  if (
                                    product.usesStocks &&
                                    product.inStock !== undefined
                                  ) {
                                    return product.inStock > 0;
                                  }
                                  return true;
                                })
                                .map((product) => {
                                  const hasVariants =
                                    product.variants &&
                                    product.variants.length > 0;
                                  // A variant product holds no stock of its own —
                                  // its total is the sum across variants, which
                                  // the variant picker then breaks back down per
                                  // tile.
                                  const stockCount = hasVariants
                                    ? (product.variants ?? []).reduce(
                                        (sum, v) => sum + (v.inStock ?? 0),
                                        0,
                                      )
                                    : product.inStock;
                                  // An aggregate has no meaningful low-stock
                                  // threshold, so only a flat product can read as
                                  // "low" here.
                                  const level = stockLevel(
                                    product.usesStocks,
                                    stockCount,
                                    hasVariants ? undefined : product.lowStock,
                                  );
                                  return (
                                    <CommandItem
                                      key={product.id}
                                      value={product.name}
                                      onSelect={() =>
                                        handleProductSelect(
                                          item.id,
                                          product.name,
                                        )
                                      }
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-3.5 w-3.5",
                                          item.name === product.name
                                            ? "opacity-100"
                                            : "opacity-0",
                                        )}
                                      />
                                      <div className="flex flex-col flex-1">
                                        <div className="flex items-center gap-2">
                                          <span className="text-sm">
                                            {product.name}
                                          </span>
                                          {hasVariants && (
                                            <span className="inline-flex items-center gap-0.5 text-[9px] px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 border border-violet-200 font-medium whitespace-nowrap">
                                              {/* <Layers size={5} /> */}
                                              {product.variants?.length}{" "}
                                              variants
                                            </span>
                                          )}
                                          {level !== "untracked" && (
                                            <span
                                              className={cn(
                                                "text-[9px] px-2 py-0.5 rounded-full border font-medium whitespace-nowrap tabular-nums",
                                                STOCK_TONE[level],
                                              )}
                                            >
                                              {stockLabel(
                                                level,
                                                stockCount ?? 0,
                                                currency.locale,
                                              )}
                                            </span>
                                          )}
                                        </div>
                                        <span className="text-[11px] text-muted-foreground">
                                          {hasVariants
                                            ? `From ${formatCurrencySymbol(
                                                Math.min(
                                                  ...(product.variants?.map(
                                                    (v) => v.price,
                                                  ) ?? [0]),
                                                ),
                                                currency.symbol,
                                                currency.locale,
                                              )}`
                                            : formatCurrencySymbol(
                                                product.price,
                                                currency.symbol,
                                                currency.locale,
                                              )}
                                        </span>
                                      </div>
                                    </CommandItem>
                                  );
                                })}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Narrow: one dot per badge, full badge on hover/tap */}
                  {rowPills.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 lg:gap-2 pl-1">
                      {rowPills.map((pill) => {
                        const pillId = `${item.id}:${pill.key}`;
                        return (
                          <PillDot
                            key={pill.key}
                            pill={pill}
                            isOpen={expandedPill === pillId}
                            onToggle={() =>
                              setExpandedPill((cur) =>
                                cur === pillId ? null : pillId,
                              )
                            }
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              </TableCell>

              {/* Description */}
              <TableCell className="w-[24%] min-w-[150px]">
                <div className={`${rowPills.length > 0 && "mb-7"}`}>
                  <Input
                    value={item.description}
                    onChange={(e) =>
                      updateItem(item.id, "description", e.target.value)
                    }
                    placeholder="Description"
                    className="h-8 text-xs bg-white "
                  />
                </div>
              </TableCell>

              {/* Quantity */}
              <TableCell className="relative w-[84px] min-w-[84px]">
                <div className={`${rowPills.length > 0 && "mb-7"} relative`}>
                  <Input
                    type="number"
                    value={item.quantity}
                    onChange={(e) =>
                      updateItem(item.id, "quantity", Number(e.target.value))
                    }
                    className={cn(
                      "text-right bg-white h-8 text-[14px] sm:text-[12px] tracking-wider px-1.5 no-spinner tabular-nums",
                      stockErrors[item.id] &&
                        "border-red-400 focus-visible:ring-red-400",
                    )}
                  />
                  {stockErrors[item.id] && (
                    <span className="absolute right-0 mt-1 block text-right text-[9px] font-medium text-red-600 whitespace-nowrap">
                      Stock exceeded
                    </span>
                  )}
                </div>
              </TableCell>

              {/* Unit price */}
              <TableCell className="w-[104px] min-w-[104px] relative ">
                <div
                  className={`${rowPills.length > 0 && !showDiscountedUnit && "mb-7"} ${showDiscountedUnit && "mb-3"}`}
                >
                  <>
                    <span className="relative left-5 top-1/2 -translate-y-1/2 text-[14px] sm:text-[11px] text-slate-400">
                      {currency.symbol}
                    </span>
                    <Input
                      type="number"
                      value={item.price}
                      onChange={(e) =>
                        updateItem(item.id, "price", Number(e.target.value))
                      }
                      title={
                        showDiscountedUnit
                          ? `List price ${formatCurrencySymbolOnly(currency.symbol)} ${item.price.toFixed(2)} — ${formatCurrencySymbolOnly(currency.symbol)} ${discountedUnit.toFixed(2)} after discount`
                          : undefined
                      }
                      className={cn(
                        "text-right h-8 bg-white md:text-[14px] sm:text-[12px] tracking-wider px-1.5 no-spinner tabular-nums",
                        showDiscountedUnit && "text-gray-400 line-through",
                      )}
                    />
                  </>
                  {showDiscountedUnit && (
                    <p className="mt-1 text-right text-[13px] sm:text-[11px] font-semibold leading-none text-green-600 tabular-nums">
                      {formatCurrencySymbolOnly(currency.symbol)}{" "}
                      {discountedUnit.toFixed(2)}
                    </p>
                  )}
                </div>
              </TableCell>

              {/* Row total */}
              <TableCell className="w-[132px] min-w-[120px] text-right font-semibold text-[12px] md:text-[14px] text-gray-800 tabular-nums">
                <p className={`${rowPills.length > 0 && "mb-7"}`}>
                  {" "}
                  {formatCurrencySymbol(
                    (() => {
                      const rowSubtotal = item.quantity * item.price;
                      const rowDiscount = item.discounts.reduce((sum, dId) => {
                        const d = masterDiscounts.find((m) => m._id === dId);
                        if (!d) return sum;
                        return (
                          sum +
                          (d.type === "percentage"
                            ? (rowSubtotal * d.rate) / 100
                            : d.rate * item.quantity)
                        );
                      }, 0);
                      return rowSubtotal - rowDiscount;
                    })(),
                    currency.symbol,
                    currency.locale,
                  )}{" "}
                </p>
              </TableCell>

              {/* ── Discount column temporarily hidden ──
                  Paired with the matching <TableHead> in AddInvoiceHeader and
                  the pills-row colSpan below. Restore all three together. */}
              {/* <TableCell className="text-center w-[80px] min-w-[80px]">
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => setDiscountModalItemId(item.id)}
                    className="w-6 h-6 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600 flex items-center justify-center transition-colors"
                    title="Add discount"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </TableCell> */}

              {/* ── Taxable toggle ── */}
              <TableCell className="text-center w-[76px] min-w-[76px]">
                <div
                  className={`${rowPills.length > 0 && "mb-7"} flex justify-center`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      const newTaxable = !item.isTaxable;
                      onItemsChange(
                        items.map((i) =>
                          i.id === item.id
                            ? { ...i, isTaxable: newTaxable }
                            : i,
                        ),
                      );
                    }}
                    className={`relative inline-flex h-5 w-8 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
                      item.isTaxable ? "bg-blue-500" : "bg-gray-200"
                    }`}
                  >
                    <span
                      className={`inline-block h-3 w-3 transform rounded-full bg-white shadow transition-transform duration-200 ${
                        item.isTaxable
                          ? "translate-x-[16px]"
                          : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>
              </TableCell>

              {/* Delete */}
              <TableCell className="text-center w-[44px] min-w-[44px]">
                <button
                  className={`${rowPills.length > 0 && "mb-7"} text-gray-400 hover:text-red-500 transition-colors shrink-0`}
                  onClick={() =>
                    onItemsChange(items.filter((i) => i.id !== item.id))
                  }
                >
                  <Trash2 className="h-3.5 w-3.5 text-gray-400 hover:text-red-500" />
                </button>
              </TableCell>
            </TableRow>

            {/* ── Pills row — discount + tax badges ── */}
            {/* <TableRow className="border-b border-gray-100 hover:bg-gray-50/70 transition-colors">
              <TableCell className="w-6 px-1 pb-2 pt-0" />
              <TableCell colSpan={6} className="pb-3 pt-1">
                {rowPills.length > 0 && (
                  <>
                  
                    <div className="flex flex-wrap items-center gap-1.75 lg:gap-2  pl-1">
                      {rowPills.map((pill) => {
                        const pillId = `${item.id}:${pill.key}`;
                        return (
                          <PillDot
                            key={pill.key}
                            pill={pill}
                            isOpen={expandedPill === pillId}
                            onToggle={() =>
                              setExpandedPill((cur) =>
                                cur === pillId ? null : pillId,
                              )
                            }
                          />
                        );
                      })}
                    </div>
                  </>
                )}
              </TableCell>
              <TableCell className="w-8 pb-2 pt-0" />
            </TableRow> */}
          </Fragment>
        );
      })}

      <TableRow className="hover:bg-blue-50/70 transition-colors ">
        {/* 8 columns while Discount is hidden — 9 when it comes back. An
            over-long colSpan is clamped rather than erroring, which is why the
            stale 10 here went unnoticed. */}
        <TableCell colSpan={8} className="p-0">
          <button
            onClick={addItem}
            className="flex w-full items-center gap-2 text-blue-600 font-semibold text-sm hover:text-blue-700 transition-colors px-4 py-3"
          >
            <CirclePlus className="h-4 w-4" />
            Add an item
          </button>
        </TableCell>
      </TableRow>

      {/* ── Product creation modal (shared) ── */}
      <ProductFormModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        initialName={search}
        onSuccess={(result) => {
          if (activeRowId) {
            onItemsChange(
              items.map((item) =>
                item.id === activeRowId
                  ? {
                      ...item,
                      name: result.name,
                      productId: result.id,
                      price: result.price,
                      description: result.description,
                      isTaxable: result.isTaxable,
                    }
                  : item,
              ),
            );
          }
        }}
      />

      {/* Discount picker modal for this item */}
      {discountModalItemId && (
        <DiscountPickerModal
          open={!!discountModalItemId}
          onClose={() => setDiscountModalItemId(null)}
          discounts={masterDiscounts}
          selectedIds={
            items.find((i) => i.id === discountModalItemId)?.discounts ?? []
          }
          onApply={(ids) => {
            onItemsChange(
              items.map((i) =>
                i.id === discountModalItemId ? { ...i, discounts: ids } : i,
              ),
            );
          }}
          title="Apply Item Discounts"
        />
      )}

      {/* Product detail modal */}
      {productDetailModal && (
        <ProductDetailModal
          open={!!productDetailModal}
          onClose={() => setProductDetailModal(null)}
          initialName={productDetailModal.productName}
          isCustom={productDetailModal.isCustom}
          onConfirm={(name, price) => {
            onItemsChange(
              items.map((i) =>
                i.id === productDetailModal.itemId ? { ...i, name, price } : i,
              ),
            );
          }}
        />
      )}

      {/* ── Variant picker modal ── */}
      {variantPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 ">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="variant-picker-title"
            className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
              <div className="min-w-0">
                <h2
                  id="variant-picker-title"
                  className="text-base font-semibold text-slate-900"
                >
                  {variantPicker.productName}
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Select a variant to add to the invoice
                </p>
              </div>
              <button
                type="button"
                onClick={() => setVariantPicker(null)}
                aria-label="Close"
                className="-mr-1 -mt-1 shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* ── Variant list ──
                One full-width row per variant: label and price on the left,
                stock on the right, so the stock column lines up down the list
                and is scannable in one pass. */}
            <div className="max-h-80 overflow-y-auto px-3 py-3 space-y-1.5">
              {variantPicker.variants.map((variant) => {
                const label = variant.optionValues.join(" · ");
                const level = stockLevel(
                  variantPickerTracksStock,
                  variant.inStock,
                  variant.lowStock,
                );
                // Matches how the product list already treats a flat product
                // with no stock — it's filtered out and unpickable there, so
                // an empty variant is unpickable here.
                const isOut = level === "out";

                return (
                  <button
                    key={variant.id}
                    type="button"
                    disabled={isOut}
                    onClick={() => handleVariantSelect(variant)}
                    title={
                      isOut
                        ? `${label} — out of stock`
                        : `Add ${label} to the invoice`
                    }
                    className={cn(
                      "w-full flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-left transition",
                      "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1",
                      isOut
                        ? "cursor-not-allowed border-slate-200 bg-slate-50 opacity-60"
                        : "cursor-pointer border-slate-200 hover:border-blue-400 hover:bg-blue-50/50",
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-50 text-violet-600">
                        <Layers className="h-3.5 w-3.5" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-medium capitalize text-slate-800">
                          {label}
                        </p>
                        <span className="text-[11px] tabular-nums text-slate-400">
                          {formatCurrencySymbol(
                            variant.price,
                            currency.symbol,
                            currency.locale,
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      {level !== "untracked" && (
                        <span
                          className={cn(
                            "rounded-full border px-1.5 py-0.5 text-[10px] font-semibold tabular-nums whitespace-nowrap",
                            STOCK_TONE[level],
                          )}
                        >
                          {stockLabel(
                            level,
                            variant.inStock ?? 0,
                            currency.locale,
                          )}
                        </span>
                      )}
                      {!isOut && (
                        <Plus className="h-3.5 w-3.5 shrink-0 text-slate-300" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
