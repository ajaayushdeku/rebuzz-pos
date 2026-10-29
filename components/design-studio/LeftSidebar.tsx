"use client";

import type { ComponentType, Dispatch, SetStateAction } from "react";
import type { LucideProps } from "lucide-react";
import {
  ChevronDown,
  ChevronRight,
  Shapes,
  Type,
  Image as ImageIcon,
  RectangleHorizontal,
} from "lucide-react";

import {
  canvasPresets,
  designTemplates,
  shapeOptions,
} from "@/components/design-studio/contents";

import type {
  DesignLayer,
  LayerType,
  ShapeType,
} from "@/components/design-studio/contents";

type DesignTool = {
  label: string;
  icon: ComponentType<LucideProps>;
};

type DesignTemplate = (typeof designTemplates)[number];

interface LeftSidebarProps {
  designTools: DesignTool[];
  activeTool: string;
  setActiveTool: Dispatch<SetStateAction<string>>;
  addLayer: (type: LayerType) => void;

  filteredTemplates: DesignTemplate[];
  applyTemplate: (template: DesignTemplate) => void;

  canvasSize: string;
  setCanvasSize: (size: string) => void;

  selectedShapeType: ShapeType;
  setSelectedShapeType: (type: ShapeType) => void;
  addShape: (type: ShapeType) => void;

  shapeFillColor: string;
  setShapeFillColor: (color: string) => void;
  selectedShapeColor: string;
  selectedShape: DesignLayer | undefined;
  selectedShapeOpacity: number;
  setShapeOpacity: (opacity: number) => void;

  selectedPreset: {
    width: number;
    height: number;
  };

  setLayers: Dispatch<SetStateAction<DesignLayer[]>>;

  handleImageUpload: () => void;
}

export default function LeftSidebar({
  designTools,
  activeTool,
  setActiveTool,
  addLayer,
  filteredTemplates,
  applyTemplate,
  canvasSize,
  setCanvasSize,
  selectedShapeType,
  setSelectedShapeType,
  addShape,
  shapeFillColor,
  setShapeFillColor,
  selectedShapeColor,
  selectedShape,
  selectedShapeOpacity,
  setShapeOpacity,
  selectedPreset,
  setLayers,
  handleImageUpload,
}: LeftSidebarProps) {
  const updateSelectedShape = (updates: Partial<DesignLayer>) => {
    if (!selectedShape) return;

    setLayers((previous) =>
      previous.map((layer) =>
        layer.id === selectedShape.id ? { ...layer, ...updates } : layer,
      ),
    );
  };

  const updateShapeColor = (color: string) => {
    setShapeFillColor(color);
    updateSelectedShape({
      color,
      backgroundColor: color,
    });
  };

  return (
    <aside className="border-b border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-[#111827] lg:border-r lg:border-b-0">
      <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
        Design Tools
      </h3>

      <div className="max-h-200 space-y-1 overflow-y-auto scrollbar-hide">
        {designTools.map(({ label, icon: Icon }) => {
          const isActive = activeTool === label;
          const isExpandable =
            label === "Templates" || label === "Canvas" || label === "Shapes";

          return (
            <div key={label}>
              <button
                type="button"
                onClick={() => {
                  setActiveTool((current) => (current === label ? "" : label));

                  if (label === "Text") {
                    addLayer("text");
                  }

                  if (label === "Banner") {
                    addLayer("banner");
                  }

                  if (label === "Images") {
                    handleImageUpload();
                  }
                }}
                aria-expanded={isExpandable ? isActive : undefined}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors cursor-pointer ${
                  isActive
                    ? "bg-blue-50 font-medium text-[#244074] dark:bg-[#244074]/30 dark:text-blue-200"
                    : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1 text-left">{label}</span>

                {isExpandable &&
                  (isActive ? (
                    <ChevronDown className="h-4 w-4 shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 shrink-0" />
                  ))}
              </button>

              {/* Templates */}
              {label === "Templates" && (
                <div
                  className={`grid transition-[grid-template-rows,opacity] duration-200 ease-in-out ${
                    isActive
                      ? "grid-rows-[1fr] opacity-100"
                      : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="ml-3 mt-2 space-y-2 border-l border-gray-200 py-1 pl-3 dark:border-white/10">
                      <p className="mb-2 px-1 text-[11px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
                        Select Template
                      </p>
                      <div className="max-h-80 space-y-2 overflow-y-auto scrollbar-hide">
                        {filteredTemplates.map((template) => (
                          <button
                            key={template.id}
                            type="button"
                            onClick={() => applyTemplate(template)}
                            className="group flex w-full items-center gap-3 rounded-xl border border-gray-200 bg-white p-2 text-left transition-all hover:border-[#244074]/50 hover:bg-blue-50/50 dark:border-white/10 dark:bg-[#151d2b] dark:hover:border-[#7ba2e3]/50 dark:hover:bg-[#244074]/10 cursor-pointer"
                          >
                            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-100 dark:border-white/10 dark:bg-[#0f1420]">
                              <img
                                src={template.thumbnail}
                                alt={`${template.name} template preview`}
                                className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                              />
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs font-semibold text-gray-800 dark:text-gray-100">
                                {template.name}
                              </p>
                              <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                                {template.width} × {template.height} px
                              </p>
                              <p className="mt-1 truncate text-[10px] text-gray-400 dark:text-gray-500">
                                {template.category}
                              </p>
                            </div>

                            <ChevronRight className="h-3 w-3 shrink-0 text-gray-400 transition-colors group-hover:text-[#244074] dark:group-hover:text-blue-300" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Canvas presets */}
              {label === "Canvas" && (
                <div
                  className={`grid transition-[grid-template-rows,opacity] duration-200 ease-in-out ${
                    isActive
                      ? "grid-rows-[1fr] opacity-100"
                      : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="ml-3 mt-2 space-y-2 border-l border-gray-200 py-1 pl-3 dark:border-white/10">
                      <p className="mb-2 px-1 text-[11px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
                        Canvas Size
                      </p>

                      <div className="max-h-80 space-y-2 overflow-y-auto scrollbar-hide">
                        {canvasPresets.map((preset) => (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => {
                              setCanvasSize(preset.id);
                              setActiveTool("");
                            }}
                            className={`w-full rounded-lg border p-3 text-left transition-colors cursor-pointer ${
                              canvasSize === preset.id
                                ? "border-[#244074] bg-blue-50/50 dark:border-[#7ba2e3] dark:bg-[#244074]/20"
                                : "border-gray-200 hover:border-gray-300 dark:border-white/10 dark:hover:border-white/20"
                            }`}
                          >
                            <span className="block text-xs font-medium text-gray-800 dark:text-gray-100">
                              {preset.name}
                            </span>
                            <span className="mt-1 block text-[11px] text-gray-500 dark:text-gray-400">
                              {preset.width} × {preset.height} px
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Shapes */}
              {label === "Shapes" && (
                <div
                  className={`grid transition-[grid-template-rows,opacity] duration-200 ${
                    isActive
                      ? "grid-rows-[1fr] opacity-100"
                      : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="ml-3 mt-2 space-y-4 border-l border-gray-200 py-2 pl-3 dark:border-white/10">
                      <p className="mb-2 px-1 text-[11px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
                        Add Shape
                      </p>

                      <div className="grid grid-cols-2 gap-2">
                        {shapeOptions.map(({ type, label: shapeLabel }) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => {
                              setSelectedShapeType(type);
                              addShape(type);
                            }}
                            className={`flex flex-col items-center gap-2 rounded-lg border p-3 text-xs transition ${
                              selectedShapeType === type
                                ? "border-[#244074] bg-blue-50 text-[#244074] dark:border-[#7ba2e3] dark:bg-[#244074]/20 dark:text-blue-200"
                                : "border-gray-200 text-gray-600 hover:border-gray-300 dark:border-white/10 dark:text-gray-300"
                            }`}
                          >
                            <svg
                              viewBox="0 0 40 32"
                              className="h-8 w-10"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinejoin="round"
                              strokeLinecap="round"
                              aria-hidden="true"
                            >
                              {type === "rectangle" && (
                                <rect x="5" y="5" width="30" height="22" />
                              )}
                              {type === "rounded-rectangle" && (
                                <rect
                                  x="5"
                                  y="5"
                                  width="30"
                                  height="22"
                                  rx="4"
                                />
                              )}
                              {type === "circle" && (
                                <circle cx="20" cy="16" r="11" />
                              )}
                              {type === "line" && (
                                <line x1="5" y1="16" x2="35" y2="16" />
                              )}
                              {type === "triangle" && (
                                <polygon points="20,4 36,28 4,28" />
                              )}
                              {type === "diamond" && (
                                <polygon points="20,3 36,16 20,29 4,16" />
                              )}
                              {type === "pentagon" && (
                                <polygon points="20,3 36,12 30,29 10,29 4,12" />
                              )}
                              {type === "hexagon" && (
                                <polygon points="11,4 29,4 37,16 29,28 11,28 3,16" />
                              )}
                              {type === "star" && (
                                <polygon points="20,2 24,12 36,12 27,19 30,30 20,23 10,30 13,19 4,12 16,12" />
                              )}
                              {type === "arrow" && (
                                <polygon points="3,11 23,11 23,4 37,16 23,28 23,21 3,21" />
                              )}
                            </svg>
                            {shapeLabel}
                          </button>
                        ))}
                      </div>

                      {/* Shape color */}
                      <div className="space-y-2">
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                          Fill Color
                        </label>

                        <div className="flex flex-wrap gap-2">
                          {[
                            "#244074",
                            "#EF4444",
                            "#F59E0B",
                            "#10B981",
                            "#8B5CF6",
                            "#111827",
                            "#FFFFFF",
                          ].map((color) => (
                            <button
                              key={color}
                              type="button"
                              aria-label={`Set shape color to ${color}`}
                              aria-pressed={selectedShapeColor === color}
                              onClick={() => updateShapeColor(color)}
                              className={`h-6 w-6 rounded-full border ${
                                selectedShapeColor === color
                                  ? "ring-2 ring-[#244074] ring-offset-2 dark:ring-offset-[#111827]"
                                  : "border-gray-300 dark:border-white/20"
                              }`}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>

                        <label className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                          Custom color
                          <input
                            type="color"
                            value={shapeFillColor}
                            onChange={(event) =>
                              updateShapeColor(event.target.value)
                            }
                            className="h-7 w-9 cursor-pointer rounded border-0 bg-transparent"
                          />
                        </label>
                      </div>

                      {/* Fill and stroke controls */}
                      {selectedShape && (
                        <div className="mt-4 space-y-4 border-t border-gray-200 pt-4 dark:border-white/10">
                          <div className="space-y-2">
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                              Fill
                            </label>

                            <div className="grid grid-cols-2 gap-2">
                              {[
                                { label: "Filled", value: true },
                                { label: "No Fill", value: false },
                              ].map((option) => (
                                <button
                                  key={option.label}
                                  type="button"
                                  aria-pressed={
                                    (selectedShape.fillEnabled ?? true) ===
                                    option.value
                                  }
                                  onClick={() =>
                                    updateSelectedShape({
                                      fillEnabled: option.value,
                                    })
                                  }
                                  className={`rounded-lg border px-3 py-2 text-xs font-medium transition ${
                                    (selectedShape.fillEnabled ?? true) ===
                                    option.value
                                      ? "border-[#244074] bg-blue-50 text-[#244074] dark:border-[#7ba2e3] dark:bg-[#244074]/20 dark:text-blue-200"
                                      : "border-gray-200 text-gray-600 hover:border-gray-300 dark:border-white/10 dark:text-gray-300"
                                  }`}
                                >
                                  {option.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <label
                                htmlFor="sidebar-stroke-width"
                                className="text-xs font-medium text-gray-700 dark:text-gray-300"
                              >
                                {selectedShape.shapeType === "line"
                                  ? "Line Thickness"
                                  : "Stroke Thickness"}
                              </label>
                              <span className="text-xs tabular-nums text-gray-500 dark:text-gray-400">
                                {selectedShape.strokeWidth ?? 2}px
                              </span>
                            </div>

                            <input
                              id="sidebar-stroke-width"
                              type="range"
                              min={1}
                              max={12}
                              step={1}
                              value={selectedShape.strokeWidth ?? 2}
                              onChange={(event) =>
                                updateSelectedShape({
                                  strokeWidth: Number(event.target.value),
                                })
                              }
                              className="w-full cursor-pointer accent-[#244074]"
                            />
                          </div>
                        </div>
                      )}

                      {/* Dimensions */}
                      <div className="space-y-3">
                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          Dimensions
                        </p>

                        <div className="grid grid-cols-2 gap-2">
                          <label className="space-y-1">
                            <span className="block text-[11px] text-gray-500 dark:text-gray-400">
                              Width (px)
                            </span>
                            <input
                              type="number"
                              min={1}
                              max={selectedPreset.width}
                              step={1}
                              disabled={!selectedShape}
                              value={
                                selectedShape
                                  ? Math.round(selectedShape.width)
                                  : ""
                              }
                              onChange={(event) => {
                                const value = Number(event.target.value);
                                if (
                                  !selectedShape ||
                                  !Number.isFinite(value) ||
                                  value < 1
                                )
                                  return;

                                const width = Math.min(
                                  value,
                                  selectedPreset.width,
                                );
                                updateSelectedShape({
                                  width,
                                  x: Math.min(
                                    selectedShape.x,
                                    selectedPreset.width - width,
                                  ),
                                });
                              }}
                              className="w-full rounded-lg border border-gray-200 bg-white px-2 py-2 text-sm text-gray-800 outline-none focus:border-[#244074] disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-[#151d2b] dark:text-gray-100"
                            />
                          </label>

                          <label className="space-y-1">
                            <span className="block text-[11px] text-gray-500 dark:text-gray-400">
                              Height (px)
                            </span>
                            <input
                              type="number"
                              min={1}
                              max={selectedPreset.height}
                              step={1}
                              disabled={!selectedShape}
                              value={
                                selectedShape
                                  ? Math.max(
                                      1,
                                      Math.round(selectedShape.height ?? 20),
                                    )
                                  : ""
                              }
                              onChange={(event) => {
                                const value = Number(event.target.value);
                                if (
                                  !selectedShape ||
                                  !Number.isFinite(value) ||
                                  value < 1
                                )
                                  return;

                                const height = Math.min(
                                  value,
                                  selectedPreset.height,
                                );
                                updateSelectedShape({
                                  height,
                                  y: Math.min(
                                    selectedShape.y,
                                    selectedPreset.height - height,
                                  ),
                                });
                              }}
                              className="w-full rounded-lg border border-gray-200 bg-white px-2 py-2 text-sm text-gray-800 outline-none focus:border-[#244074] disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-[#151d2b] dark:text-gray-100"
                            />
                          </label>
                        </div>

                        {!selectedShape && (
                          <p className="text-[11px] text-gray-400 dark:text-gray-500">
                            Add or select a shape to edit its dimensions.
                          </p>
                        )}
                      </div>

                      {/* Shape opacity */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label
                            htmlFor="sidebar-shape-opacity"
                            className="text-xs font-medium text-gray-700 dark:text-gray-300"
                          >
                            Opacity
                          </label>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {selectedShapeOpacity}%
                          </span>
                        </div>

                        <input
                          id="sidebar-shape-opacity"
                          type="range"
                          min={0}
                          max={100}
                          step={5}
                          value={selectedShapeOpacity}
                          onChange={(event) => {
                            const opacity = Number(event.target.value);
                            setShapeOpacity(opacity);
                            updateSelectedShape({ opacity });
                          }}
                          className="w-full accent-[#244074]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
