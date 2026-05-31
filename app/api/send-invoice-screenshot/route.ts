import { NextResponse } from "next/server";
import { resend } from "@/lib/resend";

export async function POST(request: Request) {
  try {
    const { to, subject, imageBase64, invoiceNumber, businessName } =
      await request.json();

    if (!to) {
      return NextResponse.json(
        { error: "Recipient email is required" },
        { status: 400 },
      );
    }

    if (!imageBase64) {
      return NextResponse.json(
        { error: "Invoice image is required" },
        { status: 400 },
      );
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: "RESEND_API_KEY is not configured" },
        { status: 500 },
      );
    }

    // Strip the data:image/png;base64, prefix
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    const { data, error } = await resend.emails.send({
      from: `${businessName ?? "Rebuzz POS"} <onboarding@resend.dev>`,
      // ↑ Use your verified domain in production:
      // from: `${businessName} <invoices@yourdomain.com>`,
      to: [to],
      subject: subject ?? `Invoice #${invoiceNumber}`,
      html: getEmailHtml({ invoiceNumber, businessName }),
      attachments: [
        {
          filename: `Invoice-${invoiceNumber}.png`,
          content: base64Data,
        },
      ],
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, id: data?.id });
  } catch (error) {
    console.error("Send invoice error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to send email",
      },
      { status: 500 },
    );
  }
}

function getEmailHtml({
  invoiceNumber,
  businessName,
}: {
  invoiceNumber: string;
  businessName?: string;
}) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Invoice #${invoiceNumber}</title>
</head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#2563eb,#1d4ed8);padding:28px 32px;border-radius:16px 16px 0 0;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">
                Invoice #${invoiceNumber}
              </h1>
              <p style="margin:6px 0 0;color:#bfdbfe;font-size:14px;">
                From ${businessName ?? "Rebuzz POS"}
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#ffffff;padding:28px 32px;">
              <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6;">
                Please find your invoice attached to this email as an image.
                You can also download it for your records.
              </p>
              <p style="margin:0;color:#6b7280;font-size:14px;line-height:1.6;">
                If you have any questions about this invoice, please contact us
                directly.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f3f4f6;padding:20px 32px;border-radius:0 0 16px 16px;text-align:center;">
              <p style="margin:0;color:#9ca3af;font-size:12px;">
                Sent via Rebuzz POS · ${businessName ?? ""}
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>
  `;
}
