"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { useBusiness } from "@/hooks/useBusiness";
import { useCurrency } from "@/providers/CurrencyContext";
import { getTicketByInvoice } from "@/services/apiTicket.client";
import {
  archiveCredit,
  deleteCreditPayment,
  fetchCreditDetail,
  sendCreditReminder,
  type CreditPayment,
} from "@/services/apiCredit.client";
import type { TicketInvoice } from "@/components/invoice/modals/useInvoiceTicket";
import { formatCurrencySymbol } from "@/utils/helper";

import CreditDetailTopBar from "@/components/credit/detail/CreditDetailTopBar";
import CreditDetailMeta from "@/components/credit/detail/CreditDetailMeta";
import CreditTimeline from "@/components/credit/detail/CreditTimeline";
import CreditInvoicePreviews from "@/components/credit/detail/CreditInvoicePreviews";
import {
  creditState,
  totalPaid,
} from "@/components/credit/detail/creditDetailHelpers";

import CreditPaymentModal from "@/components/credit/CreditPaymentModal";
import SendReminderModal from "@/components/invoice/modals/SendReminderModal";
import DeleteCreditModal from "@/components/invoice/modals/DeleteCreditModal";
import RemovePaymentModal from "@/components/invoice/modals/RemovePaymentModal";
import EditPaymentModal from "@/components/invoice/modals/EditPaymentModal";
import CreditExportPdfModal from "@/components/credit/detail/CreditExportPdfModal";
import CreditPrintModal from "@/components/credit/detail/CreditPrintModal";
import CreditEmailModal from "@/components/credit/detail/CreditEmailModal";
import CreditSendModal from "@/components/credit/detail/CreditSendModal";
import CreditCustomerPreviewModal from "@/components/credit/detail/CreditCustomerPreviewModal";
import ErrorState from "@/components/ui/ErrorState";

/**
 * Credit detail — the invoice detail page seen from the credit's side.
 *
 * The route is keyed by the credit's own `_id` rather than by an invoice
 * number, because a credit is the record being worked on here: its dues, its
 * payment history, its archive state. The invoice number is only what the
 * credit points at, and it is resolved from the credit itself.
 *
 * Every query key is shared with the invoice page and the credits list, so
 * moving between them reuses the cache, and one invalidation refreshes all
 * three.
 */
export default function CreditDetailPage() {
  const { id } = useParams();
  const creditId = typeof id === "string" ? id : "";
  const router = useRouter();
  const queryClient = useQueryClient();
  const { currency } = useCurrency();
  const { data: business } = useBusiness();

  const [isSendInvoiceOpen, setIsSendInvoiceOpen] = useState(false);
  const [isEmailInvoiceOpen, setIsEmailInvoiceOpen] = useState(false);
  const [isExportPdfOpen, setIsExportPdfOpen] = useState(false);
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [isCustomerPreviewOpen, setIsCustomerPreviewOpen] = useState(false);
  const [isCreditPaymentOpen, setIsCreditPaymentOpen] = useState(false);
  const [isReminderOpen, setIsReminderOpen] = useState(false);
  const [reminderMessage, setReminderMessage] = useState("");
  const [sendingReminder, setSendingReminder] = useState(false);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [deletingPaymentId, setDeletingPaymentId] = useState<string | null>(
    null,
  );
  const [paymentToRemove, setPaymentToRemove] = useState<{
    _id: string;
    paymentAmount?: number;
    paymentMethod?: string;
    paymentDate?: string;
  } | null>(null);
  const [paymentToEdit, setPaymentToEdit] = useState<CreditPayment | null>(
    null,
  );

  // ── Data ────────────────────────────────────────────────────────────────
  const {
    data: detail,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["credit-detail-by-id", creditId],
    queryFn: () => fetchCreditDetail(creditId),
    enabled: !!creditId,
  });

  const credit = detail?.credit ?? null;
  const invoiceNo = credit?.invoiceNo;

  // The preview documents are built from the ticket, so the credit's invoice
  // number is what unlocks them.
  const { data: ticketData } = useQuery({
    queryKey: ["ticket", invoiceNo != null ? String(invoiceNo) : ""],
    queryFn: () => getTicketByInvoice(String(invoiceNo)),
    enabled: invoiceNo != null,
  });
  const invoice: TicketInvoice | undefined = ticketData?.data?.Tickets;

  const { data: customerProfile, isLoading: isCustomerLoading } = useQuery({
    queryKey: ["customer-lookup", invoice?.customerEmail, invoice?.phoneNumber],
    queryFn: async () => {
      const query = `email=${invoice?.customerEmail}`;
      const response = await fetch(`/api/customers/lookup?${query}`);
      const result = await response.json();
      return result?.data?.users?.[0] || null;
    },
    enabled: !!invoice?.customerEmail,
  });

  // ── Derived ─────────────────────────────────────────────────────────────
  const payments = detail?.paymentHistory ?? [];
  const paid = totalPaid(payments);
  const state = creditState(credit);
  const due = credit?.dueAmount ?? 0;
  const customerName =
    credit?.user?.name ||
    customerProfile?.name ||
    invoice?.customerEmail ||
    "Guest";

  /** Everything the credit touched, refreshed in one place. */
  const invalidateCredit = () => {
    queryClient.invalidateQueries({
      queryKey: ["credit-detail-by-id", creditId],
    });
    queryClient.invalidateQueries({
      queryKey: ["credit-payment-history", creditId],
    });
    queryClient.invalidateQueries({ queryKey: ["credits"] });
    queryClient.invalidateQueries({ queryKey: ["credits", "completed"] });
    if (invoiceNo != null) {
      queryClient.invalidateQueries({
        queryKey: ["ticket", String(invoiceNo)],
      });
    }
  };

  // ── Actions ─────────────────────────────────────────────────────────────
  const handleSendReminder = () => {
    setReminderMessage(
      `Reminder: ${formatCurrencySymbol(
        due,
        currency.symbol,
        currency.locale,
      )} Due Amount`,
    );
    setIsReminderOpen(true);
  };

  const handleSubmitReminder = async () => {
    if (!reminderMessage.trim()) {
      toast.error("Enter a reminder message");
      return;
    }
    if (!credit?._id) {
      toast.error("Credit not found");
      return;
    }

    setSendingReminder(true);
    try {
      await sendCreditReminder(credit._id, {
        currencyType: currency.symbol,
        message: reminderMessage.trim(),
      });
      toast.success("Reminder sent successfully!");
      setIsReminderOpen(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to send reminder",
      );
    } finally {
      setSendingReminder(false);
    }
  };

  const handleRemovePayment = async (paymentId: string) => {
    if (!credit?._id) {
      toast.error("Credit not found");
      return;
    }
    setPaymentToRemove(null);
    setDeletingPaymentId(paymentId);
    try {
      await deleteCreditPayment(credit._id, paymentId);
      toast.success("Payment removed");
      invalidateCredit();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to remove payment",
      );
    } finally {
      setDeletingPaymentId(null);
    }
  };

  const handleArchiveCredit = async () => {
    if (!credit?._id) {
      toast.error("Credit not found");
      return;
    }

    setIsArchiving(true);
    try {
      await archiveCredit(credit._id);
      toast.success("Credit deleted");
      invalidateCredit();
      queryClient.invalidateQueries({ queryKey: ["credits", "archived"] });
      setIsArchiveModalOpen(false);
      router.push("/records/credits");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete credit",
      );
      setIsArchiveModalOpen(false);
    } finally {
      setIsArchiving(false);
    }
  };

  // ── States ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          Loading credit...
        </div>
      </div>
    );
  }

  if (error || !credit) {
    return (
      <div className="min-h-screen px-6 py-10">
        <ErrorState
          title="Couldn't load this credit"
          message="The credit record didn't come back from the server. It may have been removed, or the connection dropped."
          onRetry={() => refetch()}
          isRetrying={isFetching}
        />
      </div>
    );
  }

  const isArchived = state === "archived";

  return (
    <div className="min-h-screen">
      <CreditDetailTopBar
        invoiceNo={credit.invoiceNo}
        customerName={customerName}
        state={state}
        createdAt={credit.creationDate || credit.createdAt}
        onBack={() => router.back()}
        onEditInvoice={
          isArchived || invoiceNo == null
            ? undefined
            : () => router.push(`/invoices/${invoiceNo}/edit`)
        }
        onPreviewAsCustomer={() => setIsCustomerPreviewOpen(true)}
        onExportPdf={() => setIsExportPdfOpen(true)}
        onPrint={() => setIsPrintOpen(true)}
        onOpenInvoice={() => router.push(`/invoices/${invoiceNo}`)}
        onDeleteCredit={
          isArchived ? undefined : () => setIsArchiveModalOpen(true)
        }
      />

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="w-full max-w-4xl">
          <CreditDetailMeta
            state={state}
            customerName={customerName}
            customerPhone={credit.user?.phone}
            loyaltyPoint={customerProfile?.loyaltyPoint}
            isCustomerLoading={isCustomerLoading}
            dueAmount={due}
            paidAmount={paid}
            grandTotal={credit.grandTotal ?? 0}
            currency={currency}
          />

          <CreditTimeline
            credit={credit}
            invoice={invoice}
            payments={payments}
            state={state}
            currency={currency}
            deletingPaymentId={deletingPaymentId}
            onEditInvoice={() => router.push(`/invoices/${invoiceNo}/edit`)}
            onSendInvoice={() => setIsSendInvoiceOpen(true)}
            onSendReminder={handleSendReminder}
            onRecordPayment={() => setIsCreditPaymentOpen(true)}
            onSendReceipt={() => setIsEmailInvoiceOpen(true)}
            onEditPayment={(p) => setPaymentToEdit(p)}
            onRemovePayment={(p) =>
              setPaymentToRemove({
                _id: p._id,
                paymentAmount: p.paymentAmount,
                paymentMethod: p.paymentMethod,
                paymentDate: p.paymentDate,
              })
            }
          />

          {/* The credit's own documents — proforma, credit invoice and tax —
              built from the credit detail rather than from the ticket, so they
              render even when the original invoice cannot be loaded. */}
          <CreditInvoicePreviews
            credit={credit}
            items={detail?.items ?? []}
            payments={payments}
            businessProfile={business}
            customerProfile={customerProfile}
          />
        </div>
      </div>

      {/* ── Modals ── */}
      {/* Copy / download / email — all three carry the credit's document, not
          the ticket the credit was raised from. */}
      <CreditSendModal
        open={isSendInvoiceOpen}
        onClose={() => setIsSendInvoiceOpen(false)}
        credit={credit}
        items={detail?.items ?? []}
        payments={payments}
        businessProfile={business}
        customerProfile={customerProfile}
      />

      {/* The receipt attaches the credit's own document — the invoice modal
          would attach the original ticket instead. */}
      <CreditEmailModal
        open={isEmailInvoiceOpen}
        onClose={() => setIsEmailInvoiceOpen(false)}
        credit={credit}
        items={detail?.items ?? []}
        payments={payments}
        businessProfile={business}
        customerProfile={customerProfile}
      />

      <SendReminderModal
        open={isReminderOpen}
        onClose={() => setIsReminderOpen(false)}
        credit={credit}
        currency={currency}
        reminderMessage={reminderMessage}
        onMessageChange={setReminderMessage}
        sendingReminder={sendingReminder}
        onSubmit={handleSubmitReminder}
      />

      <CreditPaymentModal
        open={isCreditPaymentOpen}
        onClose={() => setIsCreditPaymentOpen(false)}
        credit={credit}
        onSuccess={(fullyPaid) => {
          // Clearing a credit rewrites the ticket and mints a bill server-side,
          // so the documents below must be re-rendered from scratch.
          if (fullyPaid) {
            window.location.reload();
            return;
          }
          invalidateCredit();
        }}
      />

      <DeleteCreditModal
        open={isArchiveModalOpen}
        onClose={() => setIsArchiveModalOpen(false)}
        credit={credit}
        isArchiving={isArchiving}
        onConfirm={handleArchiveCredit}
      />

      <RemovePaymentModal
        payment={paymentToRemove}
        onClose={() => setPaymentToRemove(null)}
        currency={currency}
        deletingPaymentId={deletingPaymentId}
        onConfirm={handleRemovePayment}
      />

      <EditPaymentModal
        open={!!paymentToEdit}
        onClose={() => setPaymentToEdit(null)}
        creditId={credit._id}
        payment={paymentToEdit}
        // The edited payment's own amount is already counted in the due, so it
        // has to be added back to get the true ceiling.
        maxAmount={due + (paymentToEdit?.paymentAmount ?? 0)}
        onSuccess={invalidateCredit}
      />

      {/* PDF and print render the credit's own documents, so what downloads
          or prints is what the preview above shows. */}
      <CreditExportPdfModal
        open={isExportPdfOpen}
        onClose={() => setIsExportPdfOpen(false)}
        credit={credit}
        items={detail?.items ?? []}
        payments={payments}
        businessProfile={business}
        customerProfile={customerProfile}
      />

      <CreditPrintModal
        open={isPrintOpen}
        onClose={() => setIsPrintOpen(false)}
        credit={credit}
        items={detail?.items ?? []}
        payments={payments}
        businessProfile={business}
        customerProfile={customerProfile}
      />

      <CreditCustomerPreviewModal
        open={isCustomerPreviewOpen}
        onClose={() => setIsCustomerPreviewOpen(false)}
        credit={credit}
      />
    </div>
  );
}
