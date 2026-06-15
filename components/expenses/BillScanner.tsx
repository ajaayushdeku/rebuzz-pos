"use client";

import { useRef, useState } from "react";
import {
  ScanLine,
  Upload,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

export type ExtractedExpense = {
  amount: number;
  date: string;
  purpose: string;
  remarks: string;
  confidence: number;
};

interface BillScannerProps {
  onExtracted: (data: ExtractedExpense) => void;
}

export default function BillScanner({ onExtracted }: BillScannerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<string>("image/jpeg");
  const [isScanning, setIsScanning] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset state
    setStatus("idle");
    setErrorMsg("");

    // Validate type
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) {
      setStatus("error");
      setErrorMsg("Please upload a JPG, PNG, WEBP, or GIF image.");
      return;
    }

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setStatus("error");
      setErrorMsg("Image must be under 5MB.");
      return;
    }

    setMediaType(file.type);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setPreview(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleScan = async () => {
    if (!preview) return;

    setIsScanning(true);
    setStatus("idle");
    setErrorMsg("");

    try {
      // Strip the data:image/...;base64, prefix
      const base64 = preview.split(",")[1];

      const res = await fetch("/api/extract-expense", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, mediaType }),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.error ?? "Extraction failed");
      }

      setStatus("success");
      onExtracted(result.data as ExtractedExpense);
    } catch (err) {
      setStatus("error");
      setErrorMsg(
        err instanceof Error ? err.message : "Could not read the bill",
      );
    } finally {
      setIsScanning(false);
    }
  };

  const handleClear = () => {
    setPreview(null);
    setStatus("idle");
    setErrorMsg("");
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="space-y-3">
      {/* Drop zone / preview */}
      <div
        onClick={() => !preview && inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl transition-colors ${
          preview
            ? "border-blue-200 bg-blue-50/30"
            : "border-gray-200 hover:border-blue-300 hover:bg-blue-50/20 cursor-pointer"
        }`}
      >
        {preview ? (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Bill preview"
              className="w-full max-h-48 object-contain rounded-xl p-2"
            />
            {/* Clear button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              className="absolute top-2 right-2 w-6 h-6 bg-white rounded-full shadow flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors"
            >
              <X size={13} />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 gap-2">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Upload size={18} className="text-blue-500" />
            </div>
            <p className="text-sm font-medium text-gray-600">
              Upload bill or invoice
            </p>
            <p className="text-xs text-gray-400">JPG, PNG, WEBP — max 5MB</p>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Scan button */}
      {preview && (
        <button
          onClick={handleScan}
          disabled={isScanning}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors"
        >
          {isScanning ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              Scanning bill...
            </>
          ) : (
            <>
              <ScanLine size={15} />
              Auto-fill from bill
            </>
          )}
        </button>
      )}

      {/* Status feedback */}
      {status === "success" && (
        <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
          <CheckCircle2 size={13} className="shrink-0" />
          Form filled from bill — review and confirm before saving.
        </div>
      )}

      {status === "error" && (
        <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          <AlertCircle size={13} className="shrink-0" />
          {errorMsg}
        </div>
      )}
    </div>
  );
}
