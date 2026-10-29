"use client";

import type { Dispatch, SetStateAction } from "react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  RectangleHorizontal,
  Shapes,
  Sparkles,
  Type,
} from "lucide-react";

import { shapeOptions } from "@/components/design-studio/contents";

import type {
  DesignLayer,
  ShapeType,
} from "@/components/design-studio/contents";

interface PropertiesPanelProps {
  selectedLayerInfo: DesignLayer | undefined;
  selectedShape: DesignLayer | undefined;
  selectedShapeColor: string;
  selectedPreset: {
    width: number;
    height: number;
  };
  setLayers: Dispatch<SetStateAction<DesignLayer[]>>;
  setShapeFillColor: (color: string) => void;
  updateSelectedLayer: (updates: Partial<DesignLayer>) => void;
}

export default function PropertiesPanel({
  selectedLayerInfo,
  selectedShape,
  selectedShapeColor,
  selectedPreset,
  setLayers,
  setShapeFillColor,
  updateSelectedLayer,
}: PropertiesPanelProps) {
  const updateShape = (updates: Partial<DesignLayer>) => {
    if (!selectedShape) return;

    setLayers((previous) =>
      previous.map((layer) =>
        layer.id === selectedShape.id ? { ...layer, ...updates } : layer,
      ),
    );
  };

  const fieldClass =
    "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-[13px] " +
    "outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 " +
    "dark:border-white/10 dark:bg-[#202838]";

  const labelClass =
    "mb-1.5 block text-xs font-medium text-gray-600 " + "dark:text-gray-300";

  const sectionClass =
    "space-y-4 border-t border-gray-200 pt-4 dark:border-white/10";

  return (
    <div>
      <h3 className="text-xs font-semibold text-gray-900 dark:text-gray-100">
        Properties
      </h3>

      <p className="mb-4 mt-3 text-xs text-gray-500 dark:text-gray-400">
        Selected element:{" "}
        <span className="font-medium text-gray-700 dark:text-gray-200">
          {selectedLayerInfo?.name ?? "None"}
        </span>
      </p>

      <div className="max-h-120 space-y-4 overflow-y-auto scrollbar-hide">
        {/* Font size */}
        <div>
          <div className="flex items-center justify-between">
            <label
              htmlFor="font-size"
              className="mb-2 block text-xs font-medium text-gray-700 dark:text-gray-300"
            >
              Font size
            </label>

            <span className="text-xs text-gray-500 dark:text-gray-400">
              {selectedLayerInfo?.fontSize ?? 16} px
            </span>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="font-size"
              type="range"
              min={8}
              max={120}
              value={selectedLayerInfo?.fontSize ?? 16}
              disabled={
                !selectedLayerInfo ||
                selectedLayerInfo.type === "image" ||
                selectedLayerInfo.type === "shape"
              }
              onChange={(event) =>
                updateSelectedLayer({
                  fontSize: Number(event.target.value),
                })
              }
              className="min-w-0 flex-1 accent-[#244074]"
            />
          </div>
        </div>

        {/* General opacity */}
        <div>
          <div className="flex items-center justify-between">
            <label
              htmlFor="opacity"
              className="mb-2 block text-xs font-medium text-gray-700 dark:text-gray-300"
            >
              Opacity
            </label>{" "}
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {selectedLayerInfo?.opacity ?? 100}%
            </span>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="opacity"
              type="range"
              min={0}
              max={100}
              value={selectedLayerInfo?.opacity ?? 100}
              disabled={!selectedLayerInfo}
              onChange={(event) =>
                updateSelectedLayer({
                  opacity: Number(event.target.value),
                })
              }
              className="min-w-0 flex-1 accent-[#244074]"
            />
          </div>
        </div>
        {/* Rotation */}
        {selectedLayerInfo && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="layer-rotation"
                className="text-xs font-medium text-gray-700 dark:text-gray-300"
              >
                Rotation
              </label>

              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                {Math.round(selectedLayerInfo.rotation ?? 0)}°
              </span>
            </div>

            <input
              id="layer-rotation"
              type="range"
              min={-180}
              max={180}
              step={1}
              value={selectedLayerInfo.rotation ?? 0}
              onChange={(event) =>
                updateSelectedLayer({
                  rotation: Number(event.target.value),
                })
              }
              className="w-full accent-[#244074]"
            />

            <div className="flex items-center gap-2">
              <input
                type="number"
                min={-360}
                max={360}
                step={1}
                value={selectedLayerInfo.rotation ?? 0}
                onChange={(event) => {
                  const value = Number(event.target.value);

                  if (!Number.isFinite(value)) return;

                  updateSelectedLayer({
                    rotation: Math.max(-360, Math.min(360, value)),
                  });
                }}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#244074] dark:border-white/10 dark:bg-[#151d2b] dark:text-gray-100"
              />

              <button
                type="button"
                onClick={() => updateSelectedLayer({ rotation: 0 })}
                className="shrink-0 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/5"
              >
                Reset
              </button>
            </div>
          </div>
        )}

        {/* Text-specific properties */}
        {selectedLayerInfo?.type === "text" && (
          <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-3 dark:border-white/10 dark:bg-[#111827]">
            <div className="flex items-center gap-2">
              <Type className="h-4 w-4 text-[#244074] dark:text-[#7ba2e3]" />
              <h4 className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                Text Properties
              </h4>
            </div>

            {/* Text content */}
            <div className="space-y-1.5">
              <label
                htmlFor="text-content"
                className="block text-xs font-medium text-gray-700 dark:text-gray-300"
              >
                Text Content
              </label>
              <textarea
                id="text-content"
                rows={3}
                value={selectedLayerInfo.content ?? ""}
                onChange={(event) =>
                  updateSelectedLayer({ content: event.target.value })
                }
                className="w-full resize-y rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#244074] dark:border-white/10 dark:bg-[#151d2b] dark:text-gray-100"
                placeholder="Enter your text..."
              />
            </div>

            {/* Font family */}
            <div className="space-y-1.5">
              <label
                htmlFor="text-font-family"
                className="block text-xs font-medium text-gray-700 dark:text-gray-300"
              >
                Font Family
              </label>
              <select
                id="text-font-family"
                value={selectedLayerInfo.fontFamily ?? "Arial"}
                onChange={(event) =>
                  updateSelectedLayer({ fontFamily: event.target.value })
                }
                className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-sm text-gray-800 outline-none focus:border-[#244074] dark:border-white/10 dark:bg-[#151d2b] dark:text-gray-100"
              >
                <option value="Arial">Arial</option>
                <option value="Inter">Inter</option>
                <option value="Roboto">Roboto</option>
                <option value="Georgia">Georgia</option>
                <option value="Verdana">Verdana</option>
                <option value="Impact">Impact</option>
                <option value="monospace">Monospace</option>
              </select>
            </div>

            {/* Font weight and style */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <label
                  htmlFor="text-font-weight"
                  className="block text-xs font-medium text-gray-700 dark:text-gray-300"
                >
                  Font Weight
                </label>
                <select
                  id="text-font-weight"
                  value={selectedLayerInfo.fontWeight ?? 400}
                  onChange={(event) =>
                    updateSelectedLayer({
                      fontWeight: Number(event.target.value),
                    })
                  }
                  className="w-full rounded-lg border border-gray-200 bg-white px-2 py-2 text-sm text-gray-800 outline-none focus:border-[#244074] dark:border-white/10 dark:bg-[#151d2b] dark:text-gray-100"
                >
                  <option value={300}>Light</option>
                  <option value={400}>Regular</option>
                  <option value={500}>Medium</option>
                  <option value={600}>Semi Bold</option>
                  <option value={700}>Bold</option>
                  <option value={800}>Extra Bold</option>
                  <option value={900}>Black</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="text-font-style"
                  className="block text-xs font-medium text-gray-700 dark:text-gray-300"
                >
                  Font Style
                </label>
                <select
                  id="text-font-style"
                  value={selectedLayerInfo.fontStyle ?? "normal"}
                  onChange={(event) =>
                    updateSelectedLayer({
                      fontStyle: event.target.value as "normal" | "italic",
                    })
                  }
                  className="w-full rounded-lg border border-gray-200 bg-white px-2 py-2 text-sm text-gray-800 outline-none focus:border-[#244074] dark:border-white/10 dark:bg-[#151d2b] dark:text-gray-100"
                >
                  <option value="normal">Normal</option>
                  <option value="italic">Italic</option>
                </select>
              </div>
            </div>

            {/* Text color */}
            <div className="space-y-1.5">
              <label
                htmlFor="text-color"
                className="block text-xs font-medium text-gray-700 dark:text-gray-300"
              >
                Text Color
              </label>
              <div className="flex items-center gap-3 rounded-lg border border-gray-200 px-3 py-2 dark:border-white/10">
                <input
                  id="text-color"
                  type="color"
                  value={selectedLayerInfo.color ?? "#111827"}
                  onChange={(event) =>
                    updateSelectedLayer({ color: event.target.value })
                  }
                  className="h-8 w-10 cursor-pointer rounded border-0 bg-transparent"
                />
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {(selectedLayerInfo.color ?? "#111827").toUpperCase()}
                </span>
              </div>
            </div>

            {/* Text alignment */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                Alignment
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: "left", label: "Left", icon: AlignLeft },
                  { value: "center", label: "Center", icon: AlignCenter },
                  { value: "right", label: "Right", icon: AlignRight },
                ].map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    aria-label={`${label} align`}
                    aria-pressed={
                      (selectedLayerInfo.textAlign ?? "left") === value
                    }
                    onClick={() =>
                      updateSelectedLayer({
                        textAlign: value as "left" | "center" | "right",
                      })
                    }
                    className={`flex items-center justify-center rounded-lg border p-2 transition ${
                      (selectedLayerInfo.textAlign ?? "left") === value
                        ? "border-[#244074] bg-blue-50 text-[#244074] dark:border-[#7ba2e3] dark:bg-[#244074]/20 dark:text-blue-200"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/5"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                ))}
              </div>
            </div>

            {/* Text decoration */}
            <div className="space-y-1.5">
              <label
                htmlFor="text-decoration"
                className="block text-xs font-medium text-gray-700 dark:text-gray-300"
              >
                Text Decoration
              </label>
              <select
                id="text-decoration"
                value={selectedLayerInfo.textDecoration ?? "none"}
                onChange={(event) =>
                  updateSelectedLayer({
                    textDecoration: event.target.value as
                      | "none"
                      | "underline"
                      | "line-through",
                  })
                }
                className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-sm text-gray-800 outline-none focus:border-[#244074] dark:border-white/10 dark:bg-[#151d2b] dark:text-gray-100"
              >
                <option value="none">None</option>
                <option value="underline">Underline</option>
                <option value="line-through">Strikethrough</option>
              </select>
            </div>

            {/* Text container width */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="text-container-width"
                  className="text-xs font-medium text-gray-700 dark:text-gray-300"
                >
                  Container Width
                </label>

                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {Math.round(selectedLayerInfo.width)} px
                </span>
              </div>

              <input
                id="text-container-width"
                type="range"
                min={20}
                max={selectedPreset.width}
                step={1}
                value={Math.min(
                  selectedPreset.width,
                  Math.max(20, Math.round(selectedLayerInfo.width)),
                )}
                onChange={(event) => {
                  const width = Number(event.target.value);

                  updateSelectedLayer({
                    width,
                    x: Math.min(
                      selectedLayerInfo.x,
                      selectedPreset.width - width,
                    ),
                  });
                }}
                className="w-full accent-[#244074]"
              />

              <input
                type="number"
                min={20}
                max={selectedPreset.width}
                value={Math.round(selectedLayerInfo.width)}
                onChange={(event) => {
                  const value = Number(event.target.value);

                  if (!Number.isFinite(value) || value < 20) return;

                  const width = Math.min(value, selectedPreset.width);

                  updateSelectedLayer({
                    width,
                    x: Math.min(
                      selectedLayerInfo.x,
                      selectedPreset.width - width,
                    ),
                  });
                }}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#244074] dark:border-white/10 dark:bg-[#151d2b] dark:text-gray-100"
              />

              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Controls the text box width and wrapping area.
              </p>
            </div>

            {/* Line height */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="text-line-height"
                  className="text-xs font-medium text-gray-700 dark:text-gray-300"
                >
                  Line Height
                </label>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {selectedLayerInfo.lineHeight ?? 1.2}
                </span>
              </div>
              <input
                id="text-line-height"
                type="range"
                min={0.8}
                max={3}
                step={0.1}
                value={selectedLayerInfo.lineHeight ?? 1.2}
                onChange={(event) =>
                  updateSelectedLayer({
                    lineHeight: Number(event.target.value),
                  })
                }
                className="w-full accent-[#244074]"
              />
            </div>

            {/* Letter spacing */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="text-letter-spacing"
                  className="text-xs font-medium text-gray-700 dark:text-gray-300"
                >
                  Letter Spacing
                </label>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {selectedLayerInfo.letterSpacing ?? 0}px
                </span>
              </div>
              <input
                id="text-letter-spacing"
                type="range"
                min={-2}
                max={12}
                step={0.5}
                value={selectedLayerInfo.letterSpacing ?? 0}
                onChange={(event) =>
                  updateSelectedLayer({
                    letterSpacing: Number(event.target.value),
                  })
                }
                className="w-full accent-[#244074]"
              />
            </div>
          </div>
        )}

        {/* Shape-specific properties */}
        {selectedShape && (
          <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-3 dark:border-white/10 dark:bg-[#111827]">
            <div className="flex items-center gap-2">
              <Shapes className="h-4 w-4 text-[#244074] dark:text-[#7ba2e3]" />
              <h4 className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                Shape Properties
              </h4>
            </div>

            {/* Shape type */}
            <div className="space-y-1.5">
              <label
                htmlFor="shape-type"
                className="block text-xs font-medium text-gray-700 dark:text-gray-300"
              >
                Shape Type
              </label>

              <select
                id="shape-type"
                value={selectedShape.shapeType ?? "rectangle"}
                onChange={(event) => {
                  const shapeType = event.target.value as ShapeType;

                  updateShape({
                    shapeType,
                    height:
                      shapeType === "line"
                        ? Math.max(1, selectedShape.height ?? 1)
                        : Math.max(20, selectedShape.height ?? 100),
                  });
                }}
                className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-sm text-gray-800 outline-none focus:border-[#244074] dark:border-white/10 dark:bg-[#151d2b] dark:text-gray-100"
              >
                {shapeOptions.map(({ type, label }) => (
                  <option key={type} value={type}>
                    {label}
                  </option>
                ))}
              </select>
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
                    onClick={() => {
                      setShapeFillColor(color);
                      updateShape({
                        color,
                        backgroundColor: color,
                      });
                    }}
                    className={`h-6 w-6 rounded-full border ${
                      selectedShapeColor === color
                        ? "ring-2 ring-[#244074] ring-offset-2 dark:ring-offset-[#111827]"
                        : "border-gray-300 dark:border-white/20"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>

              <label className="flex items-center justify-between gap-2 text-xs text-gray-500 dark:text-gray-400">
                Custom color
                <input
                  type="color"
                  value={selectedShapeColor}
                  onChange={(event) => {
                    const color = event.target.value;
                    setShapeFillColor(color);
                    updateShape({
                      color,
                      backgroundColor: color,
                    });
                  }}
                  className="h-8 w-10 cursor-pointer rounded border-0 bg-transparent"
                />
              </label>
            </div>

            {/* Fill toggle */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                Shape Fill
              </label>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "No Fill", value: false },
                  { label: "Filled", value: true },
                ].map((option) => (
                  <button
                    key={option.label}
                    type="button"
                    aria-pressed={
                      (selectedShape.fillEnabled ?? true) === option.value
                    }
                    onClick={() => updateShape({ fillEnabled: option.value })}
                    className={`rounded-lg border px-3 py-2 text-xs font-medium transition ${
                      (selectedShape.fillEnabled ?? true) === option.value
                        ? "border-[#244074] bg-blue-50 text-[#244074] dark:border-[#7ba2e3] dark:bg-[#244074]/20 dark:text-blue-200"
                        : "border-gray-200 text-gray-600 dark:border-white/10 dark:text-gray-300"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Outline thickness */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="shape-stroke-width"
                  className="text-xs font-medium text-gray-700 dark:text-gray-300"
                >
                  Outline Thickness
                </label>

                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {selectedShape.strokeWidth ?? 2}px
                </span>
              </div>

              <input
                id="shape-stroke-width"
                type="range"
                min={1}
                max={12}
                step={1}
                value={selectedShape.strokeWidth ?? 2}
                onChange={(event) =>
                  updateShape({
                    strokeWidth: Number(event.target.value),
                  })
                }
                className="w-full accent-[#244074]"
              />
            </div>

            {/* Width and height */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                Dimensions
              </label>

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
                    value={Math.round(selectedShape.width)}
                    onChange={(event) => {
                      const value = Number(event.target.value);

                      if (!Number.isFinite(value) || value < 1) return;

                      const width = Math.min(value, selectedPreset.width);

                      updateShape({
                        width,
                        x: Math.min(
                          selectedShape.x,
                          selectedPreset.width - width,
                        ),
                      });
                    }}
                    className="w-full rounded-lg border border-gray-200 bg-white px-2 py-2 text-sm text-gray-800 outline-none focus:border-[#244074] dark:border-white/10 dark:bg-[#151d2b] dark:text-gray-100"
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
                    value={Math.max(1, Math.round(selectedShape.height ?? 20))}
                    onChange={(event) => {
                      const value = Number(event.target.value);

                      if (!Number.isFinite(value) || value < 1) return;

                      const height = Math.min(value, selectedPreset.height);

                      updateShape({
                        height,
                        y: Math.min(
                          selectedShape.y,
                          selectedPreset.height - height,
                        ),
                      });
                    }}
                    className="w-full rounded-lg border border-gray-200 bg-white px-2 py-2 text-sm text-gray-800 outline-none focus:border-[#244074] dark:border-white/10 dark:bg-[#151d2b] dark:text-gray-100"
                  />
                </label>
              </div>
            </div>

            {/* Shape opacity */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="selected-shape-opacity"
                  className="text-xs font-medium text-gray-700 dark:text-gray-300"
                >
                  Opacity
                </label>

                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {selectedShape.opacity}%
                </span>
              </div>

              <input
                id="selected-shape-opacity"
                type="range"
                min={0}
                max={100}
                step={5}
                value={selectedShape.opacity}
                onChange={(event) =>
                  updateShape({
                    opacity: Number(event.target.value),
                  })
                }
                className="w-full accent-[#244074]"
              />
            </div>
          </div>
        )}

        {/* Banner Properties */}
        {selectedLayerInfo?.type === "banner" && (
          <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-3 dark:border-white/10 dark:bg-[#111827]">
            <div className="flex items-center gap-2">
              <RectangleHorizontal className="h-4 w-4 text-[#244074] dark:text-[#7ba2e3]" />
              <h4 className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                Banner Properties
              </h4>
            </div>

            {/* Headline */}
            <div>
              <label className={labelClass}>Headline</label>
              <input
                type="text"
                value={selectedLayerInfo.content}
                onChange={(event) =>
                  updateSelectedLayer({ content: event.target.value })
                }
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-[13px] text-gray-800 outline-none focus:border-[#244074] dark:border-white/10 dark:bg-[#151d2b] dark:text-gray-100"
              />
            </div>

            {/* Subtitle */}
            <div>
              <label className={labelClass}>Subtitle</label>
              <input
                type="text"
                value={selectedLayerInfo.subtitle ?? ""}
                onChange={(event) =>
                  updateSelectedLayer({ subtitle: event.target.value })
                }
                placeholder="e.g. Limited time only"
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-[13px] text-gray-800 outline-none focus:border-[#244074] dark:border-white/10 dark:bg-[#151d2b] dark:text-gray-100"
              />
            </div>

            {/* Colors */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Background</label>
                <input
                  type="color"
                  value={selectedLayerInfo.backgroundColor ?? "#244074"}
                  onChange={(event) =>
                    updateSelectedLayer({
                      backgroundColor: event.target.value,
                    })
                  }
                  className="h-10 w-full cursor-pointer rounded-lg border border-gray-200 bg-white p-1 dark:border-white/10 dark:bg-[#151d2b]"
                />
              </div>

              <div>
                <label className={labelClass}>Text Color</label>
                <input
                  type="color"
                  value={selectedLayerInfo.color ?? "#ffffff"}
                  onChange={(event) =>
                    updateSelectedLayer({ color: event.target.value })
                  }
                  className="h-10 w-full cursor-pointer rounded-lg border border-gray-200 bg-white p-1 dark:border-white/10 dark:bg-[#151d2b]"
                />
              </div>
            </div>

            {/* Font size and weight */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Font Size</label>
                <input
                  type="number"
                  min={8}
                  max={200}
                  value={selectedLayerInfo.fontSize ?? 28}
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    if (!Number.isFinite(value) || value < 8) return;
                    updateSelectedLayer({ fontSize: Math.min(200, value) });
                  }}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-[13px] text-gray-800 outline-none focus:border-[#244074] dark:border-white/10 dark:bg-[#151d2b] dark:text-gray-100"
                />
              </div>

              <div>
                <label className={labelClass}>Font Weight</label>
                <select
                  value={selectedLayerInfo.fontWeight ?? 700}
                  onChange={(event) =>
                    updateSelectedLayer({
                      fontWeight: Number(event.target.value),
                    })
                  }
                  className="w-full rounded-lg border border-gray-200 bg-white px-2 py-2 text-[13px] text-gray-800 outline-none focus:border-[#244074] dark:border-white/10 dark:bg-[#151d2b] dark:text-gray-100"
                >
                  <option value={400}>Regular</option>
                  <option value={500}>Medium</option>
                  <option value={600}>Semibold</option>
                  <option value={700}>Bold</option>
                  <option value={800}>Extra Bold</option>
                  <option value={900}>Black</option>
                </select>
              </div>
            </div>

            {/* Font family */}
            <div>
              <label className={labelClass}>Font Family</label>
              <select
                value={selectedLayerInfo.fontFamily ?? "Arial"}
                onChange={(event) =>
                  updateSelectedLayer({ fontFamily: event.target.value })
                }
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-[13px] text-gray-800 outline-none focus:border-[#244074] dark:border-white/10 dark:bg-[#151d2b] dark:text-gray-100"
              >
                <option value="Arial">Arial</option>
                <option value="Inter">Inter</option>
                <option value="Roboto">Roboto</option>
                <option value="Georgia">Georgia</option>
                <option value="Verdana">Verdana</option>
                <option value="Impact">Impact</option>
                <option value="monospace">Monospace</option>
              </select>
            </div>

            {/* Text alignment */}
            <div>
              <label className={labelClass}>Text Alignment</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: "left", label: "Left", icon: AlignLeft },
                  { value: "center", label: "Center", icon: AlignCenter },
                  { value: "right", label: "Right", icon: AlignRight },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() =>
                      updateSelectedLayer({
                        textAlign: option.value as "left" | "center" | "right",
                      })
                    }
                    className={`flex items-center justify-center  rounded-lg border px-2 py-2 text-xs transition-colors ${
                      (selectedLayerInfo.textAlign ?? "center") === option.value
                        ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/5"
                    }`}
                  >
                    <option.icon className="h-4 w-4" />
                  </button>
                ))}
              </div>
            </div>

            {/* Dimensions */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Width (px)</label>
                <input
                  type="number"
                  min={20}
                  max={selectedPreset.width}
                  value={selectedLayerInfo.width}
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    if (!Number.isFinite(value) || value < 20) return;

                    const width = Math.min(value, selectedPreset.width);
                    updateSelectedLayer({
                      width,
                      x: Math.min(
                        selectedLayerInfo.x,
                        selectedPreset.width - width,
                      ),
                    });
                  }}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-[13px] text-gray-800 outline-none focus:border-[#244074] dark:border-white/10 dark:bg-[#151d2b] dark:text-gray-100"
                />
              </div>

              <div>
                <label className={labelClass}>Height (px)</label>
                <input
                  type="number"
                  min={20}
                  max={selectedPreset.height}
                  value={selectedLayerInfo.height}
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    if (!Number.isFinite(value) || value < 20) return;

                    const height = Math.min(value, selectedPreset.height);
                    updateSelectedLayer({
                      height,
                      y: Math.min(
                        selectedLayerInfo.y,
                        selectedPreset.height - height,
                      ),
                    });
                  }}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-[13px] text-gray-800 outline-none focus:border-[#244074] dark:border-white/10 dark:bg-[#151d2b] dark:text-gray-100"
                />
              </div>
            </div>

            {/* Rounded corners */}
            <div>
              <div className="flex items-center justify-between">
                <label className={labelClass}>Corner Radius</label>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {selectedLayerInfo.borderRadius ?? 12}px
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={50}
                value={selectedLayerInfo.borderRadius ?? 12}
                onChange={(event) =>
                  updateSelectedLayer({
                    borderRadius: Number(event.target.value),
                  })
                }
                className="w-full accent-[#244074]"
              />
            </div>

            {/* Padding */}
            <div>
              <div className="flex items-center justify-between">
                <label className={labelClass}>Inner Padding</label>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {selectedLayerInfo.padding ?? 16}px
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={48}
                value={selectedLayerInfo.padding ?? 16}
                onChange={(event) =>
                  updateSelectedLayer({ padding: Number(event.target.value) })
                }
                className="w-full accent-[#244074]"
              />
            </div>

            {/* Border */}
            <div className="space-y-5">
              <div>
                <label className={labelClass}>Border Color</label>
                <input
                  type="color"
                  value={
                    selectedLayerInfo.borderColor ??
                    selectedLayerInfo.backgroundColor ??
                    "#244074"
                  }
                  onChange={(event) =>
                    updateSelectedLayer({ borderColor: event.target.value })
                  }
                  className="h-10 w-full cursor-pointer rounded-lg border border-gray-200 bg-white p-1 dark:border-white/10 dark:bg-[#151d2b]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className={labelClass}>Border Thickness</label>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {selectedLayerInfo.borderWidth ?? 0}px
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={12}
                  value={selectedLayerInfo.borderWidth ?? 0}
                  onChange={(event) =>
                    updateSelectedLayer({
                      borderWidth: Number(event.target.value),
                    })
                  }
                  className="w-full accent-[#244074]"
                />
              </div>
            </div>

            <section className={sectionClass}>
              <div className="flex items-center gap-2">
                <RectangleHorizontal className="h-4 w-4 text-[#244074] dark:text-[#7ba2e3]" />
                <h4 className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                  Button
                </h4>
              </div>

              <div>
                <label className={labelClass}>Button label</label>
                <input
                  className={fieldClass}
                  value={selectedLayerInfo.buttonText ?? ""}
                  placeholder="SHOP NOW"
                  onChange={(event) =>
                    updateSelectedLayer({ buttonText: event.target.value })
                  }
                />
              </div>

              <div>
                <label className={labelClass}>Alignment</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: "left", label: "Left", icon: AlignLeft },
                    { value: "center", label: "Center", icon: AlignCenter },
                    { value: "right", label: "Right", icon: AlignRight },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        updateSelectedLayer({
                          buttonAlignment: option.value as
                            | "left"
                            | "center"
                            | "right",
                        })
                      }
                      className={`flex items-center justify-center  rounded-lg border px-2 py-2 text-xs transition-colors ${
                        (selectedLayerInfo.buttonAlignment ?? "center") ===
                        option.value
                          ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300"
                          : "border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/5"
                      }`}
                    >
                      <option.icon className="h-4 w-4" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Width (px)</label>
                  <input
                    type="number"
                    min={20}
                    max={selectedLayerInfo.width}
                    className={fieldClass}
                    value={selectedLayerInfo.buttonWidth ?? 140}
                    onChange={(event) =>
                      updateSelectedLayer({
                        buttonWidth: Math.max(
                          20,
                          Math.min(
                            selectedLayerInfo.width,
                            Number(event.target.value) || 20,
                          ),
                        ),
                      })
                    }
                  />
                </div>

                <div>
                  <label className={labelClass}>Height (px)</label>
                  <input
                    type="number"
                    min={16}
                    max={selectedLayerInfo.height}
                    className={fieldClass}
                    value={selectedLayerInfo.buttonHeight ?? 42}
                    onChange={(event) =>
                      updateSelectedLayer({
                        buttonHeight: Math.max(
                          16,
                          Math.min(
                            selectedLayerInfo.height,
                            Number(event.target.value) || 16,
                          ),
                        ),
                      })
                    }
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Font size (px)</label>
                <input
                  type="number"
                  min={8}
                  max={72}
                  className={fieldClass}
                  value={selectedLayerInfo.buttonFontSize ?? 14}
                  onChange={(event) =>
                    updateSelectedLayer({
                      buttonFontSize: Math.max(
                        8,
                        Math.min(72, Number(event.target.value) || 8),
                      ),
                    })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Horizontal padding</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    className={fieldClass}
                    value={selectedLayerInfo.buttonPaddingX ?? 20}
                    onChange={(event) =>
                      updateSelectedLayer({
                        buttonPaddingX: Math.max(
                          0,
                          Math.min(100, Number(event.target.value) || 0),
                        ),
                      })
                    }
                  />
                </div>

                <div>
                  <label className={labelClass}>Vertical padding</label>
                  <input
                    type="number"
                    min={0}
                    max={60}
                    className={fieldClass}
                    value={selectedLayerInfo.buttonPaddingY ?? 10}
                    onChange={(event) =>
                      updateSelectedLayer({
                        buttonPaddingY: Math.max(
                          0,
                          Math.min(60, Number(event.target.value) || 0),
                        ),
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Background</label>
                  <input
                    type="color"
                    className="h-10 w-full cursor-pointer rounded-lg border border-gray-200 bg-white p-1 dark:border-white/10 dark:bg-[#202838]"
                    value={selectedLayerInfo.buttonBackgroundColor ?? "#ffffff"}
                    onChange={(event) =>
                      updateSelectedLayer({
                        buttonBackgroundColor: event.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <label className={labelClass}>Text color</label>
                  <input
                    type="color"
                    className="h-10 w-full cursor-pointer rounded-lg border border-gray-200 bg-white p-1 dark:border-white/10 dark:bg-[#202838]"
                    value={selectedLayerInfo.buttonColor ?? "#244074"}
                    onChange={(event) =>
                      updateSelectedLayer({ buttonColor: event.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className={labelClass}>Corner radius</label>

                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {selectedLayerInfo.buttonBorderRadius ?? 8}px
                  </span>
                </div>

                <input
                  type="range"
                  min={0}
                  max={40}
                  value={selectedLayerInfo.buttonBorderRadius ?? 8}
                  onChange={(event) =>
                    updateSelectedLayer({
                      buttonBorderRadius: Number(event.target.value),
                    })
                  }
                  className="w-full accent-blue-600"
                />
              </div>
            </section>
          </div>
        )}

        {/* Design tip */}
        <div className="rounded-lg border border-dashed border-gray-300 p-3 dark:border-white/15">
          <div className="flex items-start gap-2">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#244074] dark:text-[#7ba2e3]" />

            <div>
              <p className="text-xs font-semibold text-gray-800 dark:text-gray-100">
                Design tip
              </p>
              <p className="mt-1 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                Keep your offer headline bold and your discount easy to read.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
