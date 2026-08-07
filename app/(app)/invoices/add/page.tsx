"use client";

import toast from "react-hot-toast";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { useDiscounts } from "@/hooks/useDiscounts";
import { useCreateTicket } from "@/hooks/useTickets";
import { useProductsList } from "@/hooks/useProductsList";

import { Table, TableBody } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Customer } from "@/lib/types/customer";
import { InvoiceItem } from "@/lib/types/invoice";
import { CreateTicketInput } from "@/lib/types/ticket";
import { useTaxes } from "@/hooks/useTaxes";
import { createProduct } from "@/services/product/apiProduct.client";
import { useQueryClient } from "@tanstack/react-query";
import CustomerSelector from "@/components/invoice/CustomerSelector";
import AddInvoiceHeader from "@/components/invoice/AddInvoiceHeader";
import InvoiceItemsSelector from "@/components/invoice/InvoiceItemsSelector";
import InvoiceDiscountCreate from "@/components/invoice/InvoiceDiscountCreate";
import InvoiceTaxCreate from "@/components/invoice/InvoiceTaxCreate";

const DEFAULT_ITEM: Omit<InvoiceItem, "id"> = {
  productId: "",
  name: "",
  description: "",
  quantity: 1,
  price: 0,
  discounts: [],
  taxes: [],
  isTaxable: false,
};

const CUSTOM_PRODUCT_NAME = "Custom";

export default function Page() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { mutate: saveTicket, isPending } = useCreateTicket();
  const { data: products = [], isLoading: loadingProducts } = useProductsList();
  const { data: masterDiscounts = [] } = useDiscounts();
  const { data: taxData } = useTaxes();

  // console.log("Taxes:", taxData);

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  // The picker starts open on a new invoice (no customer yet), matching the
  // edit form behavior.
  const [showCustomerPicker, setShowCustomerPicker] = useState(true);
  const [invoiceTitle, setInvoiceTitle] = useState("");
  const [invoiceNumber] = useState("");
  const [notes, setNotes] = useState("");

  const [items, setItems] = useState<InvoiceItem[]>([
    { id: crypto.randomUUID(), ...DEFAULT_ITEM },
  ]);

  // ── Ensure "Custom" product exists ──────────────────────────────────────
  const customProductIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!products.length || loadingProducts) return;

    const ensureCustomProduct = async () => {
      // Check if "Custom" product already exists in fetched list
      const existingCustom = products.find(
        (p) => p.name.toLowerCase() === CUSTOM_PRODUCT_NAME.toLowerCase(),
      );
      if (existingCustom) {
        customProductIdRef.current = existingCustom.id;
        return;
      }

      // If not, create it once
      try {
        const newCustom = await createProduct({ name: CUSTOM_PRODUCT_NAME });
        customProductIdRef.current = newCustom.id;
        // Invalidate products list so future renders pick it up
        queryClient.invalidateQueries({ queryKey: ["products"] });
        queryClient.invalidateQueries({ queryKey: ["products-list"] });
      } catch (err) {
        console.error("Failed to create Custom product:", err);
      }
    };

    ensureCustomProduct();
  }, [products, loadingProducts, queryClient]);

  // Global discounts
  const [selectedDiscountIds, setSelectedDiscountIds] = useState<string[]>([]);

  // Active tax — managed by InvoiceTaxCreate, surfaced here for payload
  const [activeTaxId, setActiveTaxId] = useState<string | null>(null);
  const [activeTaxRate, setActiveTaxRate] = useState<number>(0);

  // Look up active tax details from both normal taxes AND grouped taxes
  const activeTaxDetails =
    taxData?.taxes?.find((t) => t._id === activeTaxId) ??
    taxData?.groupedTaxes?.find((g) => g._id === activeTaxId) ??
    null;

  // console.log("Active Tax Details:", activeTaxDetails);

  // ── Calculations ──────────────────────────────────────────────────────────

  // 1. Items subtotal after per-item discounts
  const itemsSubtotal = items.reduce((sum, item) => {
    const rowRawTotal = item.quantity * item.price;
    const rowDiscount = item.discounts.reduce((dSum, dId) => {
      const d = masterDiscounts.find((m) => m._id === dId);
      if (!d) return dSum;
      return (
        dSum + (d.type === "percentage" ? (rowRawTotal * d.rate) / 100 : d.rate)
      );
    }, 0);
    return sum + (rowRawTotal - rowDiscount);
  }, 0);

  // 2. Global discounts applied on itemsSubtotal
  const globalDiscountValue = selectedDiscountIds.reduce((sum, id) => {
    const d = masterDiscounts.find((m) => m._id === id);
    if (!d) return sum;
    return (
      sum + (d.type === "percentage" ? (itemsSubtotal * d.rate) / 100 : d.rate)
    );
  }, 0);

  // 3. Taxes applied after discounts ←
  const afterDiscountTotal = Math.max(0, itemsSubtotal - globalDiscountValue);
  const totalTaxValue = items.reduce((sum, item) => {
    // Skip non-taxable items
    if (!item.isTaxable) return sum;

    // Item raw total
    const itemTotal = item.quantity * item.price;

    // Item-level discounts
    const itemDiscount = item.discounts.reduce((dSum, dId) => {
      const d = masterDiscounts.find((m) => m._id === dId);

      if (!d) return dSum;

      return (
        dSum + (d.type === "percentage" ? (itemTotal * d.rate) / 100 : d.rate)
      );
    }, 0);

    // Taxable amount after item discounts
    const taxableAmount = Math.max(0, itemTotal - itemDiscount);

    // Tax for this item
    const itemTax = (taxableAmount * activeTaxRate) / 100;

    return sum + itemTax;
  }, 0);
  const finalTotal = afterDiscountTotal + totalTaxValue;

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleItemDiscountAdd = (itemId: string, discountId: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              discounts: [...new Set([...item.discounts, discountId])],
            }
          : item,
      ),
    );
  };

  const handleItemDiscountRemove = (itemId: string, discountId: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              discounts: item.discounts.filter((id) => id !== discountId),
            }
          : item,
      ),
    );
  };

  const handleDiscountSelect = (id: string) => {
    setSelectedDiscountIds((prev) => [...new Set([...prev, id])]);
  };

  const handleDiscountRemove = (id: string) => {
    setSelectedDiscountIds((prev) => prev.filter((d) => d !== id));
  };

  const handleSave = async () => {
    if (!selectedCustomer) {
      toast.error("Please select a customer");
      return;
    }
    if (items.length === 0 || items.every((item) => !item.name)) {
      toast.error("Please add at least one item");
      return;
    }

    // ── Stock validation: prevent save if any item exceeds available stock ──
    for (const item of items) {
      if (!item.productId) continue;
      const product = products.find((p) => p.id === item.productId);
      if (
        product?.usesStocks &&
        product.inStock !== undefined &&
        item.quantity > product.inStock
      ) {
        toast.error(
          `"${item.name}" quantity (${item.quantity}) exceeds available stock (${product.inStock}). Please adjust.`,
        );
        return;
      }
    }

    // Wait for custom product ID if still loading
    const customId = customProductIdRef.current;
    if (!customId) {
      toast.error("Custom product is not ready yet. Please try again.");
      return;
    }

    // For items without a productId, attach the "Custom" product ID
    // but keep the user-entered name for display
    const itemList = items.filter((item) => item.name && item.quantity > 0);
    const updatedItems = itemList.map((item) => ({
      ...item,
      productId: item.productId || customId,
    }));

    const ticketData: CreateTicketInput = {
      ticketName: invoiceTitle || selectedCustomer?.name || "Walk-in Customer",
      customerEmail: selectedCustomer?.email || "",
      phoneNumber: selectedCustomer?.phone || "",
      total: itemsSubtotal,
      discount: globalDiscountValue,
      totalDiscount: globalDiscountValue,
      grandTotal: finalTotal,
      taxId: activeTaxId,
      note: `${notes}${invoiceNumber ? `|Invoice: ${invoiceNumber}` : ""}`,
      items: updatedItems.map((item) => ({
        id: item.productId,
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.price,
        note: null,
        discounts: item.discounts.map((id) => {
          const master = masterDiscounts.find((m) => m._id === id);
          return {
            _id: master?._id,
            name: master?.name,
            rate: master?.rate,
            type: master?.type,
            isEnabled: true,
            isSelected: true,
          };
        }),
        isTaxable: item.isTaxable ?? false,
      })),
    };

    // console.log("Ticket Data:", ticketData);

    saveTicket(ticketData, {
      onSuccess: (response) => {
        // toast.success("Invoice saved");
        const newId = response?.data?.ticket?.invoice;
        if (newId) router.push(`/invoices/${newId}`);
      },
      onError: (err) => {
        toast.error(`Save failed: ${err.message}`);
      },
    });
  };

  return (
    <div className="min-h-screen bg-50 p-6 md:p-8">
      {/* ── Page header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="md:text-3xl text-2xl font-bold text-gray-900">
            New Invoice
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Create a new invoice for your customer
          </p>
        </div>

        <Button
          onClick={handleSave}
          disabled={isPending}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
        >
          {isPending ? "Saving..." : "Save and Continue"}
        </Button>
      </div>

      <div className="border-gray-200 border shadow-sm rounded-xl bg-white overflow-hidden">
        {/* ── Bill to + Invoice title ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 px-5 pt-5 border-b border-gray-100 pb-8">
          {/* Customer */}
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1">
              Bill to
            </p>
            <p className="text-lg font-bold text-gray-900 truncate">
              {selectedCustomer?.name || "No customer selected"}
            </p>
            {(selectedCustomer?.email || selectedCustomer?.phone) && (
              <p className="text-xs text-gray-500 mt-0.5 truncate">
                {[selectedCustomer?.email, selectedCustomer?.phone]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            )}

            <button
              type="button"
              onClick={() => setShowCustomerPicker((v) => !v)}
              className="mt-2 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors"
            >
              {showCustomerPicker
                ? "Cancel"
                : selectedCustomer
                  ? "Choose a different customer"
                  : "Choose a customer"}
            </button>

            {showCustomerPicker && (
              <div className="mt-3">
                <CustomerSelector
                  value={selectedCustomer}
                  onCustomerSelect={(c) => {
                    setSelectedCustomer(c);
                    setShowCustomerPicker(false);
                  }}
                />
              </div>
            )}
          </div>

          {/* Invoice title */}
          <div className="sm:justify-self-end w-full sm:max-w-xs">
            <Label
              htmlFor="invoiceTitle"
              className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1 block"
            >
              Invoice Title
            </Label>
            <Input
              className="hover:bg-blue-50 font-semibold px-3 h-9 text-sm w-full"
              id="invoiceTitle"
              placeholder="Invoice"
              value={invoiceTitle}
              onChange={(e) => setInvoiceTitle(e.target.value)}
            />
          </div>
        </div>

        {/* ── Items table ── */}
        <div className="overflow-x-auto">
          <Table>
            <AddInvoiceHeader />
            <TableBody>
              <InvoiceItemsSelector
                products={products}
                items={items}
                onItemsChange={setItems}
                masterDiscounts={masterDiscounts}
                onAddDiscount={handleItemDiscountAdd}
                onRemoveDiscount={handleItemDiscountRemove}
                activeTax={
                  activeTaxId && activeTaxDetails
                    ? {
                        id: activeTaxId,
                        name: activeTaxDetails.name,
                        rate: activeTaxRate,
                      }
                    : null
                }
              />
            </TableBody>
          </Table>
        </div>

        {/* ── Discount ── */}
        <InvoiceDiscountCreate
          subtotal={itemsSubtotal}
          discountAmount={globalDiscountValue}
          masterDiscounts={masterDiscounts}
          selectedDiscountIds={selectedDiscountIds}
          onDiscountSelect={handleDiscountSelect}
          onDiscountRemove={handleDiscountRemove}
        />

        {/* ── Tax ── */}
        <InvoiceTaxCreate
          subtotal={afterDiscountTotal}
          taxAmount={totalTaxValue}
          finalTotal={finalTotal}
          onActiveTaxChange={(taxId, rate) => {
            setActiveTaxId(taxId);
            setActiveTaxRate(rate);
          }}
        />

        {/* ── Notes ── */}
        <div className="px-5 py-4 border-t border-gray-100">
          <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
            Notes / Terms
          </label>
          <input
            className="w-full focus:outline-none text-sm text-gray-700 placeholder:text-gray-300 p-2 rounded-lg border border-transparent focus:border-gray-200 hover:border-gray-200 transition"
            placeholder="Enter notes or terms of service..."
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
