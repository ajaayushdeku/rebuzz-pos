// ── Types ─────────────────────────────────────────────────────────────────

export type TableStatus =
  | "seated"
  | "open"
  | "reserved"
  | "cleaning"
  | "paying";

export type TableShape = "square" | "round" | "rectangle";
export type TableZone = "indoor" | "outdoor";
export type ViewMode = "status" | "covers" | "total" | "time";

export type OrderItem = {
  qty: number;
  name: string;
  status: "served" | "pending" | "preparing";
  price: number;
};

export type LiveTable = {
  id: number;
  label: string;
  zone: TableZone;
  shape: TableShape;
  capacity: number;
  covers: number;
  server: string | null;
  seatedMinutes: number | null;
  bill: number | null;
  status: TableStatus;
  hasAlert?: boolean; // yellow border (attention)
  // Floor Plan position (% of canvas)
  x: number;
  y: number;
  isLarge?: boolean; // Table 10 is a round large table
  orders?: OrderItem[];
};

// ── Mock data ─────────────────────────────────────────────────────────────

export const MOCK_TABLES: LiveTable[] = [
  {
    id: 1,
    label: "1",
    zone: "indoor",
    shape: "square",
    capacity: 2,
    covers: 2,
    server: "Emma",
    seatedMinutes: 45,
    bill: 45.5,
    status: "seated",
    x: 14,
    y: 18,
    orders: [
      { qty: 1, name: "Cold Brew", status: "served", price: 5.0 },
      { qty: 1, name: "Almond Croissant", status: "served", price: 4.5 },
    ],
  },
  {
    id: 2,
    label: "2",
    zone: "indoor",
    shape: "square",
    capacity: 2,
    covers: 0,
    server: null,
    seatedMinutes: null,
    bill: null,
    status: "open",
    x: 32,
    y: 18,
  },
  {
    id: 3,
    label: "3",
    zone: "indoor",
    shape: "square",
    capacity: 2,
    covers: 2,
    server: "Liam",
    seatedMinutes: 76,
    bill: 12.0,
    status: "seated",
    hasAlert: true,
    x: 50,
    y: 18,
    orders: [
      { qty: 1, name: "Cold Brew", status: "served", price: 5.0 },
      { qty: 1, name: "Blueberry Muffin", status: "served", price: 4.5 },
      { qty: 1, name: "Espresso", status: "served", price: 2.5 },
    ],
  },
  {
    id: 4,
    label: "4",
    zone: "indoor",
    shape: "square",
    capacity: 2,
    covers: 0,
    server: null,
    seatedMinutes: null,
    bill: null,
    status: "reserved",
    x: 68,
    y: 18,
  },
  {
    id: 5,
    label: "5",
    zone: "indoor",
    shape: "square",
    capacity: 4,
    covers: 3,
    server: "Emma",
    seatedMinutes: 36,
    bill: 88.0,
    status: "seated",
    x: 84,
    y: 18,
  },
  {
    id: 6,
    label: "6",
    zone: "indoor",
    shape: "square",
    capacity: 4,
    covers: 4,
    server: "Sophia",
    seatedMinutes: 89,
    bill: 110.0,
    status: "seated",
    x: 14,
    y: 48,
  },
  {
    id: 7,
    label: "7",
    zone: "indoor",
    shape: "square",
    capacity: 4,
    covers: 0,
    server: null,
    seatedMinutes: null,
    bill: null,
    status: "cleaning",
    x: 14,
    y: 73,
  },
  {
    id: 8,
    label: "8",
    zone: "indoor",
    shape: "square",
    capacity: 4,
    covers: 2,
    server: "James",
    seatedMinutes: 29,
    bill: 34.0,
    status: "seated",
    x: 40,
    y: 73,
  },
  {
    id: 9,
    label: "9",
    zone: "indoor",
    shape: "square",
    capacity: 4,
    covers: 0,
    server: null,
    seatedMinutes: null,
    bill: null,
    status: "reserved",
    x: 56,
    y: 73,
  },
  {
    id: 10,
    label: "10",
    zone: "indoor",
    shape: "round",
    capacity: 8,
    covers: 6,
    server: "James",
    seatedMinutes: 52,
    bill: 240.0,
    status: "seated",
    hasAlert: true,
    isLarge: true,
    x: 50,
    y: 52,
    orders: [],
  },
  {
    id: 11,
    label: "11",
    zone: "indoor",
    shape: "square",
    capacity: 6,
    covers: 5,
    server: "James",
    seatedMinutes: 44,
    bill: 85.0,
    status: "seated",
    x: 84,
    y: 48,
  },
  {
    id: 12,
    label: "12",
    zone: "indoor",
    shape: "square",
    capacity: 4,
    covers: 0,
    server: null,
    seatedMinutes: null,
    bill: null,
    status: "open",
    x: 84,
    y: 73,
  },
  // Outdoor tables
  {
    id: 13,
    label: "O1",
    zone: "outdoor",
    shape: "square",
    capacity: 4,
    covers: 2,
    server: "Aisha",
    seatedMinutes: 20,
    bill: 32.0,
    status: "seated",
    x: 20,
    y: 25,
  },
  {
    id: 14,
    label: "O2",
    zone: "outdoor",
    shape: "square",
    capacity: 2,
    covers: 0,
    server: null,
    seatedMinutes: null,
    bill: null,
    status: "open",
    x: 50,
    y: 25,
  },
  {
    id: 15,
    label: "O3",
    zone: "outdoor",
    shape: "round",
    capacity: 6,
    covers: 0,
    server: null,
    seatedMinutes: null,
    bill: null,
    status: "reserved",
    isLarge: true,
    x: 75,
    y: 50,
  },
  {
    id: 16,
    label: "O4",
    zone: "outdoor",
    shape: "square",
    capacity: 4,
    covers: 0,
    server: null,
    seatedMinutes: null,
    bill: null,
    status: "cleaning",
    x: 30,
    y: 65,
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────

export function fmtMinutes(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function getStatusColor(status: TableStatus): string {
  switch (status) {
    case "seated":
      return "#3b82f6"; // blue
    case "open":
      return "#22c55e"; // green
    case "reserved":
      return "#f59e0b"; // amber
    case "cleaning":
      return "#ef4444"; // red
    case "paying":
      return "#8b5cf6"; // purple
  }
}

export function getStatusBorderColor(status: TableStatus): string {
  switch (status) {
    case "seated":
      return "border-blue-500";
    case "open":
      return "border-green-500";
    case "reserved":
      return "border-amber-500";
    case "cleaning":
      return "border-red-500";
    case "paying":
      return "border-purple-500";
  }
}

export function getStatusBg(status: TableStatus): string {
  switch (status) {
    case "seated":
      return "bg-blue-600/10";
    case "open":
      return "bg-green-600/10";
    case "reserved":
      return "bg-amber-600/10";
    case "cleaning":
      return "bg-red-600/10";
    case "paying":
      return "bg-purple-600/10";
  }
}

export function getStatusLabel(status: TableStatus): string {
  switch (status) {
    case "seated":
      return "SEATED";
    case "open":
      return "OPEN";
    case "reserved":
      return "RESERVED";
    case "cleaning":
      return "CLEANING";
    case "paying":
      return "PAYING";
  }
}
