import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import axios from "axios";
import { authHeaders } from "@/services/authServices/session";

const BASE = process.env.NEXT_PUBLIC_API_URL;

export async function GET() {
  try {
    const today = new Date();

    // Build 12 month ranges
    const monthRanges: { label: string; start: string; end: string }[] = [];
    for (let i = 11; i >= 0; i--) {
      const firstDay = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const lastDay =
        i === 0
          ? today
          : new Date(today.getFullYear(), today.getMonth() - i + 1, 0);

      monthRanges.push({
        label: firstDay.toLocaleDateString("en-US", { month: "short" }),
        start: firstDay.toISOString().split("T")[0],
        end: lastDay.toISOString().split("T")[0],
      });
    }

    const headers = await authHeaders();
    const yearStart = monthRanges[0].start;
    const yearEnd = monthRanges[monthRanges.length - 1].end;

    // ── Gross revenue from compare-sales-by-month ─────────────────────────
    const compareRes = await axios.get(
      `${BASE}/business/report/compare-sales-by-month?startDate=${yearStart}&endDate=${yearEnd}`,
      { headers },
    );

    const monthlyRevenue: { monthStart: string; totalRevenue: number }[] =
      compareRes.data?.data ?? [];

    console.log("Monthly Sales:", monthlyRevenue);

    const revenueMap = new Map<string, number>();
    for (const m of monthlyRevenue) {
      const label = new Date(m.monthStart + "T00:00:00").toLocaleDateString(
        "en-US",
        { month: "short" },
      );
      revenueMap.set(label, m.totalRevenue);
    }

    // ── Net profit: one salesByItem call per month sequentially ──────────
    const netProfitMap = new Map<string, number>();

    for (const { label, start, end } of monthRanges) {
      try {
        const res = await axios.get(
          `${BASE}/business/report/salesByItem?startDate=${start}&endDate=${end}`,
          { headers },
        );

        // console.log(
        //   `${BASE}/business/report/salesByItem?startDate=${start}&endDate=${end}`,
        // );

        const items: { netProfit?: number }[] = res.data?.data ?? [];
        const totalDiscount: number = res.data?.totalDiscount ?? 0;
        const totalRedeemPoint: number = res.data?.totalRedeemPoint ?? 0;

        const rawNetProfit = items.reduce(
          (sum, item) => sum + (item.netProfit ?? 0),
          0,
        );
        const netProfit =
          Math.round((rawNetProfit - totalDiscount - totalRedeemPoint) * 100) /
          100;

        netProfitMap.set(label, netProfit);
      } catch {
        netProfitMap.set(label, 0);
      }
    }

    const result = monthRanges.map(({ label }) => ({
      month: label,
      grossRevenue: revenueMap.get(label) ?? 0,
      netProfit: netProfitMap.get(label) ?? 0,
    }));

    // console.log("Profit Trend Result:", result);

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error("Profit trend error:", error);
    return NextResponse.json({ data: [] }, { status: 500 });
  }
}
