import {
  TaxableVsNonTaxableWrapper,
  TaxStatsWrapper,
  HighestTaxGeneratedWrapper,
  TaxByCategoryWrapper,
  TaxOnRefundedBillsWrapper,
} from "@/components/componentWrappers/TaxAnalyticsWrappers";

export default function TaxAnalyticsPage() {
  return (
    <div className="px-6 py-8 md:px-10">
      <div className="w-full mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">
              Tax Analytics (Still in Production)
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              Overview of tax collected, refunded, and categorized
            </p>
          </div>
        </div>

        {/* Taxable vs Non-Taxable - full width */}
        <TaxableVsNonTaxableWrapper />

        {/* Tax Stats - full width */}
        <TaxStatsWrapper />

        {/* Grid for remaining cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Highest Tax Generated */}
          <HighestTaxGeneratedWrapper />

          {/* Tax by Category */}
          <TaxByCategoryWrapper />
        </div>

        {/* Tax on Refunded Bills - full width */}
        <TaxOnRefundedBillsWrapper />
      </div>
    </div>
  );
}
