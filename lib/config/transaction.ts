export type TransactionStatus =
  | "completed"
  | "pending"
  | "failed"
  | "refunded";

export const statusStyles: Record<
  TransactionStatus,
  { cell: string; badge: string }
> = {
  completed: {
    cell: "text-green-800",
    badge: "bg-green-300",
  },
  pending: {
    cell: "text-yellow-800",
    badge: "bg-yellow-200",
  },
  failed: {
    cell: "text-red-800",
    badge: "bg-red-300",
  },
  refunded: {
    cell: "text-gray-800",
    badge: "bg-gray-300",
  },
};

export type PaymentMethod =
  | "Card"
  | "Cash"
  | "Loyalty"
  | "QR";

export const paymentMethods: Record<
  PaymentMethod,
  { cell: string; badge: string }
> = {
  Card: {
    cell: "text-blue-800",
    badge: "bg-blue-200",
  },
  Cash: {
    cell: "text-gray-800",
    badge: "bg-gray-200",
  },
  Loyalty: {
    cell: "text-purple-800",
    badge: "bg-purple-200",
  },
  QR: {
    cell: "text-green-800",
    badge: "text-green-200",
  },
};
