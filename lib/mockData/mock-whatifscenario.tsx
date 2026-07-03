export interface ScenarioMetrics {
  revenue: number;
  cogs: number;
  labor: number;
  fixedCosts: number;
  orders: number;
}

export interface ScenarioAdjustments {
  priceAdjustment: number; // %
  volumeAdjustment: number; // %
  cogsAdjustment: number; // %
  laborAdjustment: number; // %
}

export const baseScenario: ScenarioMetrics = {
  revenue: 125400,
  cogs: 46200,
  labor: 25600,
  fixedCosts: 18100,
  orders: 2380,
};

export const defaultAdjustments: ScenarioAdjustments = {
  priceAdjustment: 0,
  volumeAdjustment: 0,
  cogsAdjustment: 0,
  laborAdjustment: 0,
};

export const sliderConfig = [
  {
    key: "priceAdjustment",
    label: "Price Adjustment",
    min: -20,
    max: 20,
    step: 1,
    suffix: "%",
    color: "bg-blue-500",
  },
  {
    key: "volumeAdjustment",
    label: "Sales Volume",
    min: -30,
    max: 30,
    step: 1,
    suffix: "%",
    color: "bg-green-500",
  },
  {
    key: "cogsAdjustment",
    label: "COGS",
    min: -30,
    max: 30,
    step: 1,
    suffix: "%",
    color: "bg-orange-500",
  },
  {
    key: "laborAdjustment",
    label: "Labor Cost",
    min: -30,
    max: 30,
    step: 1,
    suffix: "%",
    color: "bg-purple-500",
  },
] as const;
