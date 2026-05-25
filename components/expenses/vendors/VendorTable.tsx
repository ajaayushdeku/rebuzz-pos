import { DataTable } from "@/components/ui/data-table";
import {
  getVendorColumns,
  Vendor,
} from "./vendor-columns";

export default function VendorTable({
  vendor,
}: {
  vendor: Vendor[];
}) {
  const columns = getVendorColumns;
  return (
    <div className="flex-2 min-w-95 bg-white rounded-2xl shadow-md hover:shadow-lg transition duration-300 border border-gray-100 py-8 px-4">
      <h1 className="font-semibold text-xl">
        Vendors
      </h1>
      <p className="text-gray-400">
        Vendors you buy from regularly.
      </p>
      <DataTable
        columns={columns}
        data={vendor}
        searchColumn="name"
        searchPlaceholder="Search Vendor"
      />
    </div>
  );
}
