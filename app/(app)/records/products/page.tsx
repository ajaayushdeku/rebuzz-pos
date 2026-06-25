"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import ProductTable from "@/components/product/ProductTable";
import ProductFormModal from "@/components/product/ProductFormModal";
import { PackagePlus } from "lucide-react";
import { useProductsList } from "@/hooks/useProductsList";

export default function Page() {
  const [formModalOpen, setFormModalOpen] = useState(false);
  const { data: products = [], isLoading } = useProductsList();

  return (
    <div className="min-h-screen bg-50 px-6 py-8 md:px-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2 pb-4 border-b border-gray-200">
          <div>
            <h1 className="font-bold text-xl md:text-2xl truncate">Products</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Manage your product inventory
            </p>
          </div>
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
            onClick={() => setFormModalOpen(true)}
          >
            <PackagePlus className="h-4 w-4" />
            Add new product
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-gray-400">
            Loading products...
          </div>
        ) : (
          <ProductTable products={products} />
        )}

        <ProductFormModal
          open={formModalOpen}
          onClose={() => setFormModalOpen(false)}
        />
      </div>
    </div>
  );
}
