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
