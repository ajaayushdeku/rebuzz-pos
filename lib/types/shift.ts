export type ShiftStats = {
  shiftId: string;
  employeeName: string;
  openingTime: string;
  closingTime: string;
  openingCash: number;
  payIn: number;
  payOut: number;
  totalSale: number;
  expectedAmount: number;
  cashSale: number;
  onlineSale: number;
  drawerAmount: number;
  billImages: string[];
};

export type BillImage = {
  _id: string;
  imagePath: string;
};

export type Transaction = {
  _id?: string;
  transactionType: "pay-in" | "pay-out" | "sale";
  transactionAmount: string | number;
  note?: string;
  transactionTime: string;
  paymentMethod?: string;
  billImages?: BillImage[];
};
