"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { LayoutGrid, Map, Loader2, Utensils, Plus } from "lucide-react";

import type { LiveTable } from "@/lib/mockData/mock-live-tables";
import { useLiveTables, useTableLiveSales } from "@/hooks/useLiveTables";
import { LIVE_TABLES_KEY } from "@/hooks/useLiveTables";
import LiveStatBar from "@/components/dashboardComponents/liveTables/LiveStatBar";
import FloorPlanView from "@/components/dashboardComponents/liveTables/FloorPlanVIew";
import GridView from "@/components/dashboardComponents/liveTables/GridView";
import TableDetail from "@/components/dashboardComponents/liveTables/TableDetail";
import AddTableModal from "@/components/dashboardComponents/liveTables/AddTableModal";

type Tab = "floor" | "grid";

export default function LiveTablesPage() {
  const [tab, setTab] = useState<Tab>("grid");
  const [selectedTable, setSelectedTable] = useState<LiveTable | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<LiveTable | null>(null);

  const queryClient = useQueryClient();
  const { data: tables = [], isLoading, isError } = useLiveTables();
  const { data: liveSales = 0 } = useTableLiveSales();

  const handleTableCreated = () => {
    queryClient.invalidateQueries({ queryKey: LIVE_TABLES_KEY });
  };

  const handleEditTable = (table: LiveTable) => {
    setEditingTable(table);
    setAddModalOpen(true);
  };

  const indoorTables = tables.filter((t) => t.zone === "indoor");
  const outdoorTables = tables.filter((t) => t.zone === "outdoor");
  const openTables = tables.filter((t) => t.status === "open").length;
  const occupancyPct = indoorTables.length
    ? Math.round(
        (indoorTables.filter(
          (t) => t.status === "seated" || t.status === "paying",
        ).length /
          indoorTables.length) *
          100,
      )
    : 0;

  return (
    <div className="min-h-screen bg-50 px-6 py-8 md:px-10">
      <div className="w-full mx-auto flex flex-col gap-6">
        {/* ── Page header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-200">
          <div>
            <h1 className="font-bold text-xl md:text-2xl truncate">
              Live Tables
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Manage your restaurant floor plan and monitor seating in
              real-time.
            </p>
          </div>
        </div>

        {/* ── Main panel ── */}
        <div className="flex flex-col gap-4">
          {/* View toggle */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 w-fit">
            {[
              { id: "grid", label: "Grid View", icon: LayoutGrid },
              { id: "floor", label: "Floor Plan", icon: Map },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id as Tab)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold border-[1.5px] transition-all ${
                  tab === id
                    ? "bg-white text-gray-900 shadow-sm"
                    : "border-transparent text-gray-700 hover:text-gray-800"
                }`}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 flex flex-col items-center justify-center gap-3 text-gray-400">
              <Loader2 className="h-6 w-6 animate-spin" />
              <p className="text-sm">Loading tables…</p>
            </div>
          ) : isError ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 flex flex-col items-center justify-center gap-1.5 text-center">
              <p className="text-sm font-medium text-red-500">
                Failed to load tables
              </p>
              <p className="text-xs text-gray-400">
                Please check your connection and try again.
              </p>
            </div>
          ) : tables.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 flex flex-col items-center justify-center gap-3 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center">
                <Utensils className="h-6 w-6 text-gray-300" />
              </div>
              <p className="text-sm font-medium text-gray-600">No tables yet</p>
              <p className="text-xs text-gray-400">
                Tables you add will appear here.
              </p>
            </div>
          ) : (
            <>
              {/* ── Stat bar (floor plan only) ── */}
              {tab === "floor" && (
                <LiveStatBar
                  occupancyPct={occupancyPct}
                  openTables={openTables}
                  liveSales={liveSales}
                />
              )}

              {/* ── Views ── */}
              {tab === "floor" ? (
                <FloorPlanView
                  indoorTables={indoorTables}
                  outdoorTables={outdoorTables}
                  selectedTableId={selectedTable?.id ?? null}
                  onSelectTable={setSelectedTable}
                />
              ) : (
                <GridView
                  tables={tables}
                  selectedTableId={selectedTable?.id ?? null}
                  onSelectTable={setSelectedTable}
                  onEditTable={handleEditTable}
                  onTableDeleted={handleTableCreated}
                  onTableChanged={handleTableCreated}
                />
              )}

              {/* ── Table detail ── */}
              {selectedTable && <TableDetail table={selectedTable} />}
            </>
          )}
        </div>
      </div>

      {/* ── Add Table (fixed bottom-right) ── */}
      <button
        type="button"
        onClick={() => {
          setEditingTable(null);
          setAddModalOpen(true);
        }}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-5 py-3 rounded-full bg-blue-600 text-white text-sm font-semibold shadow-lg shadow-blue-600/30 hover:bg-blue-700 hover:shadow-blue-700/30 transition-all"
      >
        <Plus size={18} />
        Add Table
      </button>

      <AddTableModal
        key={editingTable?._id ?? "new"}
        open={addModalOpen}
        onClose={() => {
          setAddModalOpen(false);
          setEditingTable(null);
        }}
        onCreated={handleTableCreated}
        editingTable={editingTable}
      />
    </div>
  );
}
