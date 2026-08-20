"use client";

import { useState } from "react";
import ProductTable from "@/components/product/ProductTable";
import ProductFormModal from "@/components/product/ProductFormModal";
import { PackagePlus } from "lucide-react";
import { useProductsList } from "@/hooks/useProductsList";
import HeaderActionButton from "@/components/ui/HeaderActionButton";

export default function Page() {
  const [formModalOpen, setFormModalOpen] = useState(false);
  const { data: products = [], isLoading } = useProductsList();

  return (
    <div className="min-h-screen bg-50 px-6 py-8 md:px-10">
      <div className="w-full mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2 pb-4 border-b border-gray-200">
          <div>
            <h1 className="font-bold text-xl md:text-2xl truncate">Products</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Manage your product inventory
            </p>
          </div>
          <HeaderActionButton
            variant="dashed"
            icon={PackagePlus}
            hideLabelOnMobile
            label="Add new product"
            onClick={() => setFormModalOpen(true)}
          />
        </div>

        <ProductTable products={products} isLoading={isLoading} />

        <ProductFormModal
          open={formModalOpen}
          onClose={() => setFormModalOpen(false)}
        />
      </div>
    </div>
  );
}
