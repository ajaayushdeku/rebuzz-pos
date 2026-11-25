import type { PurchaseHistoryItem } from "./customerDetailHelpers";

export type TopBoughtItem = {
  key: string;
  productId: string;
  productName: string;
  variantId?: string;
  variantName?: string;
  totalQuantity: number;
  totalOrders: number;
  totalSpent: number;
};

export function getTopBoughtItems(
  history: PurchaseHistoryItem[],
): TopBoughtItem[] {
  const itemMap = new Map<string, TopBoughtItem>();
  const orderSets = new Map<string, Set<string>>();

  history
    .filter((purchase) => !purchase.isRefunded)
    .forEach((purchase) => {
      purchase.items?.forEach((item) => {
        if (!item.product) return;

        const variantId = item.variantItems?.variant;
        const key = variantId ? `${item.product}_${variantId}` : item.product;

        if (!itemMap.has(key)) {
          itemMap.set(key, {
            key,
            productId: item.product,
            productName: item.productName,
            variantId,
            variantName: item.variantItems?.name,
            totalQuantity: 0,
            totalOrders: 0,
            totalSpent: 0,
          });

          orderSets.set(key, new Set());
        }

        const existing = itemMap.get(key)!;

        existing.totalQuantity += item.quantity ?? 0;

        // Use the variant-specific price when available.
        const unitPrice = item.variantItems?.unitPrice ?? item.unitPrice;
        existing.totalSpent += unitPrice * (item.quantity ?? 0);

        if (purchase.orderId) {
          orderSets.get(key)!.add(purchase.orderId);
        }
      });
    });

  return Array.from(itemMap.values())
    .map((item) => ({
      ...item,
      totalOrders: orderSets.get(item.key)?.size ?? 0,
    }))
    .sort((a, b) => b.totalQuantity - a.totalQuantity);
}
