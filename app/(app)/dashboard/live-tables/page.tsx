"use client";

import { Suspense, useState } from "react";
import dynamic from "next/dynamic";
import { useQueryClient } from "@tanstack/react-query";
import { LayoutGrid, Map, Utensils, Armchair } from "lucide-react";

import type { LiveTable } from "@/lib/mockData/mock-live-tables";
import { useLiveTables, useTableLiveSales } from "@/hooks/useLiveTables";
import { LIVE_TABLES_KEY } from "@/hooks/useLiveTables";
import LiveStatBar from "@/components/dashboardComponents/liveTables/LiveStatBar";
import TableTicketCards from "@/components/dashboardComponents/liveTables/TableTicketCards";
import HeaderActionButton from "@/components/ui/HeaderActionButton";
import {
  FloorPlanSkeleton,
  GridViewSkeleton,
  LiveTablesSkeleton,
} from "@/components/dashboardComponents/liveTables/LiveTablesSkeletons";

const FloorPlanView = dynamic(
  () => import("@/components/dashboardComponents/liveTables/FloorPlanVIew"),
);
const GridView = dynamic(
  () => import("@/components/dashboardComponents/liveTables/GridView"),
);
const TableDetail = dynamic(
  () => import("@/components/dashboardComponents/liveTables/TableDetail"),
);
const AddTableModal = dynamic(
  () => import("@/components/dashboardComponents/liveTables/AddTableModal"),
);

type Tab = "floor" | "grid";

export default function LiveTablesPage() {
  const [tab, setTab] = useState<Tab>("grid");
  const [selectedTable, setSelectedTable] = useState<LiveTable | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);

  const [detailTable, setDetailTable] = useState<LiveTable | null>(null);
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
  const openTables = tables.filter((t) => t.status === "free").length;
  const totalTables = indoorTables.length + outdoorTables.length;
  const occupancyPct = totalTables
    ? ((indoorTables.filter((t) => t.status === "occupied").length +
        outdoorTables.filter((t) => t.status === "occupied").length) /
        totalTables) *
      100
    : 0;

  return (
    <div className="min-h-screen bg-surface-page px-6 py-8 md:px-10">
      <div className="w-full mx-auto flex flex-col ">
        {/* ── Page header ── */}
        <div className="flex flex-col justify-between gap-4 pb-5 sm:flex-row sm:items-end">
          <div className="min-w-0">
            <h1 className="truncate text-[22px] font-semibold tracking-[1px] text-[#3c4043] md:text-[26px]">
              Live Tables
            </h1>
            <p className="mt-1 max-w-xl text-[12px] leading-relaxed text-[#5f6368]">
              Manage your restaurant floor plan and monitor seating in
              real-time.
            </p>
          </div>

          <HeaderActionButton
            variant="dashed"
            icon={Armchair}
            hideLabelOnMobile
            label="Add Table"
            onClick={() => {
              setEditingTable(null);
              setAddModalOpen(true);
            }}
          />
        </div>

        <div
          aria-hidden
          className="mb-4 h-px w-full bg-gradient-to-r from-[#dadce0] via-[#e8eaed] to-transparent"
        />

        {/* ── Main panel ── */}
        <div className="flex flex-col gap-4">
          {/* View toggle */}
          <div
            role="radiogroup"
            aria-label="Table view"
            className="flex w-fit items-center gap-1 rounded-xl bg-[#e4f2fe] p-1"
          >
            {[
              { id: "grid", label: "Grid View", icon: LayoutGrid },
              { id: "floor", label: "Floor Plan", icon: Map },
            ].map(({ id, label, icon: Icon }) => {
              const selected = tab === id;
              return (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setTab(id as Tab)}
                  className={`flex cursor-pointer items-center gap-1.5 rounded-lg px-4 py-2 text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#e4f2fe] ${
                    selected
                      ? "bg-white font-semibold text-blue-950 shadow-sm"
                      : "font-semibold text-blue-800 hover:text-blue-950"
                  }`}
                >
                  <Icon size={14} />
                  {label}
                </button>
              );
            })}
          </div>

          {isLoading ? (
            <LiveTablesSkeleton />
          ) : isError ? (
            <div className="flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-[#e3e3e3] bg-white p-16 text-center">
              <p className="text-sm text-[#d93025]">Failed to load tables</p>
              <p className="text-xs text-[#9aa0a6]">
                Please check your connection and try again.
              </p>
            </div>
          ) : tables.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-[#e3e3e3] bg-white p-16 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f1f3f4]">
                <Utensils className="h-6 w-6 text-[#9aa0a6]" />
              </div>
              <p className="text-sm text-[#3c4043]">No tables yet</p>
              <p className="text-xs text-[#9aa0a6]">
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
              <Suspense
                fallback={
                  tab === "floor" ? <FloorPlanSkeleton /> : <GridViewSkeleton />
                }
              >
                {tab === "floor" ? (
                  <FloorPlanView
                    indoorTables={indoorTables}
                    outdoorTables={outdoorTables}
                    selectedTableId={selectedTable?.id ?? null}
                    onSelectTable={setSelectedTable}
                    onViewDetails={setDetailTable}
                  />
                ) : (
                  <GridView
                    tables={tables}
                    selectedTableId={selectedTable?.id ?? null}
                    onSelectTable={setSelectedTable}
                    onEditTable={handleEditTable}
                    onTableDeleted={handleTableCreated}
                    onTableChanged={handleTableCreated}
                    onViewDetails={setDetailTable}
                  />
                )}
              </Suspense>

              {/* ── Assigned tickets ──
                  Lives here rather than inside GridView so a table picked on
                  the floor plan highlights its card too. Fed the unfiltered
                  `tables`: the status pills inside GridView filter that grid,
                  not this summary. */}
              <div className="mt-6">
                <TableTicketCards
                  tables={tables}
                  selectedTableId={selectedTable?.id ?? null}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Table detail (modal) ──
          Rendered only while open: a dynamic import is only fetched once the
          component is actually mounted, so a session that never opens a modal
          never downloads it. */}
      {detailTable && (
        <Suspense fallback={null}>
          <TableDetail
            table={detailTable}
            open={!!detailTable}
            onClose={() => setDetailTable(null)}
          />
        </Suspense>
      )}

      {addModalOpen && (
        <Suspense fallback={null}>
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
        </Suspense>
      )}
    </div>
  );
}
