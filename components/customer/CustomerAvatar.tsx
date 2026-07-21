"use client";

import { useState } from "react";

/**
 * A round avatar that shows a photo when available, otherwise falls back to the
 * person's initial. Used for customers (with image) and staff (initial only).
 */
export function CustomerAvatar({
  src,
  name,
  className = "",
  textClass = "text-sm",
  onClick,
}: {
  src: string | null;
  name: string;
  className?: string;
  textClass?: string;
  /** When provided and an image exists, the photo becomes clickable. */
  onClick?: () => void;
}) {
  const [failed, setFailed] = useState(false);

  if (src && !failed) {
    return (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img
        src={src}
        alt={name}
        onError={() => setFailed(true)}
        onClick={onClick}
        title={onClick ? "View photo" : undefined}
        className={`rounded-full object-cover bg-gray-100 ${
          onClick ? "cursor-pointer" : ""
        } ${className}`}
      />
    );
  }

  return (
    <div
      className={`rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold ${textClass} ${className}`}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

export default CustomerAvatar;
