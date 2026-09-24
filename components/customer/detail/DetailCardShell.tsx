import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

/**
 * Surface shared by the info, loyalty and order-history cards — the page's
 * flat white card with a hairline border, the same frame the dashboard cards
 * use. It replaces a borderless `shadow-sm` box.
 */
export const DETAIL_CARD = "rounded-2xl border border-[#e3e3e3] bg-white p-5";

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
        {/* `border-current/20` frames the tile in the icon's own hue, as the
            stat tiles and dashboard card icons do. */}
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-current/20 ${iconBg} ${iconColor}`}
        >
          <Icon size={16} />
        </div>
        {children}
      </div>
      {action}
    </div>
  );
}
