import { toPng } from "html-to-image";

interface SendInvoiceScreenshotOptions {
  element: HTMLElement;
  to: string;
  invoiceNumber: string;
  subject?: string;
  businessName?: string;
}

export async function sendInvoiceScreenshot({
  element,
  to,
  invoiceNumber,
  subject,
  businessName,
}: SendInvoiceScreenshotOptions): Promise<void> {
  const dataUrl = await toPng(element, {
    cacheBust: true,
    pixelRatio: 2,
    backgroundColor: "#ffffff",
  });

  const response = await fetch("/api/send-invoice-screenshot", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      to,
      subject,
      imageBase64: dataUrl,
      invoiceNumber,
      businessName,
    }),
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || "Failed to send invoice");
  }
}
