import { useState } from "react";

import { cn } from "@/lib/utils";
import { InvoiceItem, InvoiceItemsSelectorProps } from "@/lib/types/invoice";

import {
  Trash2,
  CirclePlus,
  GripVertical,
  Check,
  ChevronsUpDown,
  Plus,
  X,
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
import { updateProductTaxable } from "@/services/product/apiProduct.client";
import DiscountPickerModal from "./DiscountPickerModal";
import ProductDetailModal from "./ProductDetailModal";
import ProductFormModal from "@/components/product/ProductFormModal";

export default function InvoiceItemsSelector({
  products,
  items,
  onItemsChange,
  masterDiscounts,
  // onAddDiscount,
  onRemoveDiscount,
  activeTax,
  // refetchProducts,
}: InvoiceItemsSelectorProps) {
  const [search, setSearch] = useState("");
  const [activeRowId, setActiveRowId] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Inside the component, add state:
  const [discountModalItemId, setDiscountModalItemId] = useState<string | null>(
    null,
  );
  const [productDetailModal, setProductDetailModal] = useState<{
    itemId: string;
    productName: string;
    isCustom: boolean;
  } | null>(null);

  // ── Stock validation errors per item ──
  const [stockErrors, setStockErrors] = useState<Record<string, string>>({});

  const getStockWarning = (
    item: InvoiceItem,
  ): { type: "low" | "exceeded" | null; message: string } => {
    const product = products.find((p) => p.id === item.productId);
    if (!product || !product.usesStocks || product.inStock === undefined) {
      return { type: null, message: "" };
    }

    if (item.quantity > product.inStock) {
      return {
        type: "exceeded",
        message: `Only ${product.inStock} in stock. You entered ${item.quantity}.`,
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
        message: `Low stock: only ${product.inStock} remaining.`,
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
      },
    ]);
  };

  const updateItem = (
    id: string,
    field: keyof InvoiceItem,
    value: string | number,
  ) => {
    const updatedItems = items.map((item) =>
      item.id !== id ? item : { ...item, [field]: value },
    );
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

  return (
    <>
      {items.map((item, idx) => (
        <>
          <TableRow
            key={`row-${idx}`}
            className="border-b-0 w-full bg-blue-50/10 hover:bg-blue-50/50"
          >
            <TableCell className="w-6 px-1">
              <GripVertical className="h-4 w-4 text-gray-400 cursor-grab" />
            </TableCell>

            {/* Product selector */}
            <TableCell className="min-w-[140px] lg:min-w-[180px]">
              <div className="flex items-center gap-1">
                <Input
                  value={item.name}
                  onChange={(e) => updateItem(item.id, "name", e.target.value)}
                  placeholder="Product name"
                  className="flex-1 h-8 text-xs"
                />
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 shrink-0 border-gray-300"
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
                              if (
                                product.usesStocks &&
                                product.inStock !== undefined
                              ) {
                                return product.inStock > 0;
                              }
                              return true;
                            })
                            .map((product) => {
                              const isLowStock =
                                product.usesStocks &&
                                product.inStock !== undefined &&
                                product.lowStock !== undefined &&
                                product.inStock > 0 &&
                                product.inStock <= product.lowStock;
                              return (
                                <CommandItem
                                  key={product.id}
                                  value={product.name}
                                  onSelect={() =>
                                    handleProductSelect(item.id, product.name)
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
                                      {isLowStock && (
                                        <span className="text-[9px] px-1 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200 font-medium whitespace-nowrap">
                                          Low Stock
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-[11px] text-muted-foreground">
                                      ${product.price}
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
            </TableCell>

            {/* Description */}
            <TableCell className="min-w-[100px]  xl:table-cell">
              <Input
                value={item.description}
                onChange={(e) =>
                  updateItem(item.id, "description", e.target.value)
                }
                placeholder="Description"
                className="h-8 text-xs"
              />
            </TableCell>

            {/* Quantity */}
            <TableCell className="relative min-w-[65px] w-[75px]">
              <Input
                type="number"
                value={item.quantity}
                onChange={(e) =>
                  updateItem(item.id, "quantity", Number(e.target.value))
                }
                className={cn(
                  "text-right h-8 text-xs px-1.5",
                  stockErrors[item.id] &&
                    "border-red-400 focus-visible:ring-red-400",
                )}
              />
              {stockErrors[item.id] && (
                <span className="absolute -top-2 -right-1 text-[8px] font-medium text-red-600 bg-red-50 px-1 py-0.5 rounded-full border border-red-200 whitespace-nowrap">
                  Over stock
                </span>
              )}
            </TableCell>

            {/* Unit price */}
            <TableCell className="min-w-[70px] w-[85px]">
              <Input
                type="number"
                value={item.price}
                onChange={(e) =>
                  updateItem(item.id, "price", Number(e.target.value))
                }
                className="text-right h-8 text-xs px-1.5"
              />
            </TableCell>

            {/* Row total */}
            <TableCell className="min-w-[60px] text-center font-medium text-xs">
              $
              {(() => {
                const rowSubtotal = item.quantity * item.price;
                const rowDiscount = item.discounts.reduce((sum, dId) => {
                  const d = masterDiscounts.find((m) => m._id === dId);
                  if (!d) return sum;
                  return (
                    sum +
                    (d.type === "percentage"
                      ? (rowSubtotal * d.rate) / 100
                      : d.rate)
                  );
                }, 0);
                return (rowSubtotal - rowDiscount).toFixed(2);
              })()}
            </TableCell>

            {/* Discount column — + button opens modal */}
            <TableCell className="text-center">
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => setDiscountModalItemId(item.id)}
                  className="w-6 h-6 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-600 flex items-center justify-center transition-colors"
                  title="Add discount"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </TableCell>

            {/* ── Taxable toggle ── */}
            <TableCell className="text-center">
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={async () => {
                    const newTaxable = !item.isTaxable;
                    onItemsChange(
                      items.map((i) =>
                        i.id === item.id ? { ...i, isTaxable: newTaxable } : i,
                      ),
                    );
                    if (item.productId) {
                      try {
                        await updateProductTaxable(item.productId, newTaxable);
                      } catch (err) {
                        console.error("Failed to update isTaxable:", err);
                        onItemsChange(
                          items.map((i) =>
                            i.id === item.id
                              ? { ...i, isTaxable: !newTaxable }
                              : i,
                          ),
                        );
                      }
                    }
                  }}
                  className={`relative inline-flex h-5 w-8 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
                    item.isTaxable ? "bg-blue-500" : "bg-gray-200"
                  }`}
                >
                  <span
                    className={`inline-block h-3 w-3 transform rounded-full bg-white shadow transition-transform duration-200 ${
                      item.isTaxable ? "translate-x-[16px]" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
            </TableCell>

            {/* Delete */}
            <TableCell className="text-center w-[35px]">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() =>
                  onItemsChange(items.filter((i) => i.id !== item.id))
                }
              >
                <Trash2 className="h-3.5 w-3.5 text-blue-500 hover:text-red-500" />
              </Button>
            </TableCell>
          </TableRow>

          {/* ── Pills row — discount + tax badges ── */}
          <TableRow
            key={`pills-${idx}`}
            className="bg-blue-50/10 hover:bg-blue-50/50"
          >
            {/* Skip grip + product columns */}
            <TableCell className="w-6 px-1 pb-2 pt-0" />
            <TableCell colSpan={7} className="pb-3 pt-0">
              <div className="flex flex-wrap items-center gap-1.5">
                {/* Stock error badge */}
                {stockErrors[item.id] && (
                  <Badge className="flex items-center gap-1 bg-red-100 text-red-700 hover:bg-red-200 text-xs border border-red-200">
                    <span className="text-[11px] font-semibold leading-none">
                      Stock Exceeded
                    </span>
                    <span className="text-[11px] leading-none">
                      {(() => {
                        const product = products.find(
                          (p) => p.id === item.productId,
                        );
                        return product ? `(in stock: ${product.inStock})` : "";
                      })()}
                    </span>
                  </Badge>
                )}

                {/* Low stock warning badge */}
                {item.productId &&
                  !stockErrors[item.id] &&
                  (() => {
                    const product = products.find(
                      (p) => p.id === item.productId,
                    );
                    if (
                      product?.usesStocks &&
                      product.inStock !== undefined &&
                      product.lowStock !== undefined &&
                      product.inStock > 0 &&
                      product.inStock <= product.lowStock
                    ) {
                      return (
                        <Badge className="flex items-center gap-1 bg-amber-100 text-amber-700 hover:bg-amber-200 text-xs border border-amber-200">
                          <span className="text-[11px] font-semibold leading-none">
                            Low Stock
                          </span>
                          <span className="text-[11px] leading-none">
                            ({product.inStock} left)
                          </span>
                        </Badge>
                      );
                    }
                    return null;
                  })()}

                {/* Discount badges */}
                {item.discounts.map((dId) => {
                  const d = masterDiscounts.find((m) => m._id === dId);
                  if (!d) return null;
                  return (
                    <Badge
                      key={dId}
                      className="flex items-center gap-1 bg-blue-100 text-blue-700 hover:bg-blue-200 text-xs"
                    >
                      <span className="text-[11px] font-semibold leading-none">
                        {d.name}
                      </span>
                      {d.type === "percentage" ? (
                        <>
                          <span className="text-[11px] text-blue-500 leading-none">
                            ({d.rate}%) :
                          </span>
                          <span className="text-[11px] font-medium leading-none">
                            -$
                            {(
                              (item.quantity * item.price * d.rate) /
                              100
                            ).toFixed(2)}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="text-[11px] text-blue-500 leading-none">
                            {d.rate} off :
                          </span>
                          <span className="text-[11px] font-medium leading-none">
                            -${(d.rate * item.quantity).toFixed(2)}
                          </span>
                        </>
                      )}
                      <button
                        type="button"
                        className="ml-0.5 rounded-full hover:bg-blue-300 p-0.5 transition-colors"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onRemoveDiscount(item.id, dId);
                        }}
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </Badge>
                  );
                })}

                {/* Tax pill — only when product isTaxable AND global tax active */}
                {item.isTaxable && activeTax && (
                  <Badge className="flex items-center gap-1 bg-green-100 text-green-700 border border-green-200 text-xs">
                    <span className="text-[11px] font-semibold  leading-none">
                      {activeTax.name}
                    </span>
                    <span className="text-[11px] text-green-500  leading-none">
                      ({activeTax.rate}%) :
                    </span>
                    <span className="text-[11px] font-medium  leading-none">
                      +$
                      {(() => {
                        const rowTotal = item.quantity * item.price;
                        const discountTotal = item.discounts.reduce(
                          (sum, dId) => {
                            const d = masterDiscounts.find(
                              (m) => m._id === dId,
                            );
                            if (!d) return sum;
                            return (
                              sum +
                              (d.type === "percentage"
                                ? (rowTotal * d.rate) / 100
                                : d.rate)
                            );
                          },
                          0,
                        );
                        const taxableAmount = Math.max(
                          0,
                          rowTotal - discountTotal,
                        );
                        return ((taxableAmount * activeTax.rate) / 100).toFixed(
                          2,
                        );
                      })()}
                    </span>

                    {/* ✅ X disables taxable on this item */}
                    <button
                      type="button"
                      className="ml-0.5 rounded-full hover:bg-green-300 p-0.5 transition-colors"
                      onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();

                        // Optimistically update UI
                        onItemsChange(
                          items.map((i) =>
                            i.id === item.id ? { ...i, isTaxable: false } : i,
                          ),
                        );

                        // Hit update API if product exists
                        if (item.productId) {
                          try {
                            await updateProductTaxable(item.productId, false);
                          } catch (err) {
                            console.error("Failed to disable isTaxable:", err);
                            // Revert on failure
                            onItemsChange(
                              items.map((i) =>
                                i.id === item.id
                                  ? { ...i, isTaxable: true }
                                  : i,
                              ),
                            );
                          }
                        }
                      }}
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </Badge>
                )}
              </div>
            </TableCell>
            <TableCell className="w-8 pb-2 pt-0" />
          </TableRow>
        </>
      ))}

      <TableRow className="bg-blue-50/10 hover:bg-blue-50/50">
        <TableCell colSpan={10}>
          <button
            onClick={addItem}
            className="flex items-center gap-2 text-blue-600 font-semibold text-sm hover:text-blue-700 transition-colors px-4 py-2"
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
    </>
  );
}
