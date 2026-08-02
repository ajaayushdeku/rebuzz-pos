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

    // ── Gross revenue + net profit from compare-sales-by-month ───────────
    // This endpoint returns both `totalRevenue` (gross) and `totalNetProfit`
    // (net) per month in a single call, so we no longer need the 12 sequential
    // salesByItem requests. Using one source for both metrics also guarantees
    // net profit can never exceed gross revenue.
    const compareRes = await axios.get(
      `${BASE}/business/report/compare-sales-by-month?startDate=${yearStart}&endDate=${yearEnd}`,
      { headers },
    );

    const monthlyData: {
      monthStart: string;
      totalRevenue: number;
      totalNetProfit: number;
    }[] = compareRes.data?.data ?? [];

    const dataMap = new Map<
      string,
      { grossRevenue: number; netProfit: number }
    >();
    for (const m of monthlyData) {
      const label = new Date(m.monthStart + "T00:00:00").toLocaleDateString(
        "en-US",
        { month: "short" },
      );
      dataMap.set(label, {
        grossRevenue: m.totalRevenue ?? 0,
        netProfit: m.totalNetProfit ?? 0,
      });
    }

    const result = monthRanges.map(({ label }) => ({
      month: label,
      grossRevenue: dataMap.get(label)?.grossRevenue ?? 0,
      netProfit: dataMap.get(label)?.netProfit ?? 0,
    }));

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error("Profit trend error:", error);
    return NextResponse.json({ data: [] }, { status: 500 });
  }
}
