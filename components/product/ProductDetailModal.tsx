"use client";

import { DollarSign, Package, Scale, Percent } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Product } from "@/lib/types/product";
import { Badge } from "@/components/ui/badge";

interface ProductDetailModalProps {
  open: boolean;
  onClose: () => void;
  product: Product | null;
}

export default function ProductDetailModal({
  open,
  onClose,
  product,
}: ProductDetailModalProps) {
  if (!product) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-600" />
            {product.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Description */}
          {product.description && (
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                Description
              </p>
              <p className="text-sm text-gray-700 mt-1">
                {product.description}
              </p>
            </div>
          )}

          {/* Pricing */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-1.5 text-xs font-medium text-gray-400 mb-1">
                <DollarSign className="h-3 w-3" />
                Selling Price
              </div>
              <p className="text-lg font-bold text-gray-900">
                ${product.price.toFixed(2)}
              </p>
            </div>
            {product.costPrice !== undefined && product.costPrice > 0 && (
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-1.5 text-xs font-medium text-gray-400 mb-1">
                  <DollarSign className="h-3 w-3" />
                  Cost Price
                </div>
                <p className="text-lg font-bold text-gray-900">
                  ${product.costPrice.toFixed(2)}
                </p>
              </div>
            )}
          </div>

          {/* Tax & Stock */}
          <div className="flex flex-wrap gap-2">
            <Badge
              className={
                product.isTaxable
                  ? "bg-green-100 text-green-700 border border-green-200"
                  : "bg-gray-100 text-gray-500 border border-gray-200"
              }
            >
              <Percent className="h-3 w-3 mr-1" />
              {product.isTaxable ? "Taxable" : "Non-taxable"}
            </Badge>

            {product.usesStocks && (
              <>
                <Badge className="bg-blue-100 text-blue-700 border border-blue-200">
                  <Package className="h-3 w-3 mr-1" />
                  In Stock: {product.inStock ?? 0}
                </Badge>
                {product.lowStock !== undefined && product.lowStock > 0 && (
                  <Badge className="bg-amber-100 text-amber-700 border border-amber-200">
                    Stock Threshold: {product.lowStock}
                  </Badge>
                )}
              </>
            )}

            {product.soldBy && (
              <Badge className="bg-purple-100 text-purple-700 border border-purple-200">
                <Scale className="h-3 w-3 mr-1" />
                Sold by {product.soldBy}
              </Badge>
            )}
          </div>

          {/* Category */}
          {product.categories && product.categories !== "" && (
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
                Category
              </p>
              <span className="inline-block text-xs font-medium bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full">
                {product.categories}
              </span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
