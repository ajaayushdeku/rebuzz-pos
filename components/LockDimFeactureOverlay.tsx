import { Lock } from "lucide-react";
import React from "react";

const LockDimFeactureOverlay = ({
  component_name,
}: {
  component_name: string;
}) => {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-black/3 backdrop-blur-[1px]">
      <div className="flex flex-col items-center gap-3 text-center px-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600 shadow-sm">
          <Lock size={22} />
        </div>
        <div>
          <p className="text-sm font-semibold text-white-800">
            Feature Available
          </p>
          <p className="text-xs text-white-900  mt-0.5">
            Please wait for the {component_name} to be available
          </p>
        </div>
      </div>
    </div>
  );
};

export default LockDimFeactureOverlay;
