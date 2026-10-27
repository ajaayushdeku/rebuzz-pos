"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";

type SliderImage = {
  src: string;
  alt: string;
  title?: string;
};

type AiInsightsImageSliderProps = {
  images: SliderImage[];
  interval?: number;
};

export default function AiInsightsImageSlider({
  images,
  interval = 6000,
}: AiInsightsImageSliderProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState<"left" | "right">("right");
  const [isPlaying, setIsPlaying] = useState(true);

  const goTo = useCallback(
    (index: number, nextDirection: "left" | "right") => {
      setDirection(nextDirection);
      setActiveIndex((index + images.length) % images.length);
    },
    [images.length],
  );

  const next = useCallback(() => {
    goTo(activeIndex + 1, "right");
  }, [activeIndex, goTo]);

  const previous = useCallback(() => {
    goTo(activeIndex - 1, "left");
  }, [activeIndex, goTo]);

  useEffect(() => {
    if (!isPlaying || images.length <= 1) return;

    const timer = window.setInterval(() => {
      setDirection("right");
      setActiveIndex((current) => (current + 1) % images.length);
    }, interval);

    return () => window.clearInterval(timer);
  }, [images.length, interval, isPlaying]);

  if (images.length === 0) return null;

  const currentImage = images[activeIndex];

  return (
    <div className="w-full">
      <div className="group relative overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm dark:border-white/10 dark:bg-[#0f1420]">
        {/* Animated image */}
        {/* <div
          key={activeIndex}
          className={`relative mx-auto aspect-[16/9] w-full overflow-hidden rounded-xl ${
            direction === "right"
              ? "animate-slide-in-right"
              : "animate-slide-in-left"
          }`}
        >
          <Image
            src={currentImage.src}
            alt={currentImage.alt}
            fill
            priority={activeIndex === 0}
            sizes="(max-width: 768px) 100vw, 90vw"
            className="object-contain"
          />

          {currentImage.title && (
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent px-4 pb-4 pt-10 sm:px-5 sm:pb-5">
              <p className="text-sm font-semibold text-white sm:text-base">
                {currentImage.title}
              </p>
            </div>
          )}
        </div> */}

        <div className="flex items-center gap-1.5 border-b border-gray-200 bg-gray-50 px-4 py-2.5 dark:bg-white/5 dark:border-white/10">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
          <span className="ml-3 rounded-md bg-white px-2 py-0.5 text-[11px] text-gray-400 ring-1 ring-gray-200 dark:ring-white/20 dark:bg-[#0f1420] dark:text-[#7b869b]">
            manager.rebuzzpos.com/ai-insights
          </span>
        </div>

        {/* Animated image */}
        <div className="relative aspect-[16/9] w-full overflow-hidden">
          <div
            key={activeIndex}
            className={`absolute inset-0 ${
              direction === "right"
                ? "animate-slide-in-right"
                : "animate-slide-in-left"
            }`}
          >
            <Image
              src={currentImage.src}
              alt={currentImage.alt}
              fill
              priority={activeIndex === 0}
              sizes="(max-width: 768px) 100vw, 90vw"
              className="object-contain"
            />

            {currentImage.title && (
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent px-4 pb-4 pt-10 sm:px-5 sm:pb-5">
                <p className="text-sm font-semibold text-white sm:text-base">
                  {currentImage.title}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Previous */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={previous}
              aria-label="Previous image"
              className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-black/40 text-white shadow-md backdrop-blur-sm transition hover:scale-105 hover:bg-black/65 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <ChevronLeft size={22} />
            </button>

            {/* Next */}
            <button
              type="button"
              onClick={next}
              aria-label="Next image"
              className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-black/40 text-white shadow-md backdrop-blur-sm transition hover:scale-105 hover:bg-black/65 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <ChevronRight size={22} />
            </button>
          </>
        )}
      </div>

      {/* Controls */}
      <div className="mt-2 flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-gray-500 dark:text-[#9aa6bd]">
          {String(activeIndex + 1).padStart(2, "0")} /{" "}
          {String(images.length).padStart(2, "0")}
        </p>

        <div className="flex items-center gap-2">
          {images.map((image, index) => (
            <button
              key={`${image.src}-${index}`}
              type="button"
              onClick={() =>
                goTo(index, index >= activeIndex ? "right" : "left")
              }
              aria-label={`Show image ${index + 1}`}
              aria-current={index === activeIndex ? "true" : undefined}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === activeIndex
                  ? "w-7 bg-[#244074] dark:bg-[#7ba2e3]"
                  : "w-2 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500"
              }`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => setIsPlaying((playing) => !playing)}
          aria-label={isPlaying ? "Pause slideshow" : "Play slideshow"}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition hover:bg-gray-100 dark:border-white/10 dark:text-[#b5bfd1] dark:hover:bg-white/5"
        >
          {isPlaying ? <Pause size={16} /> : <Play size={16} />}
        </button>
      </div>
    </div>
  );
}
