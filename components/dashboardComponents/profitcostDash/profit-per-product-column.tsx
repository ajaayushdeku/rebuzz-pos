export type Product = {
  name: string;
  revenue: number;
  cogs: number;
  /**
   * Tax charged on this product's sales, or null when the sales report does
   * not carry it. Null rather than zero: a blank cell says "not recorded",
   * where a zero would claim the product was sold tax free.
   */
  tax: number | null;
  profit: number;
  margin: number;
};
