"use client";

import type { RefObject, PointerEvent } from "react";
import type {
  DesignLayer,
  ShapeType,
} from "@/components/design-studio/contents";

function getShapePoints(shapeType: ShapeType): string {
  switch (shapeType) {
    case "triangle":
      return "50,3 97,97 3,97";

    case "diamond":
      return "50,2 98,50 50,98 2,50";

    case "pentagon":
      return "50,2 98,37 80,95 20,95 2,37";

    case "hexagon":
      return "25,3 75,3 98,50 75,97 25,97 2,50";

    case "star":
      return "50,2 61,35 98,35 68,56 79,94 50,71 21,94 32,56 2,35 39,35";

    case "arrow":
      return "2,35 65,35 65,10 98,50 65,90 65,65 2,65";

    default:
      return "";
  }
}

interface DesignCanvasProps {
  layers: DesignLayer[];
  selectedLayer: string;
  setSelectedLayer: (id: string) => void;
  canvasWidth: number;
  canvasHeight: number;
  canvasRef: RefObject<HTMLDivElement | null>;
  onLayerPointerDown: (
    event: PointerEvent<HTMLDivElement>,
    layer: DesignLayer,
  ) => void;
  onLayerPointerMove: (event: PointerEvent<HTMLDivElement>) => void;
  onLayerPointerUp: () => void;
}

export default function DesignCanvas({
  layers,
  selectedLayer,
  setSelectedLayer,
  canvasWidth,
  canvasHeight,
  canvasRef,
  onLayerPointerDown,
  onLayerPointerMove,
  onLayerPointerUp,
}: DesignCanvasProps) {
  return (
    <main className="flex min-w-0 flex-col items-center justify-center bg-[#e7eaf0] p-5 sm:p-14 dark:bg-[#202838]">
      <div className="flex min-h-[360px] w-full items-center justify-center overflow-hidden rounded-lg sm:min-h-[440px]">
        <div
          ref={canvasRef}
          className="relative flex w-full max-w-[460px] flex-col items-center justify-center overflow-hidden bg-white px-5 text-center shadow-sm"
          style={{
            aspectRatio: `${canvasWidth} / ${canvasHeight}`,
          }}
        >
          {layers.map((layer, index) => {
            if (!layer.visible) return null;

            return (
              <div
                key={layer.id}
                onPointerDown={(event) => onLayerPointerDown(event, layer)}
                onPointerMove={onLayerPointerMove}
                onPointerUp={onLayerPointerUp}
                onPointerCancel={onLayerPointerUp}
                className={`absolute cursor-move touch-none ${
                  selectedLayer === layer.id
                    ? "outline outline-2 outline-blue-500"
                    : ""
                }`}
                style={{
                  left: `${(layer.x / canvasWidth) * 100}%`,
                  top: `${(layer.y / canvasHeight) * 100}%`,
                  width: `${(layer.width / canvasWidth) * 100}%`,
                  height:
                    layer.type === "shape" || layer.type === "banner"
                      ? `${((layer.height ?? 100) / canvasHeight) * 100}%`
                      : undefined,
                  minHeight: layer.type === "image" ? undefined : "1px",
                  opacity: (layer.opacity ?? 100) / 100,
                  zIndex: layers.length - index,
                  transform: `rotate(${layer.rotation ?? 0}deg)`,
                  transformOrigin: "center center",
                }}
              >
                {(() => {
                  switch (layer.type) {
                    case "text":
                      return (
                        <p
                          onClick={() => setSelectedLayer(layer.id)}
                          // style={{
                          //   fontSize: `${layer.fontSize}px`,
                          //   color: layer.color ?? "#202a3d",

                          // }}
                          style={{
                            fontFamily: layer.fontFamily ?? "Arial",
                            fontSize: `${layer.fontSize ?? 16}px`,
                            fontWeight: layer.fontWeight ?? 400,
                            fontStyle: layer.fontStyle ?? "normal",
                            color: layer.color ?? "#111827",
                            textAlign: layer.textAlign ?? "left",
                            textDecoration: layer.textDecoration ?? "none",
                            lineHeight: layer.lineHeight ?? 1.2,
                            letterSpacing: `${layer.letterSpacing ?? 0}px`,
                            // opacity: (layer.opacity ?? 100) / 100,
                            // transform: `rotate(${layer.rotation ?? 0}deg)`,
                            // transformOrigin: "center center",
                          }}
                          className="cursor-pointer"
                        >
                          {layer.content}
                        </p>
                      );

                    case "banner":
                      return (
                        <div
                          onClick={() => setSelectedLayer(layer.id)}
                          className="flex h-full w-full flex-col items-center justify-center gap-1 overflow-hidden"
                          style={{
                            boxSizing: "border-box",
                            padding: `${layer.padding ?? 16}px`,
                            backgroundColor: layer.backgroundColor ?? "#244074",
                            color: layer.color ?? "#ffffff",
                            borderRadius: `${layer.borderRadius ?? 12}px`,
                            border: `${layer.borderWidth ?? 0}px solid ${
                              layer.borderColor ??
                              layer.backgroundColor ??
                              "#244074"
                            }`,
                            fontFamily: layer.fontFamily ?? "Arial",
                            textAlign: layer.textAlign ?? "center",
                          }}
                        >
                          <span
                            className="block w-full"
                            style={{
                              fontSize: `${layer.fontSize ?? 28}px`,
                              fontWeight: layer.fontWeight ?? 700,
                              lineHeight: 1.2,
                              overflowWrap: "break-word",
                            }}
                          >
                            {layer.content}
                          </span>

                          {layer.subtitle?.trim() && (
                            <span
                              className="block w-full"
                              style={{
                                fontSize: `${Math.max(10, (layer.fontSize ?? 28) * 0.55)}px`,
                                fontWeight: 400,
                                lineHeight: 1.3,
                                overflowWrap: "break-word",
                              }}
                            >
                              {layer.subtitle}
                            </span>
                          )}

                          {layer.buttonText?.trim() && (
                            <div
                              className="flex w-full shrink-0"
                              style={{
                                justifyContent:
                                  layer.buttonAlignment === "left"
                                    ? "flex-start"
                                    : layer.buttonAlignment === "right"
                                      ? "flex-end"
                                      : "center",
                              }}
                            >
                              <span
                                className="flex shrink-0 items-center justify-center overflow-hidden"
                                style={{
                                  boxSizing: "border-box",
                                  width: `${layer.buttonWidth ?? 140}px`,
                                  height: `${layer.buttonHeight ?? 42}px`,
                                  padding: `${layer.buttonPaddingY ?? 10}px ${
                                    layer.buttonPaddingX ?? 20
                                  }px`,
                                  backgroundColor:
                                    layer.buttonBackgroundColor ?? "#ffffff",
                                  color: layer.buttonColor ?? "#244074",
                                  borderRadius: `${layer.buttonBorderRadius ?? 8}px`,
                                  fontSize: `${layer.buttonFontSize ?? 14}px`,
                                  fontWeight: 700,
                                  lineHeight: 1,
                                  textAlign: "center",
                                  whiteSpace: "nowrap",
                                  textOverflow: "ellipsis",
                                }}
                              >
                                {layer.buttonText}
                              </span>
                            </div>
                          )}
                        </div>
                      );

                    case "image":
                      return (
                        <div
                          onClick={() => setSelectedLayer(layer.id)}
                          className={`relative z-10 cursor-pointer ${
                            selectedLayer === layer.id
                              ? "ring-2 ring-[#244074]"
                              : ""
                          }`}
                          style={{
                            width: "100%",
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

                    case "shape": {
                      const shapeType = layer.shapeType ?? "rectangle";
                      const fillEnabled = layer.fillEnabled ?? true;
                      const color =
                        layer.backgroundColor ?? layer.color ?? "#244074";
                      const strokeWidth = layer.strokeWidth ?? 2;
                      const points = getShapePoints(shapeType);

                      return (
                        <svg
                          viewBox="0 0 100 100"
                          preserveAspectRatio="none"
                          className="block h-full w-full overflow-visible"
                          style={{ display: "block" }}
                        >
                          {shapeType === "line" ? (
                            <line
                              x1="0"
                              y1="50"
                              x2="100"
                              y2="50"
                              stroke={color}
                              strokeWidth={strokeWidth}
                              vectorEffect="non-scaling-stroke"
                              strokeLinecap="round"
                            />
                          ) : shapeType === "circle" ? (
                            <ellipse
                              cx="50"
                              cy="50"
                              rx={50 - strokeWidth / 2}
                              ry={50 - strokeWidth / 2}
                              fill={fillEnabled ? color : "none"}
                              stroke={color}
                              strokeWidth={strokeWidth}
                              vectorEffect="non-scaling-stroke"
                            />
                          ) : points ? (
                            <polygon
                              points={points}
                              fill={fillEnabled ? color : "none"}
                              stroke={color}
                              strokeWidth={strokeWidth}
                              vectorEffect="non-scaling-stroke"
                              strokeLinejoin="round"
                            />
                          ) : (
                            <rect
                              x={strokeWidth / 2}
                              y={strokeWidth / 2}
                              width={100 - strokeWidth}
                              height={100 - strokeWidth}
                              rx={shapeType === "rounded-rectangle" ? 12 : 0}
                              fill={fillEnabled ? color : "none"}
                              stroke={color}
                              strokeWidth={strokeWidth}
                              vectorEffect="non-scaling-stroke"
                            />
                          )}
                        </svg>
                      );
                    }

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
  );
}
