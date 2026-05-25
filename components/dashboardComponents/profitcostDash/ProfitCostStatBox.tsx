import { ICON_MAP } from "@/lib/config/dashboard";
import { StatBoxProps } from "../StatBox";

export default function ProfitCostStatBox({
  label,
  value,
  iconName,
  iconColor,
  bgColor,
}: StatBoxProps) {
  const Icon = ICON_MAP[iconName];
  return (
    <div className="border w-full px-3 py-4 md:px-6 md:py-6  rounded-lg shadow-md hover:shadow-lg transition duration-300">
      <div className="flex justify-between items-end ">
        <p className="text-gray-500 text-xs md:text-sm leading-tight">
          {label}
        </p>

        <Icon
          size={16}
          className={`${iconColor} mb-1 ${bgColor} rounded-lg shrink-0`}
        />
      </div>
      <div className="py-2 md:py-4 mt-1 md:mt-2">
        <span className="font-bold text-lg md:text-2xl">
          {value}
        </span>
      </div>
    </div>
  );
}
