import type { SalesForecast } from "@/lib/salesForecast";

/**
 * The "What's coming" forecast. `refresh` asks the AI for a new one instead of
 * today's saved forecast, which spends a request on the business's key.
 */
export async function fetchSalesForecast(
  refresh = false,
): Promise<SalesForecast> {
  const res = await fetch(
    refresh ? "/api/sales-forecast?refresh=1" : "/api/sales-forecast",
    { cache: "no-store" },
  );
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json?.data) {
    throw new Error(
      json?.error === "AUTH_REQUIRED"
        ? "Your session has expired — sign in again."
        : "Couldn't load your sales to forecast from.",
    );
  }
  return json.data as SalesForecast;
}
