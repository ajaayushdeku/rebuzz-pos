import { RawBill } from "./bill";

export type RawReport = {
  totalSales: number;
  totalRevenue: number;
  profit: number;
  paidIn: number;
  paidOut: number;
  cashSale: number;
  onlineSale: number;
  allBills: RawBill[];
  nextCursor: string | null;
};

export type RawReportResponse = {
  status: string;
  data: {
    report: RawReport;
  };
};
