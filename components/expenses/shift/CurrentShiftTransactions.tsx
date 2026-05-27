"use client";

import { useState } from "react";
import type { Transaction, BillImage } from "@/lib/types/shift";
import { formatCurrency } from "@/utils/helper";
import { useCurrency } from "@/providers/CurrencyContext";
import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  ImageIcon,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

type Tab = "pay-in" | "pay-out" | "sale";

const TAB_LABELS: { value: Tab; label: string }[] = [
  { value: "pay-in", label: "Pay In" },
  { value: "pay-out", label: "Pay Out" },
  { value: "sale", label: "Sales" },
];

const tabIcons = {
  "pay-in": TrendingUp,
  "pay-out": TrendingDown,
  sale: ShoppingCart,
};

const tabColors = {
  "pay-in": "text-green-600",
  "pay-out": "text-red-600",
  sale: "text-blue-600",
};

const tabBg = {
  "pay-in": "bg-green-50 border-green-200",
  "pay-out": "bg-red-50 border-red-200",
  sale: "bg-blue-50 border-blue-200",
};

function ImageViewer({
  images,
  onClose,
}: {
  images: BillImage[];
  onClose: () => void;
}) {
  const [current, setCurrent] = useState(0);

  if (images.length === 0) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative max-w-2xl w-full bg-white rounded-xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 z-10 bg-black/50 text-white rounded-full p-1 hover:bg-black/70"
        >
          <X size={16} />
        </button>

        {/* Image */}
        <img
          src={images[current].imagePath}
          alt={`Bill image ${current + 1}`}
          className="w-full h-auto max-h-[70vh] object-contain"
        />

        {/* Navigation */}
        {images.length > 1 && (
          <div className="flex items-center justify-between px-4 py-2 bg-gray-50">
            <button
              onClick={() =>
                setCurrent((p) => (p === 0 ? images.length - 1 : p - 1))
              }
              className="text-gray-600 hover:text-gray-900 p-1"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-xs text-gray-500">
              {current + 1} / {images.length}
            </span>
            <button
              onClick={() =>
                setCurrent((p) => (p === images.length - 1 ? 0 : p + 1))
              }
              className="text-gray-600 hover:text-gray-900 p-1"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CurrentShiftTransactions({
  transactions,
}: {
  transactions: Transaction[];
}) {
  const [activeTab, setActiveTab] = useState<Tab>("pay-out");
  const [viewerImages, setViewerImages] = useState<BillImage[] | null>(null);
  const { currency } = useCurrency();

  const filtered = transactions.filter((t) => t.transactionType === activeTab);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-5">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">
        Current Shift Transactions
      </h3>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-4">
        {TAB_LABELS.map(({ value, label }) => {
          const count = transactions.filter(
            (t) => t.transactionType === value,
          ).length;
          return (
            <button
              key={value}
              onClick={() => setActiveTab(value)}
              className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all flex items-center justify-center gap-1 ${
                activeTab === value
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {label}
              {count > 0 && (
                <span
                  className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                    activeTab === value
                      ? "bg-blue-100 text-blue-700"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Transaction list */}
      {filtered.length === 0 ? (
        <div className="text-center py-8 text-gray-400 text-sm">
          No {activeTab.replace("-", " ")} transactions this shift
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((t, idx) => {
            const Icon = tabIcons[t.transactionType as Tab] ?? TrendingUp;
            const color =
              tabColors[t.transactionType as Tab] ?? "text-gray-600";
            const bg =
              tabBg[t.transactionType as Tab] ?? "bg-gray-50 border-gray-100";
            const amount =
              typeof t.transactionAmount === "string"
                ? parseFloat(t.transactionAmount)
                : t.transactionAmount;
            const hasImages =
              Array.isArray(t.billImages) && t.billImages.length > 0;

            return (
              <div
                key={t._id ?? idx}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg border ${bg}`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon size={14} className={color} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {t.note || "—"}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {t.transactionTime}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {hasImages && (
                    <button
                      onClick={() => setViewerImages(t.billImages!)}
                      className="text-blue-500 hover:text-blue-700 cursor-pointer"
                      title="View bill image"
                    >
                      <ImageIcon size={14} />
                    </button>
                  )}
                  <span className={`text-sm font-semibold ${color}`}>
                    {formatCurrency(amount, currency)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Image viewer modal */}
      {viewerImages && (
        <ImageViewer
          images={viewerImages}
          onClose={() => setViewerImages(null)}
        />
      )}
    </div>
  );
}
