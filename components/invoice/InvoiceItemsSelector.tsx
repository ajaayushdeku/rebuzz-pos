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
    onItemsChange(
      items.map((item) =>
        item.id !== id ? item : { ...item, [field]: value },
      ),
    );
  };

  const handleProductSelect = (itemId: string, productName: string) => {
    const product = products.find((p) => p.name === productName);
    onItemsChange(
      items.map((item) =>
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
      ),
    );

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
            <TableCell className="min-w-[200px]">
              <div className="flex items-center gap-1">
                <Input
                  value={item.name}
                  onChange={(e) => updateItem(item.id, "name", e.target.value)}
                  placeholder="Enter product name"
                  className="flex-1"
                />
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 shrink-0 border-gray-300"
                    >
                      <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>

                  <PopoverContent className="w-75 p-0" align="start">
                    <Command>
                      <CommandInput
                        placeholder="Search product..."
                        value={search}
                        onValueChange={setSearch}
                      />
                      <CommandList>
                        <CommandEmpty className="p-0">
                          <div className="py-6 text-center text-sm">
                            No product found.
                          </div>
                          <Button
                            variant="secondary"
                            className="w-full rounded-none border-t flex items-center justify-start gap-2 px-4 py-2"
                            onClick={() => openCreateModal(item.id)}
                          >
                            <Plus className="h-4 w-4" />
                            <span>Create &ldquo;{search}&rdquo;</span>
                          </Button>
                        </CommandEmpty>

                        <CommandGroup>
                          {products.map((product) => (
                            <CommandItem
                              key={product.id}
                              value={product.name}
                              onSelect={() =>
                                handleProductSelect(item.id, product.name)
                              }
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  item.name === product.name
                                    ? "opacity-100"
                                    : "opacity-0",
                                )}
                              />
                              <div className="flex flex-col">
                                <span>{product.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  ${product.price}
                                </span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </TableCell>

            {/* Description */}
            <TableCell className="min-w-[120px]">
              <Input
                value={item.description}
                onChange={(e) =>
                  updateItem(item.id, "description", e.target.value)
                }
                placeholder="Description"
              />
            </TableCell>

            {/* Quantity */}
            <TableCell className="w-20  ">
              <Input
                type="number"
                value={item.quantity}
                onChange={(e) =>
                  updateItem(item.id, "quantity", Number(e.target.value))
                }
                className="text-right"
              />
            </TableCell>

            {/* Unit price */}
            <TableCell className="w-24 ">
              <Input
                type="number"
                value={item.price}
                onChange={(e) =>
                  updateItem(item.id, "price", Number(e.target.value))
                }
                className="text-right"
              />
            </TableCell>

            {/* Row total */}
            <TableCell className="w-20 text-center font-medium text-sm">
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
            <TableCell className="w-20 text-center ">
              <div className="flex flex-wrap gap-1 items-center  px-10">
                <button
                  type="button"
                  onClick={() => setDiscountModalItemId(item.id)}
                  className="w-6 h-6 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-600 flex items-center justify-center transition-colors"
                  title="Add discount"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </TableCell>

            {/* ── Taxable toggle ── */}
            <TableCell className="w-20 text-center">
              <button
                type="button"
                onClick={async () => {
                  const newTaxable = !item.isTaxable;

                  // Optimistically update UI
                  onItemsChange(
                    items.map((i) =>
                      i.id === item.id ? { ...i, isTaxable: newTaxable } : i,
                    ),
                  );

                  // Hit update API if product already exists in backend
                  if (item.productId) {
                    try {
                      await updateProductTaxable(item.productId, newTaxable);
                    } catch (err) {
                      console.error("Failed to update isTaxable:", err);
                      // Revert on failure
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
                className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
                  item.isTaxable ? "bg-blue-500" : "bg-gray-200"
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform duration-200 ${
                    item.isTaxable ? "translate-x-[18px]" : "translate-x-0.5"
                  }`}
                />
              </button>
            </TableCell>

            {/* Delete */}
            <TableCell className="w-8 text-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  onItemsChange(items.filter((i) => i.id !== item.id))
                }
              >
                <Trash2 className="h-4 w-4 text-blue-500 hover:text-red-500" />
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
