import { NextResponse } from "next/server";
import { sendInvoiceScreenshotEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const { to, subject, html, imageBase64, invoiceNumber } =
      await request.json();

    if (!to) {
      return NextResponse.json(
        { error: "Recipient email is required" },
        { status: 400 },
      );
    }

    if (!imageBase64) {
      return NextResponse.json(
        { error: "Invoice screenshot image is required" },
        { status: 400 },
      );
    }

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return NextResponse.json(
        {
          error: "Email server not configured (EMAIL_USER/EMAIL_PASS env vars)",
        },
        { status: 500 },
      );
    }

    await sendInvoiceScreenshotEmail({
      to,
      subject: subject || `Invoice #${invoiceNumber} from Rebuzz POS`,
      html: html || getDefaultHtml({ invoiceNumber, imageBase64 }),
      imageBase64,
      invoiceNumber: invoiceNumber || "unknown",
    });

    return NextResponse.json({
      success: true,
      message: "Invoice sent successfully!",
    });
  } catch (error) {
    console.error("Failed to send invoice screenshot:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to send email",
      },
      { status: 500 },
    );
  }
}

function getDefaultHtml({
  invoiceNumber,
}: {
  invoiceNumber: string;
  imageBase64: string;
}) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #2563eb, #1d4ed8); padding: 24px; border-radius: 12px; margin-bottom: 24px;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Invoice #${invoiceNumber}</h1>
        <p style="color: #bfdbfe; margin: 8px 0 0 0;">From Rebuzz POS</p>
      </div>

      <p style="color: #374151; font-size: 15px; line-height: 1.6;">
        Please find your invoice attached below. You can view the invoice details
        directly in this email or download the image for your records.
      </p>

      <div style="border: 1px solid #e5e7eb; border-radius: 12px; padding: 8px; margin: 16px 0; background: #f9fafb;">
        <img
          src="cid:invoice-screenshot"
          alt="Invoice #${invoiceNumber}"
          style="width: 100%; border-radius: 8px; display: block;"
        />
      </div>

      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />

      <p style="color: #6b7280; font-size: 12px; text-align: center;">
        This invoice was sent from Rebuzz POS. If you have any questions, please
        contact the sender directly.
      </p>
    </div>
  `;
}
