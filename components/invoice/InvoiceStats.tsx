import { RefreshCw } from "lucide-react";

// import AlertCard from "./AlertCard";
import { InvoiceStatsProps } from "@/lib/types/invoice";
import { useInvoiceStore } from "@/stores/invoiceStore";

export default function InvoiceStats({ invoices }: InvoiceStatsProps) {
  const getFilteredInvoices = useInvoiceStore(
    (state) => state.getFilteredInvoices,
  );
  const filteredInvoices = getFilteredInvoices();

  const isToday = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const todayInvoices = invoices.filter((invoice) =>
    isToday(invoice.created_at),
  );

  const totalSalesAmount = todayInvoices.reduce(
    (sum: number, invoice) => sum + invoice.amount,
    0,
  );
  const numberOfSales = todayInvoices.length;

  return (
    <div className="bg-white rounded-lg border shadow-sm p-6 mb-8">
      <div className="grid grid-cols-4 gap-8 mb-6">
        {/* Overdue */}
        <div>
          <p className="text-sm  text-gray-600 mb-1">Today&#39;s Sales</p>
          <p className="md:text-3xl text-xl font-semibold text-gray-900">
            ${totalSalesAmount}
            <span className="md:text-base text-[12px]  font-normal text-gray-500 ml-1">
              USD
            </span>
          </p>
        </div>

        {/* Due within next 30 days */}
        <div>
          <p className="text-sm text-gray-600 mb-1">Cash in hand</p>
          <p className="md:text-3xl text-xl font-semibold text-gray-900">
            $0.00
            <span className="md:text-base text-[12px]  font-normal text-gray-500 ml-1">
              USD
            </span>
          </p>
        </div>

        {/* Average time to get paid */}
        <div>
          <p className="text-sm text-gray-600 mb-1">Order count</p>
          <p className="md:text-3xl text-xl font-semibold text-gray-900">
            {numberOfSales}
            <span className="md:text-base text-[12px] font-normal text-gray-500 ml-1">
              {/* {count > 1 ? "orders" : "order"} */}
              orders
            </span>
          </p>
        </div>

        {/* Upcoming payout */}
        <div>
          <p className="text-sm text-gray-600 mb-1">Upcoming payout</p>
          <p className="md:text-3xl text-xl font-semibold text-gray-900 underline decoration-dotted underline-offset-4">
            None
          </p>
        </div>
      </div>

      {/* Last updated & Payment banner */}
      <div className="flex items-center justify-between pt-4 border-t">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>Last updated 3 minutes ago.</span>
          <button className="text-blue-600 hover:text-blue-700">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        {/* <AlertCard />  Removed for now*/}
      </div>
    </div>
  );
}
