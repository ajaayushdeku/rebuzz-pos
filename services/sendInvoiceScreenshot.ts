import { toPng } from "html-to-image";

interface SendInvoiceScreenshotOptions {
  /** The DOM element containing the invoice to capture */
  element: HTMLElement;
  /** Recipient email address */
  to: string;
  /** Invoice number */
  invoiceNumber: string;
  /** Optional custom subject line */
  subject?: string;
  /** Optional custom HTML body */
  html?: string;
}

/**
 * Captures an invoice DOM element as a PNG screenshot and sends it via email.
 *
 * Usage example:
 * ```tsx
 * import { sendInvoiceScreenshot } from "@/services/sendInvoiceScreenshot";
 *
 * const handleSend = async () => {
 *   if (!invoiceRef.current) return;
 *   try {
 *     await sendInvoiceScreenshot({
 *       element: invoiceRef.current,
 *       to: "customer@example.com",
 *       invoiceNumber: "123",
 *     });
 *     toast.success("Invoice sent!");
 *   } catch (err) {
 *     toast.error("Failed to send invoice");
 *   }
 * };
 * ```
 */
export async function sendInvoiceScreenshot({
  element,
  to,
  invoiceNumber,
  subject,
  html,
}: SendInvoiceScreenshotOptions): Promise<void> {
  // Capture the element as a PNG data URL
  const dataUrl = await toPng(element, {
    cacheBust: true,
    pixelRatio: 2,
    backgroundColor: "#ffffff",
  });

  // Send to the API route
  const response = await fetch("/api/send-invoice-screenshot", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to,
      subject,
      html,
      imageBase64: dataUrl,
      invoiceNumber,
    }),
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || "Failed to send invoice");
  }
}
