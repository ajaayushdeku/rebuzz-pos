import { HourlyData } from "@/components/dashboardComponents/overviewDash/HourlySalesChart";

export const formatHourlyData = (
  bills: { grandTotal: number; paidAt: string; isRefunded?: boolean }[],
): HourlyData[] => {
  const hourMap: Record<string, number> = {};

  for (let h = 8; h <= 22; h++) {
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
  if (hour === 12) return "12PM";
  if (hour === 0) return "12AM";

  return hour < 12 ? `${hour}AM` : `${hour - 12}PM`;
};

// import { HourlyData } from "@/components/dashboardComponents/overviewDash/HourlySalesChart";

// export const formatHourlyData = (
//   bills: { grandTotal: number; paidAt: string; isRefunded?: boolean }[],
// ): HourlyData[] => {
//   const hourMap: Record<string, number> = {};
//   for (let h = 8; h <= 22; h++) {
//     hourMap[formatHourLabel(h)] = 0;
//   }

//   bills.forEach((bill) => {
//     if (bill.isRefunded) return;

//     const paidAt = bill.paidAt ?? "";
//     if (!paidAt) return;

//     // Handle both formats:
//     //   ISO:   "2026-05-12T12:24:20.929Z"  (split on "T")
//     //   Legacy: "2026-05-12 12:24:20.929"   (split on " ")
//     const timePart = paidAt.includes("T")
//       ? paidAt.split("T")[1]
//       : paidAt.split(" ")[1];
//     if (!timePart) return;
//     // console.log("timepart:", timePart);

//     const hour = parseInt(timePart.split(":")[0], 10);
//     const label = formatHourLabel(hour);

//     if (hourMap[label] !== undefined) {
//       hourMap[label] += bill.grandTotal;
//     }
//   });

//   // console.log("Hourly Bills:", bills);

//   return Object.entries(hourMap).map(([hour, revenue]) => ({
//     hour,
//     revenue: Math.round(revenue * 100) / 100,
//   }));
// };

// export const formatHourLabel = (hour: number): string => {
//   if (hour === 12) return "12PM";
//   if (hour === 0) return "12AM";
//   return hour < 12 ? `${hour}AM` : `${hour - 12}PM`;
// };
