"use client";

import AddBillHeader from "@/components/expenses/shift/AddBillHeader";
import BillItemsSelector from "@/components/expenses/shift/BillItemsSelector";
import VendorSelector from "@/components/expenses/shift/VendorSelector";
import { Vendor } from "@/components/expenses/vendors/vendor-columns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/pop-calendar";
import { Table, TableBody } from "@/components/ui/table";
import { useProductServiceList } from "@/hooks/expenses/useProductService";
import { BillItem } from "@/lib/types/expenses";
import { useRouter } from "next/navigation";
import { useState } from "react";

const DEFAULT_ITEM: Omit<BillItem, "id"> = {
  productId: "",
  name: "",
  quantity: 1,
  price: 0,
};
export default function Page() {
  const router = useRouter();

  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [billNumber, setBillNumber] = useState("");
  const [poNumber, setPoNumber] = useState("");

  const { data: products = [], isLoading: loadingProducts } =
    useProductServiceList();

  const [items, setItems] = useState<BillItem[]>([
    {
      id: crypto.randomUUID(),
      ...DEFAULT_ITEM,
    },
  ]);
  return (
    <div className="min-h-screen p-8">
      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="md:text-4xl text-3xl font-bold text-gray-900">
          New Bill
        </h1>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg">
          Save and Continue
        </Button>
      </div>

      {/* Main card */}
      <div className="border border-slate-200 shadow-sm rounded-xl bg-white">
        {/* Top section: vendor + form fields */}
        <div className="flex flex-wrap items-start justify-between gap-6 px-6 py-5">
          <VendorSelector
            value={selectedVendor}
            onVendorSelect={(vendor) => setSelectedVendor(vendor)}
          />

          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Label className="w-24 text-right text-sm font-medium text-slate-600 shrink-0">
                  Bill no.
                </Label>
                <Input
                  id="invoicenum"
                  placeholder="0"
                  onChange={(e) => setBillNumber(e.target.value)}
                  className="w-44 border-slate-200 focus:border-blue-400"
                />
              </div>
              <div className="flex items-center gap-3">
                <Label className="w-24 text-right text-sm font-medium text-slate-600 shrink-0">
                  P.O./S.O.
                </Label>
                <Input
                  id="ponum"
                  onChange={(e) => setPoNumber(e.target.value)}
                  className="w-44 border-slate-200 focus:border-blue-400"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Label className="w-24 text-right text-sm font-medium text-slate-600 shrink-0">
                  Bill Date
                </Label>
                <DatePicker text="" />
              </div>
              <div className="flex items-center gap-3">
                <Label className="w-24 text-right text-sm font-medium text-slate-600 shrink-0">
                  Due Date
                </Label>
                <DatePicker text="" />
              </div>
            </div>
          </div>
        </div>

        {/* Divider + table section */}
        <div className="border-t border-slate-100">
          <Table>
            <AddBillHeader />
            <TableBody>
              <BillItemsSelector
                products={products}
                items={items}
                onItemsChange={setItems}
              />
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
