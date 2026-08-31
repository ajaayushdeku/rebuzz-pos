"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, User } from "lucide-react";
import toast from "react-hot-toast";

import { useCustomersList } from "@/hooks/useCustomersList";
import { getCustomerImageUrl } from "@/lib/types/customer";
import { Button } from "@/components/ui/button";
import EditCustomerModal from "@/components/customer/EditCustomerModal";
import LoyaltyPointModal from "@/components/customer/LoyaltyPointModal";
import { CustomerDetailSkeleton } from "@/components/customer/CustomerDetailSkeletons";

import CustomerDetailHeader from "@/components/customer/detail/CustomerDetailHeader";
import CustomerDetailStats from "@/components/customer/detail/CustomerDetailStats";
import CustomerInfoCard from "@/components/customer/detail/CustomerInfoCard";
import LoyaltyCard from "@/components/customer/detail/LoyaltyCard";
import OrderHistorySection from "@/components/customer/detail/OrderHistorySection";
import PhotoViewer from "@/components/customer/detail/PhotoViewer";
import type {
  PurchaseHistoryItem,
  PurchaseHistoryResponse,
} from "@/components/customer/detail/customerDetailHelpers";

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;
  const { data: customers = [], isLoading } = useCustomersList();

  const [editOpen, setEditOpen] = useState(false);
  const [loyaltyOpen, setLoyaltyOpen] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [history, setHistory] = useState<PurchaseHistoryItem[]>([]);

  const customer = customers.find((c) => c.id === customerId);

  // ── Order history ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!customerId) return;

    const fetchHistory = async () => {
      setHistoryLoading(true);
      try {
        const res = await fetch(`/api/customers/${customerId}/history`);
        if (!res.ok) throw new Error("Failed to fetch history");
        const json: PurchaseHistoryResponse = await res.json();
        setHistory(json.customerPurchases ?? []);
      } catch {
        toast.error("Failed to load order history");
      } finally {
        setHistoryLoading(false);
      }
    };

    fetchHistory();
  }, [customerId]);

  if (isLoading) {
    return <CustomerDetailSkeleton />;
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-gray-50/50 px-6 py-8 md:px-10">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col items-center justify-center py-20">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <User size={28} className="text-gray-300" />
            </div>
            <p className="mb-4 text-sm text-gray-500">Customer not found</p>
            <Button
              variant="outline"
              onClick={() => router.push("/records/customers")}
              className="text-sm"
            >
              <ArrowLeft size={14} className="mr-2" />
              Back to Customers
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Already banded by `mapRawCustomerToCustomer` against the business's own
  // ladder — re-deriving here would put the built-in thresholds back.
  const loyaltyStatus = customer.loyaltyStatus;
  const imageUrl = getCustomerImageUrl(customer.image);

  // ── Stats derived from history ───────────────────────────────────────────
  const validHistory = history.filter((p) => !p.isRefunded);
  const totalSpent = validHistory.reduce(
    (sum, p) => sum + (p.grandTotal ?? 0),
    0,
  );
  const totalOrders = validHistory.length;
  const refundedOrders = history.filter((p) => p.isRefunded).length;

  const openPhoto = imageUrl ? () => setViewerOpen(true) : undefined;

  return (
    <div className="bg-50 min-h-screen px-6 py-8 md:px-10">
      <div>
        <CustomerDetailHeader
          customer={customer}
          imageUrl={imageUrl}
          loyaltyStatus={loyaltyStatus}
          onBack={() => router.push("/records/customers")}
          onViewPhoto={openPhoto}
        />

        <CustomerDetailStats
          customer={customer}
          totalSpent={totalSpent}
          totalOrders={totalOrders}
          // Total Spent and Total Orders come from the history fetch, so the
          // tiles stay in their loading state until it lands rather than
          // flashing zeroes.
          loading={historyLoading}
        />

        <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          <CustomerInfoCard
            customer={customer}
            imageUrl={imageUrl}
            onEdit={() => setEditOpen(true)}
            onViewPhoto={openPhoto}
          />

          <LoyaltyCard
            customer={customer}
            loyaltyStatus={loyaltyStatus}
            totalSpent={totalSpent}
            refundedOrders={refundedOrders}
            onEdit={() => setLoyaltyOpen(true)}
          />
        </div>

        <OrderHistorySection
          customerName={customer.name}
          history={history}
          loading={historyLoading}
        />
      </div>

      {/* ── Modals ── */}
      <EditCustomerModal
        customer={customer}
        open={editOpen}
        onClose={() => setEditOpen(false)}
      />
      <LoyaltyPointModal
        customer={customer}
        open={loyaltyOpen}
        onClose={() => setLoyaltyOpen(false)}
      />

      <PhotoViewer
        open={viewerOpen}
        src={imageUrl}
        alt={customer.name}
        onClose={() => setViewerOpen(false)}
      />
    </div>
  );
}
