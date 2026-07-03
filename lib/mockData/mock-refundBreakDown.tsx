export interface RefundReason {
  id: string;
  reason: string;
  refunds: number;
  amount: number;
  color: string;
}

export const refundBreakdownMock: RefundReason[] = [
  {
    id: "wrong-order",
    reason: "Wrong Order",
    refunds: 12,
    amount: 540,
    color: "#ff6b6b",
  },
  {
    id: "quality",
    reason: "Quality Issue",
    refunds: 8,
    amount: 360,
    color: "#ff922b",
  },
  {
    id: "out-of-stock",
    reason: "Out of Stock",
    refunds: 5,
    amount: 250,
    color: "#fcc419",
  },
  {
    id: "changed-mind",
    reason: "Changed Mind",
    refunds: 3,
    amount: 150,
    color: "#94d82d",
  },
  {
    id: "other",
    reason: "Other",
    refunds: 4,
    amount: 150,
    color: "#94a3b8",
  },
];

export const totalRefundLoss = refundBreakdownMock.reduce(
  (sum, item) => sum + item.amount,
  0,
);
