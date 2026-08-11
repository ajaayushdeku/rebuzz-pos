export type InvoiceType = "proforma" | "invoice" | "tax";

/** Display label for each document, used in headings, buttons and toasts. */
export const LABELS: Record<InvoiceType, string> = {
  proforma: "Proforma Invoice",
  invoice: "Invoice",
  tax: "Tax Invoice",
};

/** Short label for compact UI (rows, chips). */
export const SHORT_LABELS: Record<InvoiceType, string> = {
  proforma: "Proforma",
  invoice: "Invoice",
  tax: "Tax Invoice",
};

/** One line explaining what each document is, shown under its label. */
export const DESCRIPTIONS: Record<InvoiceType, string> = {
  proforma: "Estimate sent before payment",
  invoice: "Standard bill for the order",
  tax: "Includes tax registration details",
};

/** Public preview route segment for each invoice type. */
export const segmentFor = (type: InvoiceType): string =>
  type === "proforma"
    ? "proforma"
    : type === "invoice"
      ? "invoice"
      : "tax-invoice";

/** Maps the UI invoice type to the backend `billType` value. */
export const BILL_TYPE: Record<
  InvoiceType,
  "proforma" | "invoice" | "tax_invoice"
> = {
  proforma: "proforma",
  invoice: "invoice",
  tax: "tax_invoice",
};

/** Canonical render order for the three documents. */
export const INVOICE_TYPES: InvoiceType[] = ["proforma", "invoice", "tax"];

/** Filename stem for a downloaded or emailed document. */
export const fileStemFor = (type: InvoiceType): string =>
  type === "tax" ? "tax-invoice" : type;
