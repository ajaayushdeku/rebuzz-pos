/**
 * What the AI Insights section routes read from the POS, on the server.
 *
 * Each section route starts the same way — who is asking, whether they want a
 * fresh answer, what today is — and reads from the same few reports. Kept here
 * so the routes only differ in what they work out and what they ask.
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

import { readCurrency } from "@/lib/ai-insights/collectBriefingData.server";
import {
  INVENTORY_PRODUCTS_PATH,
  mapInventoryProduct,
} from "@/lib/inventory/mapInventoryProduct";
import { nepalToday } from "@/lib/nepalDate";
import { stockOnHand } from "@/lib/salesVelocity";
import type { DailySalesRow } from "@/lib/ai-insights/sections/festivalPrep";
import type { ReportBill } from "@/lib/ai-insights/sections/hourPlaybook";
import type {
  DateWindow,
  MenuProduct,
  SalesByItemRow,
} from "@/lib/ai-insights/sections/shared";

const BASE = process.env.NEXT_PUBLIC_API_URL;

type SectionRequest =
  | { ok: true; token: string; refresh: boolean; today: string }
  | { ok: false; response: NextResponse };

/** The session, the refresh flag and today's date in Nepal. */
export async function readSectionRequest(
  req: NextRequest,
): Promise<SectionRequest> {
  const token = (await cookies()).get("token")?.value;
  if (!token) {
    return {
      ok: false,
      response: NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 }),
    };
  }

  const body = await req.json().catch(() => null);
  return {
    ok: true,
    token,
    // Strictly `true`, as at the AI service: only a deliberate refresh spends.
    refresh: body?.refresh === true,
    today: nepalToday(),
  };
}

/** The answer when a POS report a section needs did not load. */
export function salesDataUnavailable(section: string, error: unknown) {
  console.error(
    `[ai-insights/${section}] POS data failed:`,
    (error as Error)?.message,
  );
  return NextResponse.json(
    { error: "SALES_DATA_UNAVAILABLE" },
    { status: 502 },
  );
}

/** The business's currency symbol, "Rs" when it cannot be read. */
export async function currencySymbol(): Promise<string> {
  return (await readCurrency())?.symbol ?? "Rs";
}

async function posGet(token: string, path: string) {
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`${path} ${res.status}`);
  return res.json();
}

export async function fetchSalesRows(
  token: string,
  { startDate, endDate }: DateWindow,
): Promise<SalesByItemRow[]> {
  const json = await posGet(
    token,
    `/business/report/salesByItem?startDate=${startDate}&endDate=${endDate}`,
  );
  return Array.isArray(json?.data) ? json.data : [];
}

/** Sales per day over a window. Days with no sales are not in the list. */
export async function fetchDailySales(
  token: string,
  { startDate, endDate }: DateWindow,
): Promise<DailySalesRow[]> {
  const json = await posGet(
    token,
    `/business/report/compare-sales-by-date?startDate=${startDate}&endDate=${endDate}`,
  );
  return Array.isArray(json?.data) ? json.data : [];
}

/** Every bill in a window, from the sales report. */
export async function fetchReportBills(
  token: string,
  { startDate, endDate }: DateWindow,
): Promise<ReportBill[]> {
  const json = await posGet(
    token,
    `/business/report?startDate=${startDate}&endDate=${endDate}`,
  );
  const bills = json?.data?.report?.allBills;
  return Array.isArray(bills) ? bills : [];
}

/** Category id → name. An empty map when the list cannot be read. */
async function fetchCategoryNames(token: string): Promise<Map<string, string>> {
  try {
    const json = await posGet(token, "/business/categories/");
    const list: { _id?: string; name?: string }[] =
      json?.data?.categories ?? [];
    return new Map(
      list
        .filter((c) => c._id && c.name)
        .map((c) => [String(c._id), String(c.name)]),
    );
  } catch {
    // Names are a nicety for the model; a menu without them still works.
    return new Map();
  }
}

/** A product's category field, which arrives as an id, a list, or an object. */
function categoryName(raw: unknown, names: Map<string, string>): string | null {
  const first = Array.isArray(raw) ? raw[0] : raw;
  if (typeof first === "string") return names.get(first) ?? null;
  if (first && typeof first === "object") {
    const obj = first as { name?: unknown; _id?: unknown };
    if (typeof obj.name === "string") return obj.name;
    if (typeof obj._id === "string") return names.get(obj._id) ?? null;
  }
  return null;
}

/**
 * The menu: every product with its price, cost, stock and description.
 *
 * Read from the endpoint that carries variants, for the reason given on
 * INVENTORY_PRODUCTS_PATH: without them, a product whose stock lives on its
 * variants looks empty.
 */
export async function fetchMenu(token: string): Promise<MenuProduct[]> {
  const [json, names] = await Promise.all([
    posGet(token, INVENTORY_PRODUCTS_PATH),
    fetchCategoryNames(token),
  ]);
  const raw: Record<string, unknown>[] = json?.data?.products ?? [];

  return raw.map((p) => {
    const item = mapInventoryProduct(p);
    const variants = item.variants ?? [];
    const variantPrices = variants.map((v) => v.price).filter((v) => v > 0);
    const variantCosts = variants.map((v) => v.costPrice).filter((v) => v > 0);

    return {
      id: item.id,
      name: item.name.trim(),
      categoryName: categoryName(p.categories, names),
      price:
        item.price > 0
          ? item.price
          : variantPrices.length > 0
            ? Math.min(...variantPrices)
            : 0,
      costPrice:
        (item.costPrice ?? 0) > 0
          ? item.costPrice
          : variantCosts.length > 0
            ? Math.min(...variantCosts)
            : 0,
      description:
        typeof p.description === "string" ? p.description.trim() : "",
      isAvailable: item.isAvailable,
      stock: stockOnHand(item),
      variantNames: variants
        .map((v) => v.optionValues.join(" · "))
        .filter(Boolean),
    };
  });
}
