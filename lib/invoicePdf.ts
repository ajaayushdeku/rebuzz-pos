import jsPDF from "jspdf";
import { toJpeg } from "html-to-image";

const PAGE_WIDTH_MM = 210;
const PAGE_HEIGHT_MM = 297;

/**
 * Rasterises an off-screen invoice preview into a compressed, paginated A4 PDF.
 *
 * JPEG at a moderate pixel ratio keeps the canvas within browser limits.
 * Credited invoices add a long payment-history section, making the document
 * tall — a lossless 2x PNG can exceed the canvas/memory cap and produce a
 * blank export, so we mirror the public preview's approach.
 */
export async function buildInvoicePdf(
  ref: React.RefObject<HTMLDivElement | null>,
): Promise<jsPDF | null> {
  if (!ref.current) return null;

  const dataUrl = await toJpeg(ref.current, {
    cacheBust: true,
    quality: 0.7,
    pixelRatio: 1.5,
    backgroundColor: "#ffffff",
  });

  const pdf = new jsPDF({
    orientation: "p",
    unit: "mm",
    format: "a4",
    compress: true,
  });

  const imgProps = pdf.getImageProperties(dataUrl);
  const imgWidth = PAGE_WIDTH_MM;
  const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(
    dataUrl,
    "JPEG",
    0,
    position,
    imgWidth,
    imgHeight,
    undefined,
    "FAST",
  );
  heightLeft -= PAGE_HEIGHT_MM;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(
      dataUrl,
      "JPEG",
      0,
      position,
      imgWidth,
      imgHeight,
      undefined,
      "FAST",
    );
    heightLeft -= PAGE_HEIGHT_MM;
  }

  return pdf;
}
