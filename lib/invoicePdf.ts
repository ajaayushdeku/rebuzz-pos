import jsPDF from "jspdf";
import { toCanvas, toJpeg } from "html-to-image";

const PAGE_WIDTH_MM = 210;
const PAGE_HEIGHT_MM = 297;

/**
 * A4 at 96dpi. Off-screen nodes are absolutely positioned, so they size to
 * their content — which is why an unconstrained document rasterises at some
 * arbitrary width and then reads as cramped once scaled onto the page.
 * Rendering at a real page width fixes the proportions before capture.
 */
export const PDF_RENDER_WIDTH_PX = 794;

/**
 * A4 height at the same 96dpi. A document with a taller minimum height spills
 * onto a second, near-empty page however short its content is.
 */
export const PDF_RENDER_HEIGHT_PX = 1123;

/** Below this share of a page, a break is not worth taking — the page would
 *  end up mostly blank, which looks worse than a slightly tight one. */
const MIN_PAGE_FILL = 0.45;

/**
 * Y offsets (in canvas pixels) where a page may be cut without slicing through
 * content. Anything marked `data-pdf-block` contributes its bottom edge.
 */
function collectBreakOffsets(node: HTMLElement, scale: number): number[] {
  const rootTop = node.getBoundingClientRect().top;
  const blocks = node.querySelectorAll<HTMLElement>("[data-pdf-block]");

  const offsets = new Set<number>();
  blocks.forEach((el) => {
    const bottom = (el.getBoundingClientRect().bottom - rootTop) * scale;
    if (bottom > 0) offsets.add(Math.round(bottom));
  });

  return [...offsets].sort((a, b) => a - b);
}

/** The last safe break at or before `target`, or null if none is usable. */
function pickBreak(
  breaks: number[],
  from: number,
  target: number,
  minHeight: number,
): number | null {
  let best: number | null = null;
  for (const b of breaks) {
    if (b > target) break;
    if (b - from >= minHeight) best = b;
  }
  return best;
}

/**
 * Rasterises a document once, then cuts it into A4 pages **between** its
 * blocks rather than at fixed intervals.
 *
 * `buildInvoicePdf` re-draws one tall image at shifting offsets, so a page
 * boundary lands wherever it falls — through a table row, through the totals,
 * through a line of text. Here the source canvas is sliced, and each cut is
 * snapped back to the nearest `data-pdf-block` boundary above it, so a block
 * that would straddle the fold moves to the next page whole.
 *
 * Mark the document's own sections and rows with `data-pdf-block`; with no
 * marks at all this degrades to fixed-interval slicing, which is what the old
 * behaviour was.
 */
export async function buildPaginatedPdf(
  ref: React.RefObject<HTMLElement | null>,
  {
    pixelRatio = 2,
    quality = 0.92,
    marginMm = 0,
  }: { pixelRatio?: number; quality?: number; marginMm?: number } = {},
): Promise<jsPDF | null> {
  const node = ref.current;
  if (!node) return null;

  const canvas = await toCanvas(node, {
    cacheBust: true,
    pixelRatio,
    backgroundColor: "#ffffff",
  });
  if (!canvas.width || !canvas.height) return null;

  // CSS pixels → canvas pixels. Taken from the node's own width rather than
  // assumed, so a document rendered at any width still measures correctly.
  const scale = canvas.width / node.offsetWidth;

  const pdf = new jsPDF({
    orientation: "p",
    unit: "mm",
    format: "a4",
    compress: true,
  });

  const contentWidthMm = PAGE_WIDTH_MM - marginMm * 2;
  const contentHeightMm = PAGE_HEIGHT_MM - marginMm * 2;
  const pxPerMm = canvas.width / contentWidthMm;
  const pageHeightPx = contentHeightMm * pxPerMm;

  const breaks = collectBreakOffsets(node, scale);
  const minSliceHeight = pageHeightPx * MIN_PAGE_FILL;

  let cursor = 0;
  let firstPage = true;

  // A pixel of slack: floating-point height can leave a sliver that would
  // otherwise become a blank final page.
  while (cursor < canvas.height - 1) {
    const target = cursor + pageHeightPx;

    let end: number;
    if (target >= canvas.height) {
      end = canvas.height;
    } else {
      end =
        pickBreak(breaks, cursor, target, minSliceHeight) ?? Math.floor(target);
    }

    const sliceHeight = Math.round(end - cursor);
    if (sliceHeight <= 0) break;

    const slice = document.createElement("canvas");
    slice.width = canvas.width;
    slice.height = sliceHeight;

    const ctx = slice.getContext("2d");
    if (!ctx) return null;
    // JPEG has no alpha; without this, transparent areas come out black.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, slice.width, slice.height);
    ctx.drawImage(
      canvas,
      0,
      cursor,
      canvas.width,
      sliceHeight,
      0,
      0,
      canvas.width,
      sliceHeight,
    );

    if (!firstPage) pdf.addPage();
    pdf.addImage(
      slice.toDataURL("image/jpeg", quality),
      "JPEG",
      marginMm,
      marginMm,
      contentWidthMm,
      sliceHeight / pxPerMm,
      undefined,
      "FAST",
    );

    firstPage = false;
    cursor = end;
  }

  return pdf;
}

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
