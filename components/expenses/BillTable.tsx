"use client";

import { useEffect, useState } from "react";
import { useCurrency } from "@/providers/CurrencyContext";
import { DataTable } from "../ui/data-table";
import { getBillColumns } from "./bill-columns";
import { BillView } from "@/lib/types/expenses";
import { fetchExpenseHistory } from "@/services/apiShift.client";
import { RefreshCw } from "lucide-react";

export default function BillTable() {
  const { currency } = useCurrency();
  const columns = getBillColumns(currency);
  const [bills, setBills] = useState<BillView[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExpenseHistory()
      .then(setBills)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-gray-400 text-sm">
        <RefreshCw size={16} className="animate-spin mr-2" />
        Loading history...
      </div>
    );
  }

  return (
    <div>
      <DataTable
        columns={columns}
        data={bills}
        searchColumn="comment"
        searchPlaceholder="Search notes..."
        showDateFilter={true}
        pageSize={10}
      />
    </div>
  );
}
