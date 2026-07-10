import { Lock } from "lucide-react";
import React from "react";

const LockDimFeactureOverlay = ({
  component_name,
}: {
  component_name: string;
}) => {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl overflow-hidden">
      {/* Diagonal hatch pattern background */}
      <svg
        className="absolute inset-0 w-full h-full"
        width="100%"
        height="100%"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="diagonalHatch"
            patternUnits="userSpaceOnUse"
            width="20"
            height="20"
            patternTransform="rotate(45)"
          >
            <line
              x1="0"
              y1="0"
              x2="0"
              y2="24"
              stroke="rgba(255, 255, 255, 0.2)"
              strokeWidth="2"
            />
          </pattern>

          <linearGradient id="fadeGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgba(0,0,0,0.4)" />
            <stop offset="50%" stopColor="rgba(0,0,0,0.3)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.45)" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#fadeGradient)" />
        <rect width="100%" height="100%" fill="url(#diagonalHatch)" />
      </svg>

      {/* Cross-hatch secondary pattern for extra texture */}
      <svg
        className="absolute inset-0 w-full h-full opacity-50"
        width="100%"
        height="100%"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="diagonalHatchReverse"
            patternUnits="userSpaceOnUse"
            width="24"
            height="24"
            patternTransform="rotate(-45)"
          >
            <line
              x1="0"
              y1="0"
              x2="0"
              y2="24"
              stroke="rgba(255,255,255,0.03)"
              strokeWidth="1.5"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#diagonalHatchReverse)" />
      </svg>

      {/* Subtle spotlight gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-black/10" />

      {/* Content */}
      <div className="relative flex flex-col items-center gap-3 text-center px-6 py-4">
        {/* Lock icon with subtle glow */}
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50/90 text-blue-600 shadow-lg shadow-blue-600/10 ring-1 ring-blue-200/50 backdrop-blur-sm">
          <Lock size={22} />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-100">Feature Unavailable</p>
          <p className="text-xs text-gray-100 font-semibold mt-0.5 max-w-[300px]">
            Please wait for the {component_name} to be available
          </p>
        </div>
      </div>
    </div>
  );
};

export default LockDimFeactureOverlay;
