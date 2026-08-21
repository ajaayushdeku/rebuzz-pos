"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

/** Full-size photo lightbox. */
export default function PhotoViewer({
  open,
  src,
  alt,
  onClose,
}: {
  open: boolean;
  src: string | null;
  alt: string;
  onClose: () => void;
}) {
  // Escape closes, and the page behind stops scrolling — neither worked
  // before, so the overlay could be left open with the page moving under it.
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open || !src) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute right-4 top-4 text-white/80 hover:text-white"
      >
        <X size={26} />
      </button>

      <div className="w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className="max-h-[80vh] w-full rounded-lg bg-black object-contain"
        />
        <p className="mt-2 truncate text-center text-xs text-white/70">{alt}</p>
      </div>
    </div>,
    document.body,
  );
}
