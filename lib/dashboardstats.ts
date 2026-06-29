import {
  CUSTOMER_STAT_CONFIG,
  EXPENSE_STAT_CONFIG,
  GROWTH_STAT_CONFIG,
  PROFIT_COST_STAT_CONFIG,
  STATS_CONFIG,
  WINNING_STAT_CONFIG,
} from "./config/dashboard";

// For dashboard overview stats
export interface Stat {
  value: number;
  percent: number;
}

export type StatKey = (typeof STATS_CONFIG)[number]["key"];

export type StatsApiResponse = Record<StatKey, Stat>;

// For winning stats
export interface WinningStat {
  value: string;
  // Optional computed footer; overrides the static footer in WINNING_STAT_CONFIG.
  footer?: string;
}

export type WinningStatKey = (typeof WINNING_STAT_CONFIG)[number]["key"];

export type WinningApiResponse = Record<WinningStatKey, WinningStat>;

// For customer stats
export interface CustomerStat {
  value: number;
}

export type CustomerStatKey = (typeof CUSTOMER_STAT_CONFIG)[number]["key"];

export type CustomerApiResponse = Record<CustomerStatKey, CustomerStat>;

// For profit cost stats
export interface ProfitCostStat {
  value: number;
}

export type ProfitCostStatKey = (typeof PROFIT_COST_STAT_CONFIG)[number]["key"];

export type ProfitCostApiResponse = Record<ProfitCostStatKey, ProfitCostStat>;

// For expense stats
export interface ExpenseStat {
  value: number;
}

export type ExpenseStatKey = (typeof EXPENSE_STAT_CONFIG)[number]["key"];

export type ExpenseApiResponse = Record<ExpenseStatKey, ExpenseStat>;

// For growth stats
export interface GrowthStat {
  value: number;
  prev: number;
  percent: number;
}

export type GrowthStatKey = (typeof GROWTH_STAT_CONFIG)[number]["key"];

export type GrowthStatsApiResponse = Record<GrowthStatKey, GrowthStat>;
