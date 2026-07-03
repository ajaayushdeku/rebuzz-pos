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
  iconColor = "text-white",
  bgColor = "bg-blue-600",
}: WinningStatBoxProps) => {
  return (
    <div
      className={`relative w-full px-6 pt-4 pb-6 ${bgColor} rounded-2xl overflow-hidden lg:min-h-[180px] flex flex-col justify-center sm:min-h-[120px] `}
    >
      {/* Background ghost icon */}
      <Icon
        size={72}
        className="absolute -top-2 -right-2 opacity-[0.12] text-white"
        aria-hidden="true"
      />

      {/* Content */}
      <div className="relative z-10 ">
        <p className="text-[12px] font-semibold text-white/70 uppercase tracking-widest mb-5">
          {label}
        </p>

        <div className="w-full flex flex-row  justify-between items-center">
          <div>
            <p className="text-[20px] md:text-2xl font-bold text-white leading-tight">
              {value}
            </p>
            {footer && (
              <p className="text-xs text-white/60 mt-1.5 font-medium">
                {footer}
              </p>
            )}
          </div>

          <div className="w-10 h-10 flex items-center justify-center ">
            <Icon
              className={`${iconColor || "text-white"} shrink-0`}
              size={30}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default WinningStatBox;
