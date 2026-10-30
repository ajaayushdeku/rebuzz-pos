"use client";

import { useEffect, useRef, useState } from "react";
import { toPng } from "html-to-image";
import {
  initialLayers,
  canvasPresets,
  designTemplates,
} from "@/components/design-studio/contents";

import type {
  DesignLayer,
  DesignTemplate,
  LayerType,
  ShapeType,
} from "@/components/design-studio/contents";
import {
  Download,
  ImageIcon,
  ImagePlus,
  LayoutTemplate,
  Menu,
  PanelRight,
  PanelsTopLeft,
  Plus,
  RectangleHorizontal,
  Shapes,
  Type,
  X,
} from "lucide-react";
import PropertiesPanel from "./PropertiesPanel";
import LayersPanel from "./LayersPanel";
import DesignCanvas from "./DesignCanvas";
import LeftSidebar from "./LeftSidebar";

function normalizeExportColors(element: HTMLElement) {
  const elements = [
    element,
    ...Array.from(element.querySelectorAll<HTMLElement>("*")),
  ];

  const colorProperties = [
    "color",
    "background-color",
    "border-top-color",
    "border-right-color",
    "border-bottom-color",
    "border-left-color",
    "outline-color",
    "text-decoration-color",
    "fill",
    "stroke",
  ];

  elements.forEach((el) => {
    const computed = window.getComputedStyle(el);

    colorProperties.forEach((property) => {
      const value = computed.getPropertyValue(property);

      if (/\b(?:lab|lch|oklab|oklch)\(/i.test(value)) {
        const temp = document.createElement("div");
        temp.style.color = value;
        document.body.appendChild(temp);

        const rgb = window.getComputedStyle(temp).color;
        temp.remove();

        el.style.setProperty(property, rgb, "important");
      }
    });
  });
}

const designTools = [
  { label: "Templates", icon: LayoutTemplate },
  { label: "Canvas", icon: PanelsTopLeft },
  { label: "Text", icon: Type },
  { label: "Images", icon: ImageIcon },
  { label: "Banner", icon: RectangleHorizontal },
  { label: "Shapes", icon: Shapes },
];

export default function DesignStudio() {
  // 1. Shared state
  const [isExporting, setIsExporting] = useState(false);
  const [alignmentGuides, setAlignmentGuides] = useState({
    vertical: false,
    horizontal: false,
  });

  const [isCanvasFocused, setIsCanvasFocused] = useState(false);

  const [activeTool, setActiveTool] = useState("select");
  const [layers, setLayers] = useState<DesignLayer[]>(initialLayers);
  const [selectedLayer, setSelectedLayer] = useState(
    initialLayers[0]?.id ?? "",
  );

  const [canvasSize, setCanvasSize] = useState("instagram-post");
  const [selectedShapeType, setSelectedShapeType] =
    useState<ShapeType>("rectangle");

  const [shapeFillColor, setShapeFillColor] = useState("#244074");
  const [shapeOpacity, setShapeOpacity] = useState(100);
  const [templateCategory, setTemplateCategory] = useState("All");

  // 2. References
  const imageInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const dragRef = useRef<{
    id: string;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);

  const selectedLayerInfo = layers.find((layer) => layer.id === selectedLayer);

  // const [selectedLayerId, setSelectedLayerId] = useState<string | null>(
  //   initialLayers[0]?.id ?? null,
  // );

  const selectedShape = layers.find(
    (layer) => layer.id === selectedLayer && layer.type === "shape",
  );

  const selectedShapeColor =
    selectedShape?.backgroundColor ?? selectedShape?.color ?? shapeFillColor;

  const selectedShapeOpacity = selectedShape?.opacity ?? shapeOpacity;

  const selectedPreset =
    canvasPresets.find((preset) => preset.id === canvasSize) ??
    canvasPresets[0];

  const filteredTemplates = designTemplates.filter(
    (template) =>
      templateCategory === "All" || template.category === templateCategory,
  );

  useEffect(() => {
    const handleOutsideClick = (event: PointerEvent) => {
      const canvas = canvasRef.current;
      const target = event.target;

      if (!canvas || !(target instanceof Node)) return;

      // If the click is outside the actual canvas, deselect.
      if (!canvas.contains(target)) {
        // setSelectedLayer("");
        setIsCanvasFocused(false);
      }
    };

    document.addEventListener("pointerdown", handleOutsideClick);

    return () => {
      document.removeEventListener("pointerdown", handleOutsideClick);
    };
  }, []);

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
      //   fontSize: 24,
      //   opacity: 100,
      //   content: type === "text" ? "New Text" : "",
      //   color: "#202a3d",
      //   backgroundColor: type === "shape" ? "#e5e7eb" : undefined,
      x: 100,
      y: 100,
      width: 400,
      height: type === "banner" ? 400 : 100,
      rotation: 0,

      fontSize: type === "banner" ? 28 : 24,
      opacity: 100,

      content:
        type === "text" ? "New Text" : type === "banner" ? "SPECIAL OFFER" : "",

      color: type === "banner" ? "#ffffff" : "#202a3d",

      backgroundColor:
        type === "shape"
          ? "#e5e7eb"
          : type === "banner"
            ? "#244074"
            : undefined,

      // Banner defaults
      subtitle: type === "banner" ? "Limited time only" : undefined,
      borderRadius: type === "banner" ? 12 : undefined,
      padding: type === "banner" ? 16 : undefined,
      borderColor: type === "banner" ? "#244074" : undefined,
      borderWidth: 0,

      fontFamily: type === "banner" ? "Arial" : undefined,
      fontWeight: type === "banner" ? 700 : 400,
      textAlign: type === "banner" ? "center" : "left",

      buttonText: type === "banner" ? "SHOP NOW" : undefined,
      buttonAlignment: "center",
      buttonWidth: 140,
      buttonHeight: 42,
      buttonFontSize: 14,
      buttonPaddingX: 20,
      buttonPaddingY: 10,
      buttonBackgroundColor: "#ffffff",
      buttonColor: "#244074",
      buttonBorderRadius: 8,
    };

    setLayers((previous) => [newLayer, ...previous]);
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

  const addShape = (shapeType: ShapeType) => {
    const shapeNames: Record<ShapeType, string> = {
      rectangle: "Rectangle",
      "rounded-rectangle": "Rounded Rectangle",
      circle: "Circle",
      line: "Line",
      triangle: "Triangle",
      diamond: "Diamond",
      pentagon: "Pentagon",
      hexagon: "Hexagon",
      star: "Star",
      arrow: "Arrow",
    };

    const newShape: DesignLayer = {
      id: crypto.randomUUID(),
      name: shapeNames[shapeType] ?? "Shape",
      type: "shape",
      shapeType,
      icon: Shapes,
      visible: true,
      x: 35,
      y: 35,
      width: shapeType === "line" ? 30 : 25,
      height: shapeType === "line" ? 1 : 20,
      color: shapeFillColor,
      backgroundColor: shapeFillColor,
      fillEnabled: false,
      strokeWidth: 2,
      opacity: shapeOpacity,
      fontSize: 16,
      content: "",
      rotation: 0,
    };
    setLayers((previous) => [newShape, ...previous]);
    setSelectedLayer(newShape.id);
  };

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
      rotation: 0,
    };

    setLayers((previous) => [newLayer, ...previous]);
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
    setIsCanvasFocused(true);

    setAlignmentGuides({
      vertical: false,
      horizontal: false,
    });

    dragRef.current = {
      id: layer.id,
      startX: event.clientX,
      startY: event.clientY,
      originX: layer.x,
      originY: layer.y,
    };
  };

  // const handleLayerPointerMove = (
  //   event: React.PointerEvent<HTMLDivElement>,
  // ) => {
  //   const drag = dragRef.current;
  //   const canvas = canvasRef.current;

  //   if (!drag || !canvas) return;

  //   const rect = canvas.getBoundingClientRect();

  //   // Convert screen movement into canvas design coordinates.
  //   const deltaX =
  //     ((event.clientX - drag.startX) / rect.width) * selectedPreset.width;

  //   const deltaY =
  //     ((event.clientY - drag.startY) / rect.height) * selectedPreset.height;

  //   setLayers((previous) =>
  //     previous.map((layer) =>
  //       layer.id === drag.id
  //         ? {
  //             ...layer,
  //             // x: Math.max(
  //             //   0,
  //             //   Math.min(
  //             //     selectedPreset.width - layer.width,
  //             //     drag.originX + deltaX,
  //             //   ),
  //             // ),
  //             x: drag.originX + deltaX,
  //             // y: Math.max(
  //             //   0,
  //             //   Math.min(
  //             //     selectedPreset.height - layer.height,
  //             //     drag.originY + deltaY,
  //             //   ),
  //             // ),
  //             y: drag.originY + deltaY,
  //           }
  //         : layer,
  //     ),
  //   );
  // };

  const handleLayerPointerMove = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    const drag = dragRef.current;
    const canvas = canvasRef.current;

    if (!drag || !canvas) return;

    const rect = canvas.getBoundingClientRect();

    const draggedLayer = layers.find((layer) => layer.id === drag.id);

    if (!draggedLayer) return;

    // Convert screen movement into canvas design coordinates.
    const deltaX =
      ((event.clientX - drag.startX) / rect.width) * selectedPreset.width;

    const deltaY =
      ((event.clientY - drag.startY) / rect.height) * selectedPreset.height;

    // Calculate the element's new position.
    let newX = drag.originX + deltaX;
    let newY = drag.originY + deltaY;

    // Convert the 8px screen tolerance into design coordinates.
    const snapToleranceX = (8 / rect.width) * selectedPreset.width;
    const snapToleranceY = (8 / rect.height) * selectedPreset.height;

    const layerWidth = draggedLayer.width;
    const layerHeight = draggedLayer.height ?? 100;

    // Calculate the center of the canvas.
    const canvasCenterX = selectedPreset.width / 2;
    const canvasCenterY = selectedPreset.height / 2;

    // Calculate the center of the dragged element.
    const layerCenterX = newX + layerWidth / 2;
    const layerCenterY = newY + layerHeight / 2;

    // Check whether the element is close enough to the vertical center.
    const verticalSnap =
      Math.abs(layerCenterX - canvasCenterX) <= snapToleranceX;

    // Check whether the element is close enough to the horizontal center.
    const horizontalSnap =
      Math.abs(layerCenterY - canvasCenterY) <= snapToleranceY;

    // Snap the element to the canvas center.
    if (verticalSnap) {
      newX = canvasCenterX - layerWidth / 2;
    }

    if (horizontalSnap) {
      newY = canvasCenterY - layerHeight / 2;
    }

    // Update the visible alignment guides.
    setAlignmentGuides({
      vertical: verticalSnap,
      horizontal: horizontalSnap,
    });

    // Update the dragged layer.
    setLayers((previous) =>
      previous.map((layer) =>
        layer.id === drag.id
          ? {
              ...layer,
              x: newX,
              y: newY,
            }
          : layer,
      ),
    );
  };

  const handleLayerPointerUp = () => {
    dragRef.current = null;

    setAlignmentGuides({
      vertical: false,
      horizontal: false,
    });
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

  const [leftSidebarOpen, setLeftSidebarOpen] = useState(false);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);

  useEffect(() => {
    if (!leftSidebarOpen && !rightSidebarOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setLeftSidebarOpen(false);
        setRightSidebarOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [leftSidebarOpen, rightSidebarOpen]);

  const handleImageUploadRef = () => {
    imageInputRef.current?.click();
  };

  const handleExport = async () => {
    const canvasElement = canvasRef.current;

    if (!canvasElement || isExporting) return;

    const selectedLayers = Array.from(
      canvasElement.querySelectorAll(".selected-design-layer"),
    );

    try {
      setIsExporting(true);

      await document.fonts.ready;

      const rect = canvasElement.getBoundingClientRect();

      if (!rect.width || !rect.height) {
        throw new Error("Canvas has invalid dimensions.");
      }

      // Temporarily remove editor selection outlines.
      selectedLayers.forEach((element) => {
        element.classList.remove("selected-design-layer");
      });

      const scale = selectedPreset.width / rect.width;

      const dataUrl = await toPng(canvasElement, {
        pixelRatio: scale,
        backgroundColor: "#ffffff",
        cacheBust: true,

        filter: (node) => {
          return !(
            node instanceof HTMLElement && node.dataset.exportIgnore === "true"
          );
        },

        style: {
          width: `${rect.width}px`,
          height: `${rect.height}px`,
          overflow: "hidden",
        },
      });

      // Download the generated image.
      const link = document.createElement("a");

      link.download = `rebuzz-design-${selectedPreset.width}x${selectedPreset.height}.png`;
      link.href = dataUrl;

      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Failed to export design:", error);
    } finally {
      // Restore the selection outlines.
      selectedLayers.forEach((element) => {
        element.classList.add("selected-design-layer");
      });

      setIsExporting(false);
    }
  };

  const handleLayerSelect = (id: string) => {
    setSelectedLayer(id);
    setIsCanvasFocused(true);
  };

  return (
    <div className="min-h-full mx-auto w-full bg-surface-page pt-4 dark:bg-[#0f1420] sm:pt-6">
      {/* Top toolbar */}
      <div className="flex flex-col gap-4 border-b border-gray-200 px-5 pb-5 dark:border-white/10">
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
              onClick={() => imageInputRef.current?.click()}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-xs font-semibold text-gray-700 transition hover:border-[#244074] hover:bg-blue-50 hover:text-[#244074] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#244074] dark:border-white/10 dark:bg-[#151d2b] dark:text-gray-200 dark:hover:border-[#7ba2e3] dark:hover:bg-[#244074]/20 dark:hover:text-blue-200"
            >
              <Plus className="h-4 w-4" />
              <ImagePlus className="hidden h-4 w-4 sm:block" />
              Image
            </button>

            <button
              type="button"
              onClick={handleExport}
              disabled={isExporting}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Download size={16} />
              {isExporting ? "Exporting..." : "Export"}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile sidebar controls */}
      <div className="flex items-center justify-between gap-3 border-b border-gray-200 bg-white px-3 py-2 dark:border-white/10 dark:bg-[#111827] lg:hidden">
        <button
          type="button"
          onClick={() => {
            setRightSidebarOpen(false);
            setLeftSidebarOpen(true);
          }}
          aria-expanded={leftSidebarOpen}
          aria-label="Open design tools"
          className="inline-flex items-center gap-2 rounded-md border border-gray-200 px-2.5 py-1.5 text-[13px] font-medium text-gray-700 cursor-pointer transition hover:bg-gray-100 dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/5"
        >
          <Menu className="h-3.5 w-3.5" />
          Tools
        </button>

        <button
          type="button"
          onClick={() => {
            setLeftSidebarOpen(false);
            setRightSidebarOpen(true);
          }}
          aria-expanded={rightSidebarOpen}
          aria-label="Open layers and properties"
          className="inline-flex items-center gap-2 rounded-md border border-gray-200 px-2.5 py-1.5 text-[13px] font-medium text-gray-700 cursor-pointer transition hover:bg-gray-100 dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/5"
        >
          <PanelRight className="h-3.5 w-3.5" />
          Layers
        </button>
      </div>

      {/* Design studio workspace */}
      <div className="relative grid min-h-[calc(100vh-64px)] grid-cols-1 overflow-x-clip lg:grid-cols-[300px_minmax(0,1fr)_320px]">
        {/* Mobile backdrop */}
        {(leftSidebarOpen || rightSidebarOpen) && (
          <button
            type="button"
            aria-label="Close sidebar"
            onClick={() => {
              setLeftSidebarOpen(false);
              setRightSidebarOpen(false);
            }}
            className="absolute inset-0 z-30 bg-black/40 backdrop-blur-[1px] lg:hidden"
          />
        )}

        {/* Left sidebar drawer */}
        <aside
          className={`absolute inset-y-0 left-0 z-40 w-[min(85vw,320px)] overflow-y-auto scrollbar-hide border-r border-gray-200 bg-white shadow-xl transition-transform duration-300 ease-in-out dark:border-white/10 dark:bg-[#111827] lg:relative lg:z-auto lg:w-auto lg:translate-x-0 lg:overflow-visible lg:shadow-none ${
            leftSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-[#111827] lg:hidden">
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Design Tools
            </span>

            <button
              type="button"
              onClick={() => setLeftSidebarOpen(false)}
              aria-label="Close design tools"
              className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 dark:hover:bg-white/10"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <LeftSidebar
            designTools={designTools}
            activeTool={activeTool}
            setActiveTool={setActiveTool}
            addLayer={addLayer}
            filteredTemplates={filteredTemplates}
            applyTemplate={applyTemplate}
            canvasSize={canvasSize}
            setCanvasSize={setCanvasSize}
            selectedShapeType={selectedShapeType}
            setSelectedShapeType={setSelectedShapeType}
            addShape={addShape}
            shapeFillColor={shapeFillColor}
            setShapeFillColor={setShapeFillColor}
            selectedShapeColor={selectedShapeColor}
            selectedShape={selectedShape}
            selectedShapeOpacity={selectedShapeOpacity}
            setShapeOpacity={setShapeOpacity}
            selectedPreset={selectedPreset}
            setLayers={setLayers}
            handleImageUpload={handleImageUploadRef}
          />
        </aside>

        {/* Center canvas */}
        <div className="min-w-0">
          <DesignCanvas
            layers={layers}
            selectedLayer={selectedLayer}
            isCanvasFocused={isCanvasFocused}
            setSelectedLayer={setSelectedLayer}
            canvasWidth={selectedPreset.width}
            canvasHeight={selectedPreset.height}
            canvasRef={canvasRef}
            onLayerPointerDown={handleLayerPointerDown}
            onLayerPointerMove={handleLayerPointerMove}
            onLayerPointerUp={handleLayerPointerUp}
            alignmentGuides={alignmentGuides}
          />
        </div>

        {/* Right sidebar drawer */}
        <aside
          className={`absolute inset-y-0 right-0 z-40 w-[min(88vw,360px)] overflow-y-auto scrollbar-hide border-l border-gray-200 bg-white p-4 shadow-xl transition-transform duration-300 ease-in-out dark:border-white/10 dark:bg-[#111827] lg:relative lg:z-auto lg:w-auto lg:translate-x-0 lg:overflow-visible lg:shadow-none ${
            rightSidebarOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="-mx-4 -mt-4 mb-4 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-[#111827] lg:hidden">
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Layers & Properties
            </span>

            <button
              type="button"
              onClick={() => setRightSidebarOpen(false)}
              aria-label="Close layers and properties"
              className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 dark:hover:bg-white/10"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-6 ">
            <LayersPanel
              layers={layers}
              selectedLayer={selectedLayer}
              // setSelectedLayer={setSelectedLayer}
              setSelectedLayer={handleLayerSelect}
              setLayers={setLayers}
              updateLayerName={updateLayerName}
              moveLayer={moveLayer}
              deleteLayer={deleteLayer}
            />

            <PropertiesPanel
              selectedLayerInfo={selectedLayerInfo}
              selectedShape={selectedShape}
              selectedShapeColor={selectedShapeColor}
              selectedPreset={selectedPreset}
              updateSelectedLayer={updateSelectedLayer}
              setLayers={setLayers}
              setShapeFillColor={setShapeFillColor}
            />
          </div>
        </aside>
      </div>

      {/* Hidden image upload input */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
      />
    </div>
  );
}
