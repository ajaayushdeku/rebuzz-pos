// ── Input vs Output VAT Trend ─────────────────────────────────────────────

export type VATTrendPoint = {
  month: string;
  inputVAT: number;
  outputVAT: number;
  netPayable: number;
};

export const mockVATTrendData: VATTrendPoint[] = [
  { month: "Bhadra", inputVAT: 46000, outputVAT: 128000, netPayable: 82000 },
  { month: "Ashoj", inputVAT: 45000, outputVAT: 132000, netPayable: 87000 },
  { month: "Kartik", inputVAT: 47000, outputVAT: 136000, netPayable: 89000 },
  { month: "Mangsir", inputVAT: 50000, outputVAT: 142000, netPayable: 92000 },
  { month: "Poush", inputVAT: 44000, outputVAT: 130000, netPayable: 86000 },
  { month: "Magh", inputVAT: 54600, outputVAT: 156000, netPayable: 99450 },
];

// ── Monthly Tax Trend ─────────────────────────────────────────────────────

export type MonthlyTaxPoint = {
  month: string;
  netVAT: number;
  incomeTax: number;
};

export const mockMonthlyTaxData: MonthlyTaxPoint[] = [
  { month: "Bhadra", netVAT: 82000, incomeTax: 12000 },
  { month: "Ashoj", netVAT: 87000, incomeTax: 13500 },
  { month: "Kartik", netVAT: 89000, incomeTax: 14000 },
  { month: "Mangsir", netVAT: 92000, incomeTax: 15000 },
  { month: "Poush", netVAT: 86000, incomeTax: 13000 },
  { month: "Magh", netVAT: 99450, incomeTax: 14500 },
];

// ── What Changed & Why + Taxable vs Exempt ────────────────────────────────

export type VATComparisonData = {
  lastMonth: number;
  thisMonth: number;
  change: number;
  changePct: number;
  reason: string;
  dueDate: string;
  taxableSales: number;
  exemptSales: number;
  totalSales: number;
  taxableRate: number;
};

export const mockVATComparisonData: VATComparisonData = {
  lastMonth: 89445,
  thisMonth: 99450,
  change: 10005,
  changePct: 11.2,
  reason:
    "Higher sales this month (Rs +150k) drove more taxable transactions at 13% VAT, raising your output VAT. Your input VAT rose slightly but not proportionally, widening the net payable gap.",
  dueDate: "25 Falgun 2082",
  taxableSales: 1200000,
  exemptSales: 300000,
  totalSales: 1500000,
  taxableRate: 13,
};

// ── TDS on Rent ───────────────────────────────────────────────────────────

export type TDSOnRentData = {
  monthlyRent: number;
  tdsRate: number;
  tdsAmount: number;
  dueDate: string;
  status: "pending" | "remitted" | "overdue";
};

export const mockTDSOnRentData: TDSOnRentData = {
  monthlyRent: 150000,
  tdsRate: 10,
  tdsAmount: 15000,
  dueDate: "25 Falgun 2082",
  status: "pending",
};

// ── Tax on Refunds ────────────────────────────────────────────────────────

export type TaxOnRefundsData = {
  refundedValue: number;
  taxReversed: number;
  transactions: number;
};

export const mockTaxOnRefundsData: TaxOnRefundsData = {
  refundedValue: 15000,
  taxReversed: -1950,
  transactions: 32,
};

// ── VAT You Haven't Claimed Back ──────────────────────────────────────────

export type VATUnclaimedData = {
  stillRecoverable: number;
  claimed: number;
  eligible: number;
  claimedPct: number;
};

export const mockVATUnclaimedData: VATUnclaimedData = {
  stillRecoverable: 7800,
  claimed: 54600,
  eligible: 62400,
  claimedPct: 88,
};

// ── Purchases With No VAT to Claim ────────────────────────────────────────

export type NoVATPurchasesData = {
  noVATPurchases: number;
  noVATPct: number;
  taxablePurchases: number;
};

export const mockNoVATPurchasesData: NoVATPurchasesData = {
  noVATPurchases: 120000,
  noVATPct: 25,
  taxablePurchases: 360000,
};

// ── VAT-20 Return Summary ─────────────────────────────────────────────────

export type VAT20SummaryData = {
  taxableSales: number;
  exemptSales: number;
  totalOutputVAT: number;
  inputVATPaid: number;
  vatRefundsClaimed: number;
  totalDeductibleVAT: number;
  netVATPayable: number;
  status: "ready" | "draft" | "filed";
};

export const mockVAT20SummaryData: VAT20SummaryData = {
  taxableSales: 1200000,
  exemptSales: 300000,
  totalOutputVAT: 156000,
  inputVATPaid: 54600,
  vatRefundsClaimed: 1950,
  totalDeductibleVAT: 56550,
  netVATPayable: 99450,
  status: "ready",
};

// ── Filing Calendar ───────────────────────────────────────────────────────

export type FilingStatus = "filed" | "pending" | "overdue";

export type FilingEntry = {
  id: string;
  title: string;
  dueDate: string;
  estimatedAmount: number;
  status: FilingStatus;
};

export type FilingCalendarData = {
  upcomingCount: number;
  upcomingMessage: string;
  entries: FilingEntry[];
};

export const mockFilingCalendarData: FilingCalendarData = {
  upcomingCount: 1,
  upcomingMessage:
    "Magh 2082 VAT return is due on 25 Falgun 2082. File before the deadline to avoid a late fee of Rs 1,000 or 0.05% per day.",
  entries: [
    {
      id: "1",
      title: "VAT Return - Poush 2082",
      dueDate: "25 Magh 2082",
      estimatedAmount: 98000,
      status: "filed",
    },
    {
      id: "2",
      title: "VAT Return - Magh 2082",
      dueDate: "25 Falgun 2082",
      estimatedAmount: 99450,
      status: "pending",
    },
    {
      id: "3",
      title: "Advance Income Tax - Chaitra Installment",
      dueDate: "End of Chaitra 2082",
      estimatedAmount: 40000,
      status: "pending",
    },
  ],
};

// ── Tax Reconciliation ────────────────────────────────────────────────────

export type TaxReconciliationData = {
  collected: number;
  vatPaid: number;
  refunds: number;
  remitted: number;
  stillOwed: number;
  isReconciled: boolean;
  reconciliationMessage: string;
};

export const mockTaxReconciliationData: TaxReconciliationData = {
  collected: 156000,
  vatPaid: 54600,
  refunds: 1950,
  remitted: 0,
  stillOwed: 99450,
  isReconciled: true,
  reconciliationMessage:
    "Collected tax matches remittances and current liabilities.",
};

// ── Advance Income Tax Installments ──────────────────────────────────────

export type InstallmentStatus = "paid" | "pending" | "awaiting";

export type AdvanceTaxInstallment = {
  id: string;
  period: string;
  paidSoFarPct: number;
  dueDate: string;
  estimatedAmount: number;
  actualPaid: number | null;
  status: InstallmentStatus;
};

export const mockAdvanceTaxInstallments: AdvanceTaxInstallment[] = [
  {
    id: "1",
    period: "Poush End",
    paidSoFarPct: 40,
    dueDate: "End of Poush",
    estimatedAmount: 40000,
    actualPaid: 40000,
    status: "paid",
  },
  {
    id: "2",
    period: "Chaitra End",
    paidSoFarPct: 70,
    dueDate: "End of Chaitra",
    estimatedAmount: 30000,
    actualPaid: null,
    status: "pending",
  },
  {
    id: "3",
    period: "Ashad End",
    paidSoFarPct: 100,
    dueDate: "End of Ashad",
    estimatedAmount: 30000,
    actualPaid: null,
    status: "awaiting",
  },
];

// ── Income Tax Provision ──────────────────────────────────────────────────

export type IncomeTaxProvisionData = {
  netProfitPreTax: number;
  annualTaxRate: number;
  netProfitAfterTax: number;
  annualProvision: number;
  monthlyAccrual: number;
  note: string;
};

export const mockIncomeTaxProvisionData: IncomeTaxProvisionData = {
  netProfitPreTax: 400000,
  annualTaxRate: 25,
  netProfitAfterTax: 300000,
  annualProvision: 100000,
  monthlyAccrual: 8333,
  note: "Income tax is calculated annually but provisioned monthly. This means Rs 8,333 is the tax cost of this month's profit — your actual payment is made in advance installments or at year-end filing.",
};

// ── TDS Receivable ────────────────────────────────────────────────────────

export type TDSReceivableStatus = "claimable" | "claimed";

export type TDSReceivableEntry = {
  id: string;
  client: string;
  period: string;
  tdsRate: number;
  amount: number;
  status: TDSReceivableStatus;
};

export type TDSReceivableData = {
  totalDeducted: number;
  claimed: number;
  claimable: number;
  entries: TDSReceivableEntry[];
};

export const mockTDSReceivableData: TDSReceivableData = {
  totalDeducted: 28500,
  claimed: 18000,
  claimable: 10500,
  entries: [
    {
      id: "1",
      client: "Client A - Service Fee",
      period: "Magh 2082",
      tdsRate: 15,
      amount: 12000,
      status: "claimable",
    },
    {
      id: "2",
      client: "Client B - Consulting",
      period: "Poush 2082",
      tdsRate: 15,
      amount: 9500,
      status: "claimed",
    },
    {
      id: "3",
      client: "Client C - Rental Income",
      period: "Mangsir 2082",
      tdsRate: 10,
      amount: 7000,
      status: "claimable",
    },
  ],
};

// ── What You Actually Owe ─────────────────────────────────────────────────

export type VATOweStat = {
  label: string;
  value: number;
  changePct: number;
  trend: "up" | "down";
  trendColor: "green" | "red";
};

export type WhatYouOweData = {
  collected: number;
  inputVAT: number;
  refund: number;
  netVATPayable: number;
  dueDate: string;
  stats: VATOweStat[];
};

export const mockWhatYouOweData: WhatYouOweData = {
  collected: 156000,
  inputVAT: 54600,
  refund: 1950,
  netVATPayable: 99450,
  dueDate: "25 Falgun 2082",
  stats: [
    {
      label: "Total Sales",
      value: 1500000,
      changePct: 12.4,
      trend: "up",
      trendColor: "green",
    },
    {
      label: "VAT Collected",
      value: 156000,
      changePct: 8.5,
      trend: "up",
      trendColor: "red",
    },
    {
      label: "VAT Paid on Purchases",
      value: 54600,
      changePct: 2.1,
      trend: "up",
      trendColor: "green",
    },
    {
      label: "Net VAT Payable",
      value: 99450,
      changePct: 11.2,
      trend: "up",
      trendColor: "red",
    },
  ],
};

// ── Tax by Category ───────────────────────────────────────────────────────

export type TaxCategoryEntry = {
  category: string;
  taxCollected: number;
  color: string;
};

export const mockTaxByCategoryData: TaxCategoryEntry[] = [
  { category: "Coffee", taxCollected: 80600, color: "#6366f1" },
  { category: "Food", taxCollected: 40000, color: "#f59e0b" },
  { category: "Retail", taxCollected: 22000, color: "#ec4899" },
  { category: "Beverages", taxCollected: 0, color: "#94a3b8" },
  { category: "Bakery", taxCollected: 39000, color: "#6366f1" },
];

// ── Tax Rate Breakdown ────────────────────────────────────────────────────

export type TaxRateTier = {
  id: string;
  tierLabel: string;
  taxableBase: number;
  taxCollected: number;
  pctOfTotal: number;
  barColor: string;
};

export const mockTaxRateBreakdownData: TaxRateTier[] = [
  {
    id: "standard",
    tierLabel: "Standard Rate (13%)",
    taxableBase: 1200000,
    taxCollected: 156000,
    pctOfTotal: 100,
    barColor: "#6366f1",
  },
  {
    id: "exempt",
    tierLabel: "Exempt / Zero Rate (0%)",
    taxableBase: 300000,
    taxCollected: 0,
    pctOfTotal: 0,
    barColor: "#e5e7eb",
  },
];

// ── Tax Detail / Audit Log ────────────────────────────────────────────────

export type AuditLogStatus = "pending" | "filed" | "overdue";

export type AuditLogEntry = {
  id: string;
  period: string;
  txCode: string;
  taxableBase: number;
  rate: number;
  vatCollected: number;
  vatPaid: number;
  remitted: number;
  stillOwed: number;
  status: AuditLogStatus;
};

export const mockAuditLogData: AuditLogEntry[] = [
  {
    id: "1",
    period: "Magh 2082",
    txCode: "TX-2082-Magh",
    taxableBase: 1500000,
    rate: 13,
    vatCollected: 156000,
    vatPaid: 54600,
    remitted: 0,
    stillOwed: 99450,
    status: "pending",
  },
  {
    id: "2",
    period: "Mangsir 2082",
    txCode: "TX-2082-Mangsir",
    taxableBase: 1550000,
    rate: 13,
    vatCollected: 155000,
    vatPaid: 53000,
    remitted: 102000,
    stillOwed: 0,
    status: "filed",
  },
  {
    id: "3",
    period: "Kartik 2082",
    txCode: "TX-2082-Kartik",
    taxableBase: 1500000,
    rate: 13,
    vatCollected: 150000,
    vatPaid: 50000,
    remitted: 100000,
    stillOwed: 0,
    status: "filed",
  },
  {
    id: "4",
    period: "Poush 2082",
    txCode: "TX-2082-Poush",
    taxableBase: 1480000,
    rate: 13,
    vatCollected: 148000,
    vatPaid: 50000,
    remitted: 98000,
    stillOwed: 0,
    status: "filed",
  },
  {
    id: "5",
    period: "Ashoj 2082",
    txCode: "TX-2082-Ashoj",
    taxableBase: 1450000,
    rate: 13,
    vatCollected: 145000,
    vatPaid: 50000,
    remitted: 95000,
    stillOwed: 0,
    status: "filed",
  },
  {
    id: "6",
    period: "Bhadra 2082",
    txCode: "TX-2082-Bhadra",
    taxableBase: 1400000,
    rate: 13,
    vatCollected: 140000,
    vatPaid: 50000,
    remitted: 90000,
    stillOwed: 0,
    status: "filed",
  },
];
