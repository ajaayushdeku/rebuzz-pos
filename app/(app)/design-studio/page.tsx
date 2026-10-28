"use client";

import { useRef, useState } from "react";
import {
  Palette,
  Type,
  Shapes,
  Layers3,
  Image as ImageIcon,
  LayoutTemplate,
  Eye,
  EyeOff,
  Undo2,
  Redo2,
  Download,
  Sparkles,
  RectangleHorizontal,
  Plus,
  ImagePlus,
  Trash2,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

import PageHeader from "@/components/ui/PageHeader";
import {
  canvasPresets,
  DesignLayer,
  DesignTemplate,
  designTemplates,
  initialLayers,
  LayerType,
} from "@/components/design-studio/contents";

const designTools = [
  { label: "Templates", icon: LayoutTemplate },
  { label: "Images", icon: ImageIcon },
  { label: "Text", icon: Type },
  { label: "Shapes", icon: Shapes },
  { label: "Colors", icon: Palette },
];

// const initialLayers = [
//   { id: "headline", name: "Headline", icon: Type },
//   { id: "discount", name: "Discount", icon: CircleDollarSign },
//   { id: "banner", name: "Banner", icon: RectangleHorizontal },
//   { id: "background", name: "Background", icon: ImageIcon },
// ];

export default function HelpPage() {
  const [activeTool, setActiveTool] = useState("Templates");
  const [layers, setLayers] = useState<DesignLayer[]>(initialLayers);
  const [selectedLayer, setSelectedLayer] = useState("headline");
  const imageInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const dragRef = useRef<{
    id: string;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);

  const [canvasSize, setCanvasSize] = useState("1080");

  const selectedLayerInfo = layers.find((layer) => layer.id === selectedLayer);

  const updateSelectedLayer = (updates: Partial<DesignLayer>) => {
    setLayers((previous) =>
      previous.map((layer) =>
        layer.id === selectedLayer ? { ...layer, ...updates } : layer,
      ),
    );
  };

  const addLayer = (type: LayerType) => {
    const id = crypto.randomUUID();

    const newLayer: DesignLayer = {
      id,
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} ${layers.length + 1}`,
      type,
      visible: true,
      icon: Type,
      fontSize: 24,
      opacity: 100,
      content: type === "text" ? "New Text" : "",
      color: "#202a3d",
      backgroundColor: type === "shape" ? "#e5e7eb" : undefined,
      x: 100,
      y: 100,
      width: 400,
      height: 100,
    };

    setLayers((previous) => [...previous, newLayer]);
    setSelectedLayer(id);
  };

  const deleteLayer = (id: string) => {
    setLayers((previous) => {
      const updatedLayers = previous.filter((layer) => layer.id !== id);

      if (selectedLayer === id) {
        setSelectedLayer(updatedLayers[0]?.id ?? "");
      }

      return updatedLayers;
    });
  };

  const updateLayerName = (id: string, name: string) => {
    setLayers((previous) =>
      previous.map((layer) =>
        layer.id === id
          ? {
              ...layer,
              name,
              ...(layer.type === "text" || layer.type === "banner"
                ? { content: name }
                : {}),
            }
          : layer,
      ),
    );
  };

  const selectedPreset =
    canvasPresets.find((preset) => preset.id === canvasSize) ??
    canvasPresets[0];

  const [templateCategory, setTemplateCategory] = useState("All");

  const filteredTemplates = designTemplates.filter(
    (template) =>
      templateCategory === "All" || template.category === templateCategory,
  );

  const applyTemplate = (template: DesignTemplate) => {
    const newLayers = template.layers.map((layer) => ({
      ...layer,
      id: crypto.randomUUID(),
    }));

    setLayers(newLayers);
    setSelectedLayer(newLayers[0]?.id ?? "");
    setCanvasSize(template.canvasSize);
    setActiveTool("Layers");
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      event.target.value = "";
      return;
    }

    const imageUrl = URL.createObjectURL(file);
    const id = crypto.randomUUID();

    const newLayer: DesignLayer = {
      id,
      name: file.name,
      type: "image",
      visible: true,
      icon: ImageIcon,
      fontSize: 24,
      opacity: 100,
      content: "",
      color: "#202a3d",
      src: imageUrl,
      x: 100,
      y: 100,
      width: 400,
      height: 300,
    };

    setLayers((previous) => [...previous, newLayer]);
    setSelectedLayer(id);
    setActiveTool("Layers");

    // Allow selecting the same file again later.
    event.target.value = "";
  };

  const handleLayerPointerDown = (
    event: React.PointerEvent<HTMLDivElement>,
    layer: DesignLayer,
  ) => {
    if (event.button !== 0) return;

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);

    setSelectedLayer(layer.id);

    dragRef.current = {
      id: layer.id,
      startX: event.clientX,
      startY: event.clientY,
      originX: layer.x,
      originY: layer.y,
    };
  };

  const handleLayerPointerMove = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    const drag = dragRef.current;
    const canvas = canvasRef.current;

    if (!drag || !canvas) return;

    const rect = canvas.getBoundingClientRect();

    // Convert screen movement into canvas design coordinates.
    const deltaX =
      ((event.clientX - drag.startX) / rect.width) * selectedPreset.width;

    const deltaY =
      ((event.clientY - drag.startY) / rect.height) * selectedPreset.height;

    setLayers((previous) =>
      previous.map((layer) =>
        layer.id === drag.id
          ? {
              ...layer,
              x: Math.max(
                0,
                Math.min(
                  selectedPreset.width - layer.width,
                  drag.originX + deltaX,
                ),
              ),
              y: Math.max(
                0,
                Math.min(
                  selectedPreset.height - layer.height,
                  drag.originY + deltaY,
                ),
              ),
            }
          : layer,
      ),
    );
  };

  const handleLayerPointerUp = () => {
    dragRef.current = null;
  };

  const moveLayer = (id: string, direction: "up" | "down") => {
    setLayers((previous) => {
      const index = previous.findIndex((layer) => layer.id === id);

      if (index === -1) return previous;

      const targetIndex = direction === "up" ? index - 1 : index + 1;

      if (targetIndex < 0 || targetIndex >= previous.length) {
        return previous;
      }

      const next = [...previous];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];

      return next;
    });
  };

  return (
    <div className="min-h-full space-y-5 bg-surface-page px-4 pt-5 sm:px-6 sm:pt-8 md:px-10 dark:bg-[#0f1420]">
      <PageHeader
        title="Design Studio"
        subtitle="Create promotional graphics for your business"
        actions={
          <div className="flex items-end gap-2">
            <div className="flex items-center rounded-lg border border-slate-600">
              <button
                type="button"
                aria-label="Undo"
                className="rounded-l-lg p-2.5 text-slate-600 dark:text-slate-200 transition hover:bg-slate-700"
              >
                <Undo2 className="h-4 w-4" />
              </button>

              <button
                type="button"
                aria-label="Redo"
                className="rounded-r-lg p-2.5 text-slate-600 dark:text-slate-200 transition hover:bg-slate-700"
              >
                <Redo2 className="h-4 w-4" />
              </button>
            </div>

            <button
              type="button"
              className="flex items-center gap-2 rounded-lg bg-[#244074] px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-[#31558f]"
            >
              <Download className="h-4 w-4" />
              Export
            </button>
          </div>
        }
      />

      <div className="overflow-hidden  ">
        {/* Top toolbar */}
        <div className="flex flex-col gap-4 border-b border-gray-200 pb-4 dark:border-white/10">
          {/* Tool navigation */}
          {/* <div className="flex flex-wrap items-center gap-2">
            {[
              { label: "Upload", icon: Upload },
              { label: "Text", icon: Type },
              { label: "Elements", icon: Shapes },
              { label: "Layers", icon: Layers3 },
            ].map(({ label, icon: Icon }) => {
              const isActive = activeTool === label;

              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => setActiveTool(label)}
                  aria-pressed={isActive}
                  className={`inline-flex items-center gap-2 rounded-lg border px-3.5 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#244074] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0f1420] ${
                    isActive
                      ? "border-[#244074] bg-[#244074] text-white shadow-sm"
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50 dark:border-white/10 dark:bg-[#151d2b] dark:text-gray-200 dark:hover:bg-white/5"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              );
            })}
          </div> */}

          {/* Add elements */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Add to your design
              </h3>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Insert new elements into your canvas
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap">
              <button
                type="button"
                onClick={() => addLayer("text")}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-xs font-semibold text-gray-700 transition hover:border-[#244074] hover:bg-blue-50 hover:text-[#244074] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#244074] dark:border-white/10 dark:bg-[#151d2b] dark:text-gray-200 dark:hover:border-[#7ba2e3] dark:hover:bg-[#244074]/20 dark:hover:text-blue-200"
              >
                <Plus className="h-4 w-4" />
                <Type className="hidden h-4 w-4 sm:block" />
                Text
              </button>

              <button
                type="button"
                onClick={() => addLayer("shape")}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-xs font-semibold text-gray-700 transition hover:border-[#244074] hover:bg-blue-50 hover:text-[#244074] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#244074] dark:border-white/10 dark:bg-[#151d2b] dark:text-gray-200 dark:hover:border-[#7ba2e3] dark:hover:bg-[#244074]/20 dark:hover:text-blue-200"
              >
                <Plus className="h-4 w-4" />
                <Shapes className="hidden h-4 w-4 sm:block" />
                Shape
              </button>

              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-xs font-semibold text-gray-700 transition hover:border-[#244074] hover:bg-blue-50 hover:text-[#244074] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#244074] dark:border-white/10 dark:bg-[#151d2b] dark:text-gray-200 dark:hover:border-[#7ba2e3] dark:hover:bg-[#244074]/20 dark:hover:text-blue-200"
              >
                <Plus className="h-4 w-4" />
                <ImagePlus className="hidden h-4 w-4 sm:block" />
                Image
              </button>
            </div>
          </div>
        </div>

        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />

        {/* Main workspace */}
        <div className="grid min-h-[620px] grid-cols-1 lg:grid-cols-[230px_minmax(0,1fr)_255px] xl:grid-cols-[255px_minmax(0,1fr)_280px]">
          {/* Left sidebar */}
          <aside className="border-b border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-[#111827] lg:border-r lg:border-b-0 dark:lg:border-white/10">
            <h3 className="mb-4 text-xs font-semibold text-gray-900 dark:text-gray-100">
              Design Tools
            </h3>

            <div className="space-y-1">
              {designTools.map(({ label, icon: Icon }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setActiveTool(label)}
                  className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-sm transition ${
                    activeTool === label
                      ? "bg-blue-50 font-medium text-[#244074] dark:bg-[#244074]/30 dark:text-blue-200"
                      : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </button>
              ))}
            </div>

            {activeTool === "Templates" && (
              <>
                <div className="my-5 border-t border-gray-200 dark:border-white/10" />

                <div className="grid grid-cols-2 md:grid-cols-1 gap-3 max-h-65 overflow-y-auto scrollbar-hide ">
                  {filteredTemplates.map((template) => (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => applyTemplate(template)}
                      className="overflow-hidden rounded-xl border border-gray-200 text-left transition hover:border-[#244074] hover:shadow-md dark:border-white/10"
                    >
                      <img
                        src={template.thumbnail}
                        alt={`${template.name} template preview`}
                        className="aspect-square w-full object-cover"
                      />

                      <div className="p-3">
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {template.name}
                        </p>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {template.width} × {template.height}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}

            <div className="my-5 border-t border-gray-200 dark:border-white/10" />

            <h3 className="mb-3 text-xs font-medium text-gray-700 dark:text-gray-300">
              Canvas Size
            </h3>

            <div className="space-y-2 max-h-100 border-b border-t border-gray-300 dark:border-white/15 py-2 overflow-y-auto scrollbar-hide">
              {canvasPresets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setCanvasSize(preset.id)}
                  className={`w-full rounded-lg border p-3 text-left transition ${
                    canvasSize === preset.id
                      ? "border-[#244074] bg-blue-50/50 dark:border-[#7ba2e3] dark:bg-[#244074]/20"
                      : "border-gray-200 hover:border-gray-300 dark:border-white/10"
                  }`}
                >
                  <span className="block text-sm font-medium text-gray-800 dark:text-gray-100">
                    {preset.name}
                  </span>

                  <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">
                    {preset.width} × {preset.height} px
                  </span>
                </button>
              ))}
            </div>
          </aside>

          {/* Center canvas */}
          <main className="flex min-w-0 flex-col items-center justify-center bg-[#e7eaf0] p-5 sm:p-8 dark:bg-[#202838]">
            <div className="flex min-h-[360px] w-full items-center justify-center overflow-hidden rounded-lg sm:min-h-[440px]">
              <div
                ref={canvasRef}
                className="relative flex w-full max-w-[460px] flex-col items-center justify-center overflow-hidden bg-white px-5 text-center shadow-sm"
                style={{
                  aspectRatio: `${selectedPreset.width} / ${selectedPreset.height}`,
                }}
              >
                {layers.map((layer, index) => {
                  if (!layer.visible) return null;

                  const isSelected = selectedLayer === layer.id;

                  const commonProps = {
                    key: layer.id,
                    onClick: () => setSelectedLayer(layer.id),
                    style: {
                      opacity: layer.opacity / 100,
                    },
                    className: `relative z-10 cursor-pointer ${
                      isSelected ? "ring-2 ring-[#244074]/50" : ""
                    }`,
                  };

                  return (
                    <div
                      key={layer.id}
                      onPointerDown={(event) =>
                        handleLayerPointerDown(event, layer)
                      }
                      onPointerMove={handleLayerPointerMove}
                      onPointerUp={handleLayerPointerUp}
                      onPointerCancel={handleLayerPointerUp}
                      className={`absolute cursor-move touch-none ${
                        selectedLayer === layer.id
                          ? "outline outline-2 outline-blue-500"
                          : ""
                      }`}
                      style={{
                        left: `${(layer.x / selectedPreset.width) * 100}%`,
                        top: `${(layer.y / selectedPreset.height) * 100}%`,
                        width: `${(layer.width / selectedPreset.width) * 100}%`,
                        minHeight: layer.type === "image" ? undefined : "1px",
                        opacity: layer.opacity / 100,
                        zIndex: layers.length - index,
                      }}
                    >
                      {(() => {
                        switch (layer.type) {
                          case "text":
                            return (
                              <p
                                key={layer.id}
                                onClick={() => setSelectedLayer(layer.id)}
                                style={{
                                  fontSize: `${layer.fontSize}px`,
                                  opacity: layer.opacity / 100,
                                  // color: layer.color,
                                  color: layer.color ?? "#202a3d",
                                }}
                                className="cursor-pointer"
                              >
                                {layer.content}
                              </p>
                            );

                          case "banner":
                            return (
                              <div
                                key={layer.id}
                                onClick={() => setSelectedLayer(layer.id)}
                                style={{
                                  fontSize: `${layer.fontSize}px`,
                                  opacity: layer.opacity / 100,
                                  color: layer.color ?? "#202a3d",
                                }}
                                className="cursor-pointer rounded-lg bg-[#f6c653] px-3 py-2"
                              >
                                {layer.content}
                              </div>
                            );

                          case "image":
                            return (
                              <div
                                key={layer.id}
                                onClick={() => setSelectedLayer(layer.id)}
                                className={`relative z-10 cursor-pointer ${
                                  selectedLayer === layer.id
                                    ? "ring-2 ring-[#244074]"
                                    : ""
                                }`}
                                style={{
                                  opacity: layer.opacity / 100,
                                  width: `${(layer.width / selectedPreset.width) * 100}%`,
                                  maxWidth: "100%",
                                }}
                              >
                                {layer.src && (
                                  <img
                                    src={layer.src}
                                    alt={layer.name}
                                    draggable={false}
                                    className="block h-auto w-full rounded object-contain"
                                  />
                                )}
                              </div>
                            );

                          case "shape":
                            return (
                              <div
                                {...commonProps}
                                style={{
                                  ...commonProps.style,
                                  width: "100%",
                                  height: "20px",
                                  backgroundColor: "#e5e7eb",
                                  color: layer.color ?? "#202a3d",
                                }}
                              />
                            );

                          default:
                            return null;
                        }
                      })()}
                    </div>
                  );
                })}
              </div>
            </div>

            <p className="mt-3 text-xs text-gray-600 dark:text-gray-400">
              Design canvas preview
            </p>
          </main>

          {/* Right sidebar */}
          <aside className="bg-[#f9fafb] p-4 dark:bg-[#151d2b] lg:border-l lg:border-gray-200 dark:lg:border-white/10">
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                  Layers
                </h3>

                <Layers3 className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              </div>

              <div className="space-y-2">
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
                        onChange={(event) =>
                          updateLayerName(id, event.target.value)
                        }
                        className="min-w-0 flex-1 rounded px-1 py-1 text-xs font-medium text-gray-700 outline-none transition focus:bg-blue-50 focus:ring-1 focus:ring-[#244074]/40 dark:text-gray-200 dark:focus:bg-[#244074]/20"
                        placeholder="Layer name"
                      />

                      {/* Change front-to-back stacking order */}
                      <div className="flex shrink-0 flex-col">
                        <button
                          type="button"
                          onClick={() => moveLayer(id, "up")}
                          disabled={
                            layers.findIndex((layer) => layer.id === id) === 0
                          }
                          aria-label={`Bring ${name} forward`}
                          title="Bring forward"
                          className="rounded p-0.5 text-gray-500 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30 dark:text-gray-400 dark:hover:bg-white/10"
                        >
                          <ChevronUp className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveLayer(id, "down")}
                          disabled={
                            layers.findIndex((layer) => layer.id === id) ===
                            layers.length - 1
                          }
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
              </div>
            </div>

            <div className="my-5 border-t border-gray-200 dark:border-white/10" />

            {/* Properties */}
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

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="font-size"
                    className="mb-2 block text-xs font-medium text-gray-700 dark:text-gray-300"
                  >
                    Font size
                  </label>

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

                    <span>{selectedLayerInfo?.fontSize ?? 16} px</span>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="opacity"
                    className="mb-2 block text-xs font-medium text-gray-700 dark:text-gray-300"
                  >
                    Opacity
                  </label>

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

                    <span>{selectedLayerInfo?.opacity ?? 100}%</span>
                  </div>
                </div>

                <div className="rounded-lg border border-dashed border-gray-300 p-3 dark:border-white/15">
                  <div className="flex items-start gap-2">
                    <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#244074] dark:text-[#7ba2e3]" />

                    <div>
                      <p className="text-xs font-semibold text-gray-800 dark:text-gray-100">
                        Design tip
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                        Keep your offer headline bold and your discount easy to
                        read.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
