import { mockVendorData } from "@/components/expenses/vendors/mock-vendor-data";
import { Vendor } from "@/components/expenses/vendors/vendor-columns";

export async function fetchVendors(): Promise<Vendor[]> {
  return mockVendorData;
}
