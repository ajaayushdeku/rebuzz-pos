"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { useBusiness } from "@/hooks/useBusiness";
import { useCurrency } from "@/providers/CurrencyContext";
import { getTicketByInvoice } from "@/services/apiTicket.client";
import { getTransactionDetail } from "@/services/dashboardServices/apiTransactionClient";
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
import PaymentReceiptModal from "@/components/credit/detail/PaymentReceiptModal";
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
  // Whether the business PAN shows on the previewed documents. Kept on the
  // page rather than in the top bar so the previews below can read it too.
  const [showPan, setShowPan] = useState(true);
  const [isEmailInvoiceOpen, setIsEmailInvoiceOpen] = useState(false);
  // The payment whose receipt is being sent. Holding the payment rather
  // than a boolean is what makes the receipt specific to the row clicked.
  const [receiptPayment, setReceiptPayment] = useState<CreditPayment | null>(
    null,
  );
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
  const state = creditState(credit);

  // The preview documents are built from the ticket, so the credit's invoice
  // number is what unlocks them.
  const { data: ticketData } = useQuery({
    queryKey: ["ticket", invoiceNo != null ? String(invoiceNo) : ""],
    queryFn: () => getTicketByInvoice(String(invoiceNo)),
    enabled: invoiceNo != null,
  });
  const invoice: TicketInvoice | undefined = ticketData?.data?.Tickets;

  /**
   * A POS bill is only minted when the credit is settled at the till, so an
   * ongoing or archived credit has nothing to fetch — asking would be a
   * guaranteed 404. Those render from the credit record alone.
   */
  const { data: billData } = useQuery({
    queryKey: ["bill-detail", invoiceNo],
    queryFn: () => getTransactionDetail(invoiceNo!),
    enabled: invoiceNo != null && state === "completed",
    retry: false,
  });

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
        invoiceName={credit.ticketName ?? ""}
        invoiceNo={credit.invoiceNo}
        customerName={customerName}
        state={state}
        createdAt={credit.creationDate || credit.createdAt}
        onBack={() => router.back()}
        // Gone once the credit is settled or archived — its items are then a
        // record of what was owed, not something still being agreed.
        onEditInvoice={
          isArchived || state === "completed" || invoiceNo == null
            ? undefined
            : () => router.push(`/records/credits/${creditId}/edit`)
        }
        showPan={showPan}
        onTogglePan={() => setShowPan((on) => !on)}
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
            onEditInvoice={() =>
              router.push(`/records/credits/${creditId}/edit`)
            }
            onSendInvoice={() => setIsSendInvoiceOpen(true)}
            onSendReminder={handleSendReminder}
            onRecordPayment={() => setIsCreditPaymentOpen(true)}
            onSendReceipt={(p) => setReceiptPayment(p)}
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
            billData={billData ?? null}
            showPan={showPan}
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
        billData={billData ?? null}
        showPan={showPan}
      />

      {/* The receipt attaches the credit's own document — the invoice modal
          would attach the original ticket instead. */}
      {/* One payment's receipt — copy link, download, email or open the
          customer preview. */}
      <PaymentReceiptModal
        open={!!receiptPayment}
        onClose={() => setReceiptPayment(null)}
        credit={credit}
        payment={receiptPayment}
        payments={payments}
        businessProfile={business}
        customerProfile={customerProfile}
      />

      <CreditEmailModal
        open={isEmailInvoiceOpen}
        onClose={() => setIsEmailInvoiceOpen(false)}
        credit={credit}
        items={detail?.items ?? []}
        payments={payments}
        businessProfile={business}
        customerProfile={customerProfile}
        billData={billData ?? null}
        showPan={showPan}
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
        billData={billData ?? null}
        showPan={showPan}
      />

      <CreditPrintModal
        open={isPrintOpen}
        onClose={() => setIsPrintOpen(false)}
        credit={credit}
        items={detail?.items ?? []}
        payments={payments}
        businessProfile={business}
        customerProfile={customerProfile}
        billData={billData ?? null}
        showPan={showPan}
      />

      <CreditCustomerPreviewModal
        open={isCustomerPreviewOpen}
        onClose={() => setIsCustomerPreviewOpen(false)}
        credit={credit}
      />
    </div>
  );
}
