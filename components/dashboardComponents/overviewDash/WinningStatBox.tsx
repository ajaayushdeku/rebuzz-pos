import { LucideIcon } from "lucide-react";

export interface WinningStatBoxProps {
  label: string;
  value: string;
  /**
   * Drawn beside the value, for the cards where the figure carries a mood —
   * a frown on "No Streak". Sized to the value's own type rather than the
   * card's corner icon, since it is read as part of the sentence.
   */
  valueIcon?: LucideIcon;
  /** Small companion beside the value — e.g. the 12-hour peak-hour window. */
  valueNote?: string;
  footer?: string;
  icon: LucideIcon;
  iconColor?: string;
  bgColor?: string;
}

const WinningStatBox = ({
  label,
  value,
  valueIcon: ValueIcon,
  valueNote,
  footer,
  icon: Icon,
  iconColor = "text-white",
  bgColor = "bg-blue-600",
}: WinningStatBoxProps) => {
  return (
    <div
      className={`relative w-full px-6 pt-4 pb-6 ${bgColor} rounded-2xl overflow-hidden lg:min-h-[180px] flex flex-col justify-center min-h-[150px] sm:min-h-[150px] `}
    >
      {/* Background ghost icon */}
      <Icon
        size={78}
        className="absolute -top-2 -right-2 opacity-[0.12] text-white"
        aria-hidden="true"
      />

      {/* Content */}
      <div className="relative z-10 ">
        <p className="text-[12px] font-semibold text-white/70 uppercase tracking-widest mb-5">
          {label}
        </p>

        <div className="w-full flex flex-row  justify-between items-center">
          <div className="min-w-0">
            {/* flex rather than an inline icon: the value is the largest thing
                on the card, and an icon baseline-aligned to 24px bold text
                sits low. Centred on the line instead. */}
            <p className="flex items-center gap-1.5 text-[20px] md:text-2xl font-bold tracking-wide text-white leading-tight">
              {value}
              {ValueIcon && (
                <ValueIcon
                  size={22}
                  className="shrink-0 text-white"
                  aria-hidden
                />
              )}
            </p>
            {valueNote && (
              // Same idiom as the chart axes: 24-hour figure, 12-hour in
              // brackets underneath.
              <p className="mt-0.5 text-[11px] font-medium tracking-wide text-white/70 tabular-nums">
                [ {valueNote} ]
              </p>
            )}
            {footer && (
              <p className="text-xs text-white/60 tracking-wide mt-1.5">
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
