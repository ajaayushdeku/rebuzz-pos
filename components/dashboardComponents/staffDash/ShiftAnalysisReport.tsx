"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDuration } from "@/lib/utils";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrency } from "@/utils/helper";

export type Shift = {
  label: string;
  orders: number;
  avgTime: number;
  revenue: number;
  staff: number;
};

type ShiftAnalysisReportProps = {
  title?: string;
  description?: string;
  shifts: Shift[];
};

export default function ShiftAnalysisReport({
  title = "Shift Analysis Report",
  description = "Performance comparison across morning, afternoon, and evening",
  shifts,
}: ShiftAnalysisReportProps) {
  const { currency } = useCurrency();
  return (
    <div className="border border-gray-100 w-full px-4 md:px-10 py-6 rounded-2xl shadow-md hover:shadow-lg transition duration-300">
      <h1 className="font-bold text-[16px] md:text-xl">{title}</h1>
      <p className="text-sm text-gray-400 mt-0.5">{description}</p>

      <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 mt-3">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Shift</TableHead>
              <TableHead>Orders</TableHead>
              <TableHead>Avg Time</TableHead>
              <TableHead>Revenue</TableHead>
              <TableHead>Staff</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shifts.map((shift) => (
              <TableRow key={shift.label} className="border-b-2">
                <TableCell className="whitespace-nowrap">
                  {shift.label}
                </TableCell>
                <TableCell className="font-bold">{shift.orders}</TableCell>
                <TableCell className="text-gray-600">
                  {shift.avgTime != null ? formatDuration(shift.avgTime) : "—"}
                </TableCell>
                <TableCell className="text-green-600 font-semibold">
                  {formatCurrency(shift.revenue as number, currency)}
                </TableCell>
                <TableCell>{shift.staff}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
