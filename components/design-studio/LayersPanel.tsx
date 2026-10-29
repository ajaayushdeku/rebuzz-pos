"use client";

import {
  Layers3,
  Type,
  Image as ImageIcon,
  RectangleHorizontal,
  Shapes,
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
  Trash2,
} from "lucide-react";

import { useState, type Dispatch, type SetStateAction } from "react";
import type { DesignLayer } from "@/components/design-studio/contents";

interface LayersPanelProps {
  layers: DesignLayer[];
  selectedLayer: string;
  setSelectedLayer: (id: string) => void;
  setLayers: Dispatch<SetStateAction<DesignLayer[]>>;
  updateLayerName: (id: string, name: string) => void;
  moveLayer: (id: string, direction: "up" | "down") => void;
  deleteLayer: (id: string) => void;
}

export default function LayersPanel({
  layers,
  selectedLayer,
  setSelectedLayer,
  setLayers,
  updateLayerName,
  moveLayer,
  deleteLayer,
}: LayersPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  return (
    <div>
      {/* <div className="mb-4 flex items-center justify-between">
        <h3 className="text-xs font-semibold text-gray-900 dark:text-gray-100">
          Layers
        </h3>

        <Layers3 className="h-4 w-4 text-gray-500 dark:text-gray-400" />
      </div> */}
      <button
        type="button"
        onClick={() => setIsExpanded((previous) => !previous)}
        aria-expanded={isExpanded}
        aria-controls="layers-content"
        className="mb-4 flex w-full items-center justify-between rounded-lg text-left transition hover:opacity-80"
      >
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-semibold text-gray-900 dark:text-gray-100">
            Layers
          </h3>

          <ChevronDown
            className={`h-4 w-4 text-gray-500 transition-transform duration-200 dark:text-gray-400 cursor-pointer ${
              isExpanded ? "rotate-180" : ""
            }`}
          />
        </div>

        <Layers3 className="h-4 w-4 text-gray-500 dark:text-gray-400" />
      </button>

      {isExpanded && (
        <div
          id="layers-content"
          className="max-h-60 space-y-2 overflow-y-auto scrollbar-hide"
        >
          {/* <div className="max-h-60 space-y-2 overflow-y-auto scrollbar-hide"> */}
          {layers.map(({ id, name, type, visible }) => {
            const isSelected = selectedLayer === id;

            const Icon =
              type === "text"
                ? Type
                : type === "image"
                  ? ImageIcon
                  : type === "banner"
                    ? RectangleHorizontal
                    : Shapes;

            const layerIndex = layers.findIndex((layer) => layer.id === id);

            return (
              <div
                key={id}
                className={`flex items-center gap-2 rounded-lg border p-2 transition ${
                  isSelected
                    ? "border-[#244074] bg-white dark:border-[#7ba2e3] dark:bg-[#0f1420]"
                    : "border-gray-200 bg-white hover:border-gray-300 dark:border-white/10 dark:bg-[#111827]"
                }`}
              >
                {/* Select layer */}
                <button
                  type="button"
                  onClick={() => setSelectedLayer(id)}
                  aria-label={`Select ${name}`}
                  className="shrink-0 rounded-md p-1.5 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/10"
                >
                  <Icon className="h-4 w-4" />
                </button>

                {/* Editable layer name */}
                <input
                  type="text"
                  value={name}
                  aria-label={`Rename ${name}`}
                  onFocus={() => setSelectedLayer(id)}
                  onChange={(event) => updateLayerName(id, event.target.value)}
                  className="min-w-0 flex-1 rounded px-1 py-1 text-xs font-medium text-gray-700 outline-none transition focus:bg-blue-50 focus:ring-1 focus:ring-[#244074]/40 dark:text-gray-200 dark:focus:bg-[#244074]/20"
                  placeholder="Layer name"
                />

                {/* Change stacking order */}
                <div className="flex shrink-0 flex-col">
                  <button
                    type="button"
                    onClick={() => moveLayer(id, "up")}
                    disabled={layerIndex === 0}
                    aria-label={`Bring ${name} forward`}
                    title="Bring forward"
                    className="rounded p-0.5 text-gray-500 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30 dark:text-gray-400 dark:hover:bg-white/10"
                  >
                    <ChevronUp className="h-3 w-3" />
                  </button>

                  <button
                    type="button"
                    onClick={() => moveLayer(id, "down")}
                    disabled={layerIndex === layers.length - 1}
                    aria-label={`Send ${name} backward`}
                    title="Send backward"
                    className="rounded p-0.5 text-gray-500 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30 dark:text-gray-400 dark:hover:bg-white/10"
                  >
                    <ChevronDown className="h-3 w-3" />
                  </button>
                </div>

                {/* Toggle visibility */}
                <button
                  type="button"
                  aria-label={`${visible ? "Hide" : "Show"} ${name}`}
                  aria-pressed={visible}
                  onClick={() =>
                    setLayers((previous) =>
                      previous.map((layer) =>
                        layer.id === id
                          ? { ...layer, visible: !layer.visible }
                          : layer,
                      ),
                    )
                  }
                  className="shrink-0 rounded p-1.5 text-gray-500 transition hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/10"
                >
                  {visible ? (
                    <Eye className="h-3.5 w-3.5" />
                  ) : (
                    <EyeOff className="h-3.5 w-3.5" />
                  )}
                </button>

                {/* Delete layer */}
                <button
                  type="button"
                  onClick={() => deleteLayer(id)}
                  aria-label={`Delete ${name}`}
                  className="rounded p-1.5 text-gray-500 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}

          {layers.length === 0 && (
            <p className="rounded-lg border border-dashed border-gray-300 p-4 text-center text-xs text-gray-500 dark:border-white/10 dark:text-gray-400">
              No layers yet. Add a shape, text, or image to get started.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
