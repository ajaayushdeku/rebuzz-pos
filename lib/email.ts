import nodemailer from "nodemailer";

// Create reusable transporter (configure via env variables)
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

interface SendInvoiceScreenshotOptions {
  to: string;
  subject: string;
  html: string;
  imageBase64: string;
  invoiceNumber: string;
}

/**
 * Send an invoice screenshot as an embedded image in the email
 */
export async function sendInvoiceScreenshotEmail({
  to,
  subject,
  html,
  imageBase64,
  invoiceNumber,
}: SendInvoiceScreenshotOptions) {
  // Strip the data:image/png;base64, prefix if present
  const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

  const mailOptions: nodemailer.SendMailOptions = {
    from: process.env.EMAIL_FROM || `"Rebuzz POS" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
    attachments: [
      {
        filename: `Invoice-${invoiceNumber}.png`,
        content: base64Data,
        encoding: "base64",
        cid: "invoice-screenshot",
      },
    ],
  };

  return transporter.sendMail(mailOptions);
}
