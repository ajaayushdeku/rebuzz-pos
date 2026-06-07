import { ProductData } from "@/components/dashboardComponents/salesRevenue/RevenueVsProfitChart";
import { SalesTrendsData } from "@/components/dashboardComponents/salesRevenue/SalesTrendChart";
import { SlowProduct } from "@/components/dashboardComponents/salesRevenue/slow-product-columns";
import { TopProduct } from "@/components/dashboardComponents/salesRevenue/top-product-columns";

export const mockRevenueVsProfit: ProductData[] = [
  {
    product: "Espresso",
    revenue: 12800,
    profit: 8200,
  },
  {
    product: "Latte",
    revenue: 18200,
    profit: 13200,
  },
  {
    product: "Cappuccino",
    revenue: 15000,
    profit: 9800,
  },
  {
    product: "Cold Brew",
    revenue: 9200,
    profit: 7200,
  },
  {
    product: "Pastries",
    revenue: 14000,
    profit: 5200,
  },
  {
    product: "Sandwiches",
    revenue: 10200,
    profit: 4800,
  },
];

export const mockSlowProducts: SlowProduct[] = [
  {
    name: "Cappuccino",
    days: 6,
    stockAmount: 14,
  },
  {
    name: "Espresso",
    days: 4,
    stockAmount: 8,
  },
  {
    name: "Americano",
    days: 7,
    stockAmount: 12,
  },
  {
    name: "Latte",
    days: 5,
    stockAmount: 11,
  },
  {
    name: "Mocha",
    days: 3,
    stockAmount: 7,
  },
  {
    name: "Flat White",
    days: 4,
    stockAmount: 9,
  },
  {
    name: "Caramel Latte",
    days: 6,
    stockAmount: 10,
  },
  {
    name: "Vanilla Latte",
    days: 5,
    stockAmount: 13,
  },
  {
    name: "Cold Brew",
    days: 2,
    stockAmount: 6,
  },
  {
    name: "Iced Coffee",
    days: 3,
    stockAmount: 8,
  },
  {
    name: "Hazelnut Coffee",
    days: 7,
    stockAmount: 15,
  },
  {
    name: "Macchiato",
    days: 4,
    stockAmount: 9,
  },
  {
    name: "Masala Tea",
    days: 2,
    stockAmount: 1,
  },
];

export const mockTopProducts: TopProduct[] = [
  {
    name: "Espresso",
    category: "Coffee",
    revenue: 750,
    percent: 8,
    count: 120,
    netProfit: 450,
  },
  {
    name: "Cappuccino",
    category: "Coffee",
    revenue: 680,
    percent: 6,
    count: 98,
    netProfit: 380,
  },
  {
    name: "Mocha",
    category: "Coffee",
    revenue: 540,
    percent: -2,
    count: 72,
    netProfit: 280,
  },
  {
    name: "Americano",
    category: "Coffee",
    revenue: 420,
    percent: 3,
    count: 65,
    netProfit: 210,
  },
  {
    name: "Flat White",
    category: "Coffee",
    revenue: 390,
    percent: 4,
    count: 58,
    netProfit: 195,
  },
  {
    name: "Caramel Latte",
    category: "Coffee",
    revenue: 610,
    percent: 7,
    count: 88,
    netProfit: 340,
  },
  {
    name: "Iced Coffee",
    category: "Coffee",
    revenue: 470,
    percent: -1,
    count: 70,
    netProfit: 235,
  },
  {
    name: "Cold Brew",
    category: "Coffee",
    revenue: 520,
    percent: 9,
    count: 80,
    netProfit: 290,
  },
  {
    name: "Macchiato",
    category: "Coffee",
    revenue: 350,
    percent: 2,
    count: 50,
    netProfit: 175,
  },
  {
    name: "Vanilla Latte",
    category: "Coffee",
    revenue: 580,
    percent: 5,
    count: 85,
    netProfit: 320,
  },
  {
    name: "Hazelnut Coffee",
    category: "Coffee",
    revenue: 410,
    percent: -3,
    count: 60,
    netProfit: 205,
  },
  {
    name: "Irish Coffee",
    category: "Coffee",
    revenue: 300,
    percent: 2,
    count: 42,
    netProfit: 150,
  },
];
export const mockSalesTrendData = {
  daily: [
    { label: "Mon", revenue: 4200 },
    { label: "Tue", revenue: 3800 },
    { label: "Wed", revenue: 5200 },
    { label: "Thu", revenue: 4700 },
    { label: "Fri", revenue: 6200 },
    { label: "Sat", revenue: 7800 },
    { label: "Sun", revenue: 5400 },
  ],
  weekly: [
    { label: "Wk 1", revenue: 28000 },
    { label: "Wk 2", revenue: 31500 },
    { label: "Wk 3", revenue: 26800 },
    { label: "Wk 4", revenue: 36200 },
  ],
  monthly: [
    { label: "Jan", revenue: 98000 },
    { label: "Feb", revenue: 112000 },
    { label: "Mar", revenue: 104000 },
    { label: "Apr", revenue: 119000 },
    { label: "May", revenue: 131000 },
    { label: "Jun", revenue: 124000 },
  ],
};
