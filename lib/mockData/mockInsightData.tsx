// ============================================================================
// Time-Wise Product Analysis
// ============================================================================

export type TimePeriod = "morning" | "lunch" | "afternoon" | "evening";

export type TimeWiseProduct = {
  period: TimePeriod;
  title: string;
  productName: string;
  unitsSold: number;
  revenue: number;
};

export const mockTimeWiseProductData: TimeWiseProduct[] = [
  {
    period: "morning",
    title: "MORNING (6AM-11AM)",
    productName: "Classic Latte",
    unitsSold: 120,
    revenue: 600,
  },
  {
    period: "lunch",
    title: "LUNCH (11AM-2PM)",
    productName: "Avocado Toast",
    unitsSold: 85,
    revenue: 680,
  },
  {
    period: "afternoon",
    title: "AFTERNOON (2PM-5PM)",
    productName: "Iced Caramel Macchiato",
    unitsSold: 95,
    revenue: 570,
  },
  {
    period: "evening",
    title: "EVENING (5PM-9PM)",
    productName: "Matcha Cake",
    unitsSold: 40,
    revenue: 320,
  },
];

// ============================================================================
// Campaign Analysis
// ============================================================================

export type CampaignPoint = {
  label: string;
  revenue: number;
};

export type CampaignAnalysisData = {
  campaignGrowth: number;
  data: CampaignPoint[];
};

export const mockCampaignAnalysis: CampaignAnalysisData = {
  campaignGrowth: 33,

  data: [
    {
      label: "Week -2 (Pre)",
      revenue: 43000,
    },
    {
      label: "Week -1 (Pre)",
      revenue: 45000,
    },
    {
      label: "Campaign Wk 1",
      revenue: 61000,
    },
    {
      label: "Campaign Wk 2",
      revenue: 68000,
    },
    {
      label: "Week +1 (Post)",
      revenue: 54000,
    },
    {
      label: "Week +2 (Post)",
      revenue: 51000,
    },
  ],
};

// ============================================================================
// Price Change Impact
// ============================================================================

export type PriceChangeImpactItem = {
  id: string;
  productName: string;
  updatedDate: string;

  oldPrice: number;
  newPrice: number;

  weeklyRevenueImpact: number;

  volumeChangePercent: number;

  trend: number[];
};

export const mockPriceChangeImpact: PriceChangeImpactItem[] = [
  {
    id: "1",

    productName: "Classic Latte",

    updatedDate: "Feb 1",

    oldPrice: 4.5,
    newPrice: 4.8,

    weeklyRevenueImpact: 240,

    volumeChangePercent: -2,

    trend: [80, 75, 70, 72, 74, 76],
  },

  {
    id: "2",

    productName: "Avocado Toast",

    updatedDate: "Jan 15",

    oldPrice: 7.5,
    newPrice: 8.5,

    weeklyRevenueImpact: -15,

    volumeChangePercent: -12,

    trend: [90, 84, 70, 65, 64, 66],
  },

  {
    id: "3",

    productName: "Cold Brew",

    updatedDate: "Feb 10",

    oldPrice: 4,
    newPrice: 4.5,

    weeklyRevenueImpact: 180,

    volumeChangePercent: 12,

    trend: [50, 56, 62, 70, 73, 75],
  },
];
