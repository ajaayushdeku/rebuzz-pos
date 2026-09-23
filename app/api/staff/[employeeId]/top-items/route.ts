// import { cookies } from "next/headers";
// import { NextRequest, NextResponse } from "next/server";

// const BASE = process.env.NEXT_PUBLIC_API_URL;

// interface BillRecord {
//   _id: string;
//   generatedById: string;
//   invoiceNo: number;
//   [key: string]: unknown;
// }

// interface BillDetailItem {
//   product?: string;
//   productName?: string;
//   quantity?: number;
//   _id?: string;
//   [key: string]: unknown;
// }

// interface BillDetailItemWrapper {
//   item?: BillDetailItem[];
//   [key: string]: unknown;
// }

// interface BillDetail {
//   data?: {
//     bill?: {
//       items?: BillDetailItemWrapper[];
//       [key: string]: unknown;
//     };
//     [key: string]: unknown;
//   };
//   [key: string]: unknown;
// }

// export const GET = async (
//   request: NextRequest,
//   { params }: { params: Promise<{ employeeId: string }> },
// ) => {
//   const { employeeId } = await params;
//   const cookieStore = await cookies();
//   const token = cookieStore.get("token")?.value;

//   if (!token) {
//     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//   }

//   const { searchParams } = new URL(request.url);
//   const startDate = searchParams.get("startDate") ?? "";
//   const endDate = searchParams.get("endDate") ?? "";

//   try {
//     // Fetch bills from the external API with a high limit so all bills in the
//     // date range are retrieved (matches the pattern used by tickets/bills routes).
//     // Using a small limit (e.g. 10) only returns the most recent bills across ALL
//     // employees, so the selected employee's bills are usually missing.
//     let billsUrl = `${BASE}/business/ticket/bills?limit=1000`;
//     if (startDate) billsUrl += `&startDate=${startDate}`;
//     if (endDate) billsUrl += `&endDate=${endDate}`;

//     const billsRes = await fetch(billsUrl, {
//       headers: {
//         Authorization: `Bearer ${token}`,
//         "Content-Type": "application/json",
//       },
//     });

//     if (!billsRes.ok) {
//       return NextResponse.json(
//         { error: "Failed to fetch bills" },
//         { status: billsRes.status },
//       );
//     }

//     const billsData = await billsRes.json();
//     const allBills: BillRecord[] =
//       billsData?.data?.bill ?? billsData?.bill ?? billsData?.data ?? [];

//     // Filter bills for the selected employee
//     const employeeBills = allBills.filter(
//       (bill) => bill.generatedById === employeeId,
//     );

//     // Fetch item details for each bill
//     const itemMap = new Map<string, { name: string; quantity: number }>();

//     await Promise.all(
//       employeeBills.map(async (bill) => {
//         try {
//           const billRes = await fetch(
//             `${BASE}/business/ticket/${bill.invoiceNo}/bill`,
//             {
//               headers: {
//                 Authorization: `Bearer ${token}`,
//                 "Content-Type": "application/json",
//               },
//             },
//           );

//           if (!billRes.ok) return;

//           const billDetail: BillDetail = await billRes.json();
//           const itemWrappers = billDetail?.data?.bill?.items ?? [];

//           itemWrappers.forEach((wrapper) => {
//             const innerItems = wrapper.item ?? [];
//             innerItems.forEach((innerItem) => {
//               const itemId =
//                 (innerItem.product as string) || innerItem._id || "unknown";
//               const itemName =
//                 (innerItem.productName as string) || "Unknown Item";
//               const quantity = (innerItem.quantity as number) || 0;

//               const existing = itemMap.get(itemId);
//               if (existing) {
//                 existing.quantity += quantity;
//               } else {
//                 itemMap.set(itemId, { name: itemName, quantity });
//               }
//             });
//           });
//         } catch {
//           // Skip failed bill detail fetches
//         }
//       }),
//     );

//     // Convert to array and sort by quantity
//     const topItems = Array.from(itemMap.entries())
//       .map(([itemId, data]) => ({
//         itemId,
//         itemName: data.name,
//         totalQuantity: data.quantity,
//       }))
//       .sort((a, b) => b.totalQuantity - a.totalQuantity)
//       .slice(0, 10);

//     return NextResponse.json({
//       status: "success",
//       data: {
//         items: topItems,
//         totalBillsAnalyzed: employeeBills.length,
//       },
//     });
//   } catch (error) {
//     console.error("Error fetching top items:", error);
//     return NextResponse.json(
//       { error: "Failed to fetch top items data" },
//       { status: 500 },
//     );
//   }
// };

import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const BASE = process.env.NEXT_PUBLIC_API_URL;

interface BillRecord {
  _id: string;
  generatedById: string;
  invoiceNo: number;
  [key: string]: unknown;
}

/**
 * The variant a line was sold as. A product with variants keeps the same
 * `product` id on every line, so this is the only thing that tells "Jelly
 * [small]" apart from "Jelly [large]".
 */
interface BillVariantItem {
  variant?: string;
  name?: string;
  quantity?: number;
  [key: string]: unknown;
}

interface BillDetailItem {
  product?: string;
  productName?: string;
  quantity?: number;
  /** One object in the bills seen so far; an array is handled all the same. */
  variantItems?: BillVariantItem | BillVariantItem[];
  _id?: string;
  [key: string]: unknown;
}

interface BillDetailItemWrapper {
  item?: BillDetailItem[];
  [key: string]: unknown;
}

interface BillDetail {
  data?: {
    bill?: {
      items?: BillDetailItemWrapper[];
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export const GET = async (
  request: NextRequest,
  { params }: { params: Promise<{ employeeId: string }> },
) => {
  const { employeeId } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("startDate") ?? "";
  const endDate = searchParams.get("endDate") ?? "";

  try {
    // Fetch bills from the external API with a high limit so all bills in the
    // date range are retrieved (matches the pattern used by tickets/bills routes).
    // Using a small limit (e.g. 10) only returns the most recent bills across ALL
    // employees, so the selected employee's bills are usually missing.
    let billsUrl = `${BASE}/business/ticket/bills?limit=1000`;
    if (startDate) billsUrl += `&startDate=${startDate}`;
    if (endDate) billsUrl += `&endDate=${endDate}`;

    const billsRes = await fetch(billsUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!billsRes.ok) {
      return NextResponse.json(
        { error: "Failed to fetch bills" },
        { status: billsRes.status },
      );
    }

    const billsData = await billsRes.json();
    const allBills: BillRecord[] =
      billsData?.data?.bill ?? billsData?.bill ?? billsData?.data ?? [];

    // Filter bills for the selected employee
    const employeeBills = allBills.filter(
      (bill) => bill.generatedById === employeeId,
    );

    // Fetch item details for each bill
    const itemMap = new Map<string, { name: string; quantity: number }>();

    await Promise.all(
      employeeBills.map(async (bill) => {
        try {
          const billRes = await fetch(
            `${BASE}/business/ticket/${bill.invoiceNo}/bill`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            },
          );

          if (!billRes.ok) return;

          const billDetail: BillDetail = await billRes.json();
          const itemWrappers = billDetail?.data?.bill?.items ?? [];

          itemWrappers.forEach((wrapper) => {
            const innerItems = wrapper.item ?? [];
            innerItems.forEach((innerItem) => {
              // ── Previous behaviour, kept for rollback ──────────────────
              // Grouped by the parent product alone, so every variant of a
              // product collapsed into one row and the name was whichever
              // line happened to arrive first.
              //
              // const itemId =
              //   (innerItem.product as string) || innerItem._id || "unknown";
              // const itemName =
              //   (innerItem.productName as string) || "Unknown Item";
              // const quantity = (innerItem.quantity as number) || 0;
              //
              // const existing = itemMap.get(itemId);
              // if (existing) {
              //   existing.quantity += quantity;
              // } else {
              //   itemMap.set(itemId, { name: itemName, quantity });
              // }
              // ──────────────────────────────────────────────────────────

              const variant = Array.isArray(innerItem.variantItems)
                ? innerItem.variantItems[0]
                : innerItem.variantItems;
              const variantId = variant?.variant ?? "";
              const variantName = variant?.name?.trim() ?? "";

              const productId =
                (innerItem.product as string) || innerItem._id || "unknown";
              // One row per variant, not per product: two variants of a
              // product sell separately and are reported separately.
              const itemId = variantId
                ? `${productId}::${variantId}`
                : productId;

              const rawName =
                (innerItem.productName as string) || "Unknown Item";
              // `productName` sometimes already carries the product's option
              // list — "Jelly (s,m,l)" — and sometimes does not, for the same
              // variant. Dropping a trailing bracket and appending the
              // variant's own name gives one spelling either way.
              const itemName = variantName
                ? `${rawName.replace(/\s*\([^)]*\)\s*$/, "").trim() || rawName} [${variantName}]`
                : rawName;

              const quantity = (innerItem.quantity as number) || 0;

              const existing = itemMap.get(itemId);
              if (existing) {
                existing.quantity += quantity;
                // Bills spell the same variant differently ("Red, blue" vs
                // "red, blue"), and details are fetched in parallel, so the
                // first one seen is a race. Keeping the lowest spelling makes
                // the label the same on every load.
                if (itemName.localeCompare(existing.name) < 0) {
                  existing.name = itemName;
                }
              } else {
                itemMap.set(itemId, { name: itemName, quantity });
              }
            });
          });
        } catch {
          // Skip failed bill detail fetches
        }
      }),
    );

    // Convert to array and sort by quantity
    const topItems = Array.from(itemMap.entries())
      .map(([itemId, data]) => ({
        itemId,
        itemName: data.name,
        totalQuantity: data.quantity,
      }))
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .slice(0, 10);

    return NextResponse.json({
      status: "success",
      data: {
        items: topItems,
        totalBillsAnalyzed: employeeBills.length,
      },
    });
  } catch (error) {
    console.error("Error fetching top items:", error);
    return NextResponse.json(
      { error: "Failed to fetch top items data" },
      { status: 500 },
    );
  }
};
