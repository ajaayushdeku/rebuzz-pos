import Transactions from "@/components/dashboardComponents/orderHistory/Transactions";
import SampleDataBadge from "@/components/ui/sampledatabadge";
import { mockTransactions } from "@/lib/mockData/mock-transactions";
import { getTransactions } from "@/services/dashboardServices/apiTransactionServer";

export default async function Page() {
  const [transactions] = await Promise.all([getTransactions()]);
  const isEmpty = !transactions || transactions.length === 0;
  const displayData = isEmpty ? mockTransactions : transactions;
  return (
    <div className="min-h-screen bg-50 px-6 py-8 md:px-10">
      {/* ── Header ── */}
      <div className="max-w-7xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        {isEmpty && <SampleDataBadge />}

        <div>
          <h1 className="font-bold text-xl md:text-2xl truncate">
            Order History
          </h1>

          <p className="text-sm text-gray-500 mt-0.5">
            Browse and search all transactions
          </p>
        </div>
      </div>

      {isEmpty ? (
        <Transactions transactions={displayData} />
      ) : (
        <Transactions transactions={transactions} />
      )}
    </div>
  );
}
