import type {
  LiveTable,
  TableStatus,
  TableZone,
} from "@/lib/mockData/mock-live-tables";

// ── Raw GET /api/tables response shape ────────────────────────────────────
export type RawApiTable = {
  _id: string;
  adminId: string;
  name: string;
  seats: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  __v: number;
  status: "free" | "occupied";
  currentTicket: { _id: string; invoice: number } | null;
};

/** Parse the trailing number from a table name ("Table 12" → 12). */
function parseTableNumber(name: string, fallback: number): number {
  const m = name.match(/(\d+)\s*$/);
  return m ? parseInt(m[1], 10) : fallback;
}

/** Keywords in a table's notes that mark it as an outdoor table. */
const OUTDOOR_HINT =
  /outdoor|outside|out-door|patio|terrace|balcony|rooftop|roof top|garden|veranda|verandah|courtyard|al ?fresco|open[-\s]?air|lawn|deck/i;

/**
 * Map one API table to the richer presentation shape the UI renders.
 *
 * The API only returns name/seats/notes/status/currentTicket, so the
 * presentation-only fields (covers, bill, server, seated time, floor position…)
 * are derived or defaulted here:
 *  - status: "occupied" → "seated", "free" → "open"
 *  - zone: outdoor when notes match an outdoor keyword (see OUTDOOR_HINT),
 *          otherwise indoor
 *  - covers: full seats when occupied, else 0 (the API has no live cover count)
 *  - x/y: assigned in a second pass by {@link assignFloorPositions}
 */
function mapOne(raw: RawApiTable, index: number): LiveTable {
  const occupied = raw.status === "occupied";
  const zone: TableZone = OUTDOOR_HINT.test(raw.notes ?? "")
    ? "outdoor"
    : "indoor";
  const status: TableStatus = occupied ? "seated" : "open";
  const id = parseTableNumber(raw.name, index + 1);

  return {
    // ── API fields (passed through verbatim) ──
    _id: raw._id,
    adminId: raw.adminId,
    name: raw.name,
    seats: raw.seats,
    notes: raw.notes,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    __v: raw.__v,
    currentTicket: raw.currentTicket,

    // ── Derived / defaulted presentation fields ──
    id,
    label: String(id),
    zone,
    // Shape by seat count: ≤4 square, 5–8 rectangle, >8 round.
    shape: raw.seats > 8 ? "round" : raw.seats > 4 ? "rectangle" : "square",
    capacity: raw.seats,
    covers: occupied ? raw.seats : 0,
    server: null,
    seatedMinutes: null,
    bill: null,
    status,
    x: 50,
    y: 50,
    isLarge: raw.seats > 8,
    orders: [],
  };
}

/** Spread each zone's tables across the floor canvas in a simple grid. */
function assignFloorPositions(tables: LiveTable[]): void {
  for (const zone of ["indoor", "outdoor"] as TableZone[]) {
    const group = tables.filter((t) => t.zone === zone);
    const perRow = Math.min(4, Math.max(1, Math.ceil(Math.sqrt(group.length))));
    const rows = Math.max(1, Math.ceil(group.length / perRow));
    group.forEach((t, i) => {
      const col = i % perRow;
      const row = Math.floor(i / perRow);
      t.x = perRow === 1 ? 50 : Math.round(14 + col * (72 / (perRow - 1)));
      t.y = rows === 1 ? 50 : Math.round(16 + row * (68 / (rows - 1)));
    });
  }
}

/** Convert the raw API list to the UI's LiveTable[] (with floor positions). */
export function mapApiTablesToLiveTables(raw: RawApiTable[]): LiveTable[] {
  const mapped = raw.map(mapOne);
  assignFloorPositions(mapped);
  return mapped;
}

/** Fetch tables from the proxied GET /api/tables endpoint. */
export async function fetchLiveTables(): Promise<LiveTable[]> {
  const res = await fetch("/api/tables");
  if (!res.ok) throw new Error(`Failed to fetch tables: ${res.status}`);
  const json = await res.json();
  const raw: RawApiTable[] = json?.data?.tables ?? [];
  return mapApiTablesToLiveTables(raw);
}

type RawSalesBill = {
  table?: string | { _id?: string } | null;
  grandTotal?: number;
  isRefunded?: boolean;
};

/**
 * Live table sales = sum of today's bills that were placed against a table.
 * Fetches only the current day and keeps bills that carry a `table` reference
 * (dine-in), ignoring refunded ones.
 */
export async function fetchTodaysTableSales(): Promise<number> {
  const today = new Date().toISOString().split("T")[0];
  const res = await fetch(
    `/api/tickets/bills?startDate=${today}&endDate=${today}&limit=500`,
  );
  if (!res.ok) throw new Error(`Failed to fetch bills: ${res.status}`);
  const json = await res.json();
  const bills: RawSalesBill[] = json?.data?.bill ?? [];
  return bills
    .filter((b) => b.table != null && !b.isRefunded)
    .reduce((sum, b) => sum + (b.grandTotal ?? 0), 0);
}
