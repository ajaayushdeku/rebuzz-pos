/**
 * Refund reasons, darkest first.
 *
 * One rose ramp rather than a rainbow: every slice here is money lost, so
 * they are the same kind of thing at different sizes, and the shade tracks
 * the size. Red through green read as a scale from bad to good, which is the
 * wrong story for a card where every slice is bad.
 *
 * "Other" is the exception, in neutral grey: it is not a reason, it is the
 * absence of one.
 */
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
    color: "#e11d48",
  },
  {
    id: "quality",
    reason: "Quality Issue",
    refunds: 8,
    amount: 360,
    color: "#f43f5e",
  },
  {
    id: "out-of-stock",
    reason: "Out of Stock",
    refunds: 5,
    amount: 250,
    color: "#fb7185",
  },
  {
    id: "changed-mind",
    reason: "Changed Mind",
    refunds: 3,
    amount: 150,
    color: "#fda4af",
  },
  {
    id: "other",
    reason: "Other",
    refunds: 4,
    amount: 150,
    color: "#cbd5e1",
  },
];

export const totalRefundLoss = refundBreakdownMock.reduce(
  (sum, item) => sum + item.amount,
  0,
);
