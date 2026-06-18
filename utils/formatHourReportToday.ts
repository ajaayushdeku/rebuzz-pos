import { HourlyData } from "@/components/dashboardComponents/overviewDash/HourlySalesChart";

export const formatHourlyData = (
  bills: { grandTotal: number; paidAt: string; isRefunded?: boolean }[],
  hourRange?: { start: number; end: number },
): HourlyData[] => {
  const startHour = hourRange?.start ?? 0;
  const endHour = hourRange?.end ?? 23;

  const hourMap: Record<string, number> = {};

  for (let h = startHour; h <= endHour; h++) {
    hourMap[formatHourLabel(h)] = 0;
  }

  bills.forEach((bill) => {
    if (bill.isRefunded) return;

    const paidAt = bill.paidAt ?? "";
    if (!paidAt) return;

    const timePart = paidAt.includes("T")
      ? paidAt.split("T")[1]
      : paidAt.split(" ")[1];

    if (!timePart) return;

    let hour = parseInt(timePart.split(":")[0], 10);
    let minute = parseInt(timePart.split(":")[1], 10);

    // If hour is less than 12,
    // it means it's UTC time from MongoDB
    // so convert to Nepal time (+5:45)
    if (hour < 12) {
      minute += 45;

      if (minute >= 60) {
        minute -= 60;
        hour += 1;
      }

      hour += 5;

      if (hour >= 24) {
        hour -= 24;
      }
    }

    const label = formatHourLabel(hour);

    if (hourMap[label] !== undefined) {
      hourMap[label] += bill.grandTotal;
    }
  });

  return Object.entries(hourMap).map(([hour, revenue]) => ({
    hour,
    revenue: Math.round(revenue * 100) / 100,
  }));
};

export const formatHourLabel = (hour: number): string => {
  const h = hour.toString().padStart(2, "0");
  return `${h}:00`;
};

export const HOUR_RANGES = [
  { label: "00:00 – 07:59", start: 0, end: 7 },
  { label: "08:00 – 15:59", start: 8, end: 15 },
  { label: "16:00 – 23:59", start: 16, end: 23 },
  { label: "All Day (00:00 – 23:59)", start: 0, end: 23 },
];
