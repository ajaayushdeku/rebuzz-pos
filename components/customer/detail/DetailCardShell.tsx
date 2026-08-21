import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

/** Surface shared by the info, loyalty and order-history cards. */
export const DETAIL_CARD = " rounded-xl  p-5 shadow-sm";

/**
 * Icon chip, heading, optional right-hand action — the three cards on this
 * page each had their own copy of this row.
 */
export function CardHeader({
  icon: Icon,
  iconColor,
  iconBg,
  action,
  children,
}: {
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <div
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${iconBg}`}
        >
          <Icon size={14} className={iconColor} />
        </div>
        {children}
      </div>
      {action}
    </div>
  );
}
