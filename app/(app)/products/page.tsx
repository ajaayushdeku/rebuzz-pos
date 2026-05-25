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
    <div className="min-h-screen bg-white-50 p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="md:text-4xl text-3xl font-bold text-gray-900">
          Products
        </h1>
        <Button
          className="bg-blue-600 hover:bg-blue-700 px-6 py-3 text-white rounded-2xl"
          onClick={() => setFormModalOpen(true)}
        >
          <PackagePlus />
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
  );
}
