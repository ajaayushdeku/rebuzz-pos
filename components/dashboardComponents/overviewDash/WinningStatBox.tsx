import { LucideIcon } from "lucide-react";

export interface WinningStatBoxProps {
  label: string;
  value: string;
  footer?: string;
  icon: LucideIcon;
  iconColor?: string;
  bgColor?: string;
}

const WinningStatBox = ({
  label,
  value,
  footer,
  icon: Icon,
  iconColor,
  bgColor,
}: WinningStatBoxProps) => {
  return (
    <div
      className={`w-full px-4 md:px-6 py-4 md:py-5 ${bgColor || "bg-blue-600"} rounded-2xl shadow-sm`}
    >
      <span className="text-xs md:text-sm font-medium text-white/70 uppercase tracking-wider">
        {label}
      </span>
      <div className="flex items-center justify-between mt-3 md:mt-4">
        <div>
          <span className="font-bold text-lg md:text-2xl text-white">
            {value}
          </span>
          {footer && (
            <p className="text-xs md:text-sm text-white/60 mt-0.5">{footer}</p>
          )}
        </div>
        <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/15">
          <Icon className={`${iconColor || "text-white"} shrink-0`} size={18} />
        </div>
      </div>
    </div>
  );
};

export default WinningStatBox;
