"use client";

import { useDiscounts } from "@/hooks/useDiscounts";
import { useCreateTicket, useUpdateTicket } from "@/hooks/useTickets";
import { useTaxes } from "@/hooks/useTaxes";
import { useProductsList } from "@/hooks/useProductsList";

import { Customer } from "@/lib/types/customer";
import { InvoiceItem } from "@/lib/types/invoice";
import { CreateTicketInput } from "@/lib/types/ticket";

import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Table, TableBody } from "@/components/ui/table";

import CustomerSelector from "./CustomerSelector";
import AddInvoiceHeader from "./AddInvoiceHeader";
import InvoiceItemsSelector from "./InvoiceItemsSelector";
import InvoiceDiscountCreate from "./InvoiceDiscountCreate";
import InvoiceTaxCreate from "./InvoiceTaxCreate";

interface InvoiceFormProps {
  initialData?: any;
  isEditMode?: boolean;
  invoiceNumber?: string;
}

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

// ── Helper: map raw backend item to InvoiceItem ───────────────────────────
function mapInitialItem(item: any): InvoiceItem {
  return {
    id: item._id ?? crypto.randomUUID(),
    productId: item.product ?? "",
    name: item.productName ?? "",
    description: item.description ?? "",
    quantity: item.quantity ?? 1,
    price: item.unitPrice ?? 0,
    discounts: (item.discounts ?? []).map((d: any) => d._id ?? d),
    taxes: [],
    isTaxable: item.isTaxable ?? false,
  };
}

export default function InvoiceForm({
  initialData,
  isEditMode,
  invoiceNumber,
}: InvoiceFormProps) {
  const router = useRouter();
  const { mutate: saveTicket, isPending: isCreating } = useCreateTicket();
  const { mutate: updateTicket, isPending: isUpdating } = useUpdateTicket();
  const { data: products = [] } = useProductsList();
  const { data: masterDiscounts = [] } = useDiscounts();
  const { data: taxData } = useTaxes();

  const isPending = isCreating || isUpdating;

  const tickets = initialData?.Tickets;

  // console.log("Ticket Data:", tickets);

  // ── State — pre-filled from initialData in edit mode ─────────────────────

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    tickets
      ? ({
          // Use actual customer name if available, fallback to ticketName
          name: initialData?.customerName ?? tickets.ticketName ?? "",
          email: tickets.customerEmail ?? "",
          phone: tickets.phoneNumber ?? "",
        } as Customer)
      : null,
  );

  // Invoice title is separate from customer name
  const [invoiceTitle, setInvoiceTitle] = useState(tickets?.ticketName ?? "");

  const [notes, setNotes] = useState(
    initialData?.ticket?.note?.split("|Invoice:")[0]?.trim() ?? "",
  );

  // Map items from backend shape, preserving isTaxable per item
  const [items, setItems] = useState<InvoiceItem[]>(() => {
    const rawItems = tickets?.items?.[0]?.item;
    if (rawItems?.length) return rawItems.map(mapInitialItem);
    return [{ id: crypto.randomUUID(), ...DEFAULT_ITEM }];
  });

  const [selectedDiscountIds, setSelectedDiscountIds] = useState<string[]>([]);

  // Active tax — surfaced from InvoiceTaxCreate
  const [activeTaxId, setActiveTaxId] = useState<string | null>(null);
  const [activeTaxRate, setActiveTaxRate] = useState<number>(0);

  const activeTaxDetails =
    taxData?.taxes?.find((t) => t._id === activeTaxId) ?? null;

  // ── Calculations ──────────────────────────────────────────────────────────

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

  // Subtotal for taxable items only (after item-level discounts)
  const taxableSubtotal = items.reduce((sum, item) => {
    if (!item.isTaxable) return sum;
    const rowRawTotal = item.quantity * item.price;
    const rowDiscount = item.discounts.reduce((dSum, dId) => {
      const d = masterDiscounts.find((m) => m._id === dId);
      if (!d) return dSum;
      return (
        dSum + (d.type === "percentage" ? (rowRawTotal * d.rate) / 100 : d.rate)
      );
    }, 0);
    return sum + Math.max(0, rowRawTotal - rowDiscount);
  }, 0);

  // Replace initialDiscountAmount:
  const initialDiscountAmount =
    isEditMode && selectedDiscountIds.length === 0
      ? (tickets?.discount ?? 0) // ← Tickets.discount, not ticket.discount
      : 0;

  const globalDiscountValue =
    selectedDiscountIds.length > 0
      ? selectedDiscountIds.reduce((sum, id) => {
          const d = masterDiscounts.find((m) => m._id === id);
          if (!d) return sum;
          return (
            sum +
            (d.type === "percentage" ? (itemsSubtotal * d.rate) / 100 : d.rate)
          );
        }, 0)
      : isEditMode
        ? (tickets?.discount ?? 0) // ← use stored discount amount in edit mode
        : 0;

  const afterDiscountTotal = Math.max(0, itemsSubtotal - globalDiscountValue);

  // Tax is calculated on taxable items subtotal (before global discounts),
  // matching the per-item tax pill display in InvoiceItemsSelector
  const totalTaxValue = (taxableSubtotal * activeTaxRate) / 100;
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

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSave = () => {
    if (!selectedCustomer) {
      toast.error("Please select a customer");
      return;
    }
    if (items.length === 0 || items.every((item) => !item.name)) {
      toast.error("Please add at least one item");
      return;
    }

    // console.log("globalDiscountValue:", globalDiscountValue);
    // console.log("selectedDiscountIds:", selectedDiscountIds);
    // console.log("initialDiscountAmount:", initialDiscountAmount);

    const filteredItems = items.filter(
      (item) => item.name && item.quantity > 0,
    );

    // ── Shared item payload shape ────────────────────────────────────────────
    const mappedItems = filteredItems.map((item) => ({
      id: item.productId, // used by create
      name: item.name, // used by create
      quantity: item.quantity,
      unitPrice: item.price, // ← use unitPrice (matches update API)
      note: null,
      isTaxable: item.isTaxable ?? false,
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
      items: mappedItems,
    };

    if (isEditMode && invoiceNumber) {
      updateTicket(
        { invoiceNumber, ticketData },
        {
          onSuccess: () => {
            // toast.success("Invoice updated");
            router.push(`/invoices/${invoiceNumber}`);
          },
          onError: (err) => {
            toast.error(`Update failed: ${err.message}`);
          },
        },
      );
    } else {
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
    }
  };

  return (
    <div className="min-h-screen bg-50 p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="md:text-3xl text-2xl font-bold text-gray-900">
            {isEditMode ? `Edit Invoice #${invoiceNumber}` : "New Invoice"}
          </h1>
          {isEditMode && tickets?.createdAt && (
            <p className="text-sm text-gray-400 mt-0.5">
              Created at{" "}
              {new Date(tickets.createdAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          {isEditMode && (
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/invoices/${invoiceNumber}`)}
              className="border-gray-300 text-gray-600 hover:text-gray-800 px-6 py-3 rounded-lg"
            >
              Cancel
            </Button>
          )}
          <Button
            onClick={handleSave}
            disabled={isPending}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
          >
            {isPending
              ? "Saving..."
              : isEditMode
                ? "Update Invoice"
                : "Save and Continue"}
          </Button>
        </div>
      </div>

      <div className="border-gray-200 border shadow-sm rounded-xl bg-white">
        {/* ── Customer + Invoice title ── */}
        <div className="flex flex-col sm:flex-row justify-between gap-4 p-4 border-b border-gray-100">
          <CustomerSelector
            value={selectedCustomer}
            onCustomerSelect={setSelectedCustomer}
          />
          <div className="flex items-center gap-3 self-start pt-1">
            <Label className="text-sm font-semibold text-blue-600 whitespace-nowrap">
              Invoice Title
            </Label>
            <Input
              className="hover:bg-blue-50 font-semibold px-4 min-w-48"
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
                        rate: activeTaxDetails.rate,
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
        <div className="px-4 py-4 border-t border-gray-100">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-1.5">
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
