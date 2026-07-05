// ─────────────────────────────────────────────────────────────
// Revenue Flow (Sankey Diagram)
// ─────────────────────────────────────────────────────────────

export interface RevenueFlowNode {
  id: string;
  name: string;
  color: string;
}

export interface RevenueFlowLink {
  source: string;
  target: string;
  value: number;
}

export interface RevenueFlowData {
  grossRevenue: number;
  nodes: RevenueFlowNode[];
  links: RevenueFlowLink[];
}

export const revenueFlowMockData: RevenueFlowData = {
  grossRevenue: 110000,

  nodes: [
    {
      id: "gross",
      name: "Gross Revenue",
      color: "#3B82F6",
    },

    {
      id: "profit",
      name: "Net Profit",
      color: "#10B981",
    },

    {
      id: "cogs",
      name: "COGS",
      color: "#F43F5E",
    },
    {
      id: "labor",
      name: "Labor",
      color: "#F43F5E",
    },
    {
      id: "rent",
      name: "Rent",
      color: "#F43F5E",
    },
    {
      id: "utilities",
      name: "Utilities",
      color: "#F43F5E",
    },
    {
      id: "marketing",
      name: "Marketing",
      color: "#F43F5E",
    },
    {
      id: "supplies",
      name: "Supplies",
      color: "#F43F5E",
    },
    {
      id: "maintenance",
      name: "Maintenance",
      color: "#F43F5E",
    },
    {
      id: "refunds",
      name: "Refunds",
      color: "#F43F5E",
    },
  ],

  links: [
    {
      source: "gross",
      target: "profit",
      value: 68480,
    },
    {
      source: "gross",
      target: "cogs",
      value: 22000,
    },
    {
      source: "gross",
      target: "labor",
      value: 11000,
    },
    {
      source: "gross",
      target: "rent",
      value: 3000,
    },
    {
      source: "gross",
      target: "utilities",
      value: 1500,
    },
    {
      source: "gross",
      target: "marketing",
      value: 2000,
    },
    {
      source: "gross",
      target: "supplies",
      value: 570,
    },
    {
      source: "gross",
      target: "maintenance",
      value: 500,
    },
    {
      source: "gross",
      target: "refunds",
      value: 950,
    },
  ],
};
