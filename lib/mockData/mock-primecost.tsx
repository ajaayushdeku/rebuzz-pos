export interface PrimeCostPoint {
  month: string;
  revenue: number;
  cogs: number;
  labor: number;
}

export const primeCostMock: PrimeCostPoint[] = [
  { month: "Jan", revenue: 182000, cogs: 31000, labor: 12000 },
  { month: "Feb", revenue: 106000, cogs: 33000, labor: 12500 },
  { month: "Mar", revenue: 91000, cogs: 34000, labor: 13000 },
  { month: "Apr", revenue: 90000, cogs: 36000, labor: 14000 },
  { month: "May", revenue: 102000, cogs: 39000, labor: 15000 },
  { month: "Jun", revenue: 108000, cogs: 41000, labor: 15500 },
  { month: "Jul", revenue: 112000, cogs: 42000, labor: 16000 },
  { month: "Aug", revenue: 117000, cogs: 44000, labor: 16500 },
  { month: "Sep", revenue: 121000, cogs: 46000, labor: 17000 },
  { month: "Oct", revenue: 126000, cogs: 47000, labor: 17500 },
  { month: "Nov", revenue: 130000, cogs: 49000, labor: 18000 },
  { month: "Dec", revenue: 135000, cogs: 51000, labor: 18500 },
];
