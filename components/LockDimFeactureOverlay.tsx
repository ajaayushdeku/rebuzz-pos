import { Lock } from "lucide-react";
import React from "react";

const LockDimFeactureOverlay = ({component_name}: {component_name: string}) => {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-black/2 backdrop-blur-[1px]">
      <div className="flex flex-col items-center gap-3 text-center px-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 shadow-sm">
          <Lock size={22} />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-800">Feature locked</p>
          <p className="text-xs  mt-0.5">
            Upgrade your plan to unlock the {component_name}
          </p>
        </div>
      </div>
    </div>
  );
};

export default LockDimFeactureOverlay;
