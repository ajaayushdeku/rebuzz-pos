"use client";

import {
  baseScenario,
  defaultAdjustments,
  sliderConfig,
  ScenarioAdjustments,
} from "@/lib/mockData/mock-whatifscenario";
import { useMemo, useState } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import LockDimFeactureOverlay from "@/components/LockDimFeactureOverlay";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export default function WhatIfScenarioPlanner() {
  const { currency } = useCurrency();
  const [adjustments, setAdjustments] =
    useState<ScenarioAdjustments>(defaultAdjustments);

  const handleChange = (key: keyof ScenarioAdjustments, value: number) => {
    setAdjustments((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const reset = () => setAdjustments(defaultAdjustments);

  const projected = useMemo(() => {
    const priceFactor = 1 + adjustments.priceAdjustment / 100;
    const volumeFactor = 1 + adjustments.volumeAdjustment / 100;
    const cogsFactor = 1 + adjustments.cogsAdjustment / 100;
    const laborFactor = 1 + adjustments.laborAdjustment / 100;

    const revenue = baseScenario.revenue * priceFactor * volumeFactor;

    const cogs = baseScenario.cogs * cogsFactor;
    const labor = baseScenario.labor * laborFactor;
    const fixed = baseScenario.fixedCosts;

    const profit = revenue - (cogs + labor + fixed);

    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

    const orders = Math.round(baseScenario.orders * volumeFactor);

    return {
      revenue,
      cogs,
      labor,
      fixed,
      profit,
      margin,
      orders,
    };
  }, [adjustments]);

  const baselineProfit =
    baseScenario.revenue -
    (baseScenario.cogs + baseScenario.labor + baseScenario.fixedCosts);
  const marginChange =
    projected.margin - (baselineProfit / baseScenario.revenue) * 100;

  return (
    <div className="bg-slate-50 rounded-2xl border border-gray-200 shadow-sm p-4 md:p-6 w-full relative select-none mt-4">
      {/* Lock overlay */}
      <LockDimFeactureOverlay />

      {/* Header */}
      <div className="mb-6">
        <h2 className="text-base md:text-lg font-semibold text-gray-900 tracking-tight">
          What-If Scenario Planner
        </h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Adjust sliders to forecast profit impact
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sliders Section */}
        <div className="flex-1 space-y-6">
          {sliderConfig.map((slider) => {
            const value = adjustments[slider.key as keyof ScenarioAdjustments];
            const isPositive = value > 0;
            const isNegative = value < 0;
            // For cost sliders (COGS, Labor), invert colors: right = more cost = red, left = less cost = green
            const isCostSlider =
              slider.key === "cogsAdjustment" ||
              slider.key === "laborAdjustment";
            const goodColor = isCostSlider
              ? isNegative
                ? "text-green-600"
                : isPositive
                  ? "text-red-600"
                  : "text-gray-900"
              : isPositive
                ? "text-green-600"
                : isNegative
                  ? "text-red-600"
                  : "text-gray-900";

            return (
              <div key={slider.key}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    {slider.label}
                  </span>
                  <span className={`text-sm font-semibold ${goodColor}`}>
                    {isPositive ? "+" : ""}
                    {value}
                    {slider.suffix}
                  </span>
                </div>

                <div className="relative">
                  <input
                    type="range"
                    min={slider.min}
                    max={slider.max}
                    step={slider.step}
                    value={value}
                    onChange={(e) =>
                      handleChange(
                        slider.key as keyof ScenarioAdjustments,
                        Number(e.target.value),
                      )
                    }
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>

                {/* <div className="flex justify-between text-xs text-gray-400 mt-1.5">
                  <span>
                    {slider.min}
                    {slider.suffix}
                  </span>
                  <span>
                    {slider.max}
                    {slider.suffix}
                  </span>
                </div> */}
              </div>
            );
          })}

          <button
            onClick={reset}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium mt-4"
          >
            Reset All Sliders
          </button>
        </div>

        {/* Projected Profit Card */}
        <div className="lg:w-80">
          <div className="bg-slate-900 rounded-xl p-6 text-white">
            <div className="mb-6">
              <p className="text-xs text-gray-400 mb-1">Projected Net Profit</p>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold">
                  {formatCurrencySymbol(
                    projected.profit,
                    currency.symbol,
                    currency.locale,
                  )}
                </p>
                {projected.profit !== baselineProfit && (
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                      projected.profit > baselineProfit
                        ? "bg-green-500/20 text-green-400"
                        : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {projected.profit > baselineProfit ? (
                      <TrendingUp size={12} />
                    ) : (
                      <TrendingDown size={12} />
                    )}
                    {projected.profit > baselineProfit ? "+" : ""}
                    {formatCurrencySymbol(
                      Math.abs(projected.profit - baselineProfit),
                      currency.symbol,
                      currency.locale,
                    )}
                  </span>
                )}
              </div>
            </div>

            <div className="mb-6">
              <p className="text-xs text-gray-400 mb-1">Projected Margin</p>
              <div className="flex items-center gap-2">
                <p className="text-3xl font-bold">
                  {projected.margin.toFixed(1)}%
                </p>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                    marginChange >= 0
                      ? "bg-green-500/20 text-green-400"
                      : "bg-red-500/20 text-red-400"
                  }`}
                >
                  {marginChange >= 0 ? (
                    <TrendingUp size={12} />
                  ) : (
                    <TrendingDown size={12} />
                  )}
                  {marginChange >= 0 ? "+" : ""}
                  {marginChange.toFixed(1)}%
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-700">
              <div className="flex justify-between items-center mb-2">
                <p className="text-[10px] text-gray-500 uppercase tracking-wide">
                  Baseline:{" "}
                  {formatCurrencySymbol(
                    baselineProfit,
                    currency.symbol,
                    currency.locale,
                  )}
                </p>
                <p className="text-[10px] text-gray-500 uppercase tracking-wide">
                  New:{" "}
                  {formatCurrencySymbol(
                    projected.profit,
                    currency.symbol,
                    currency.locale,
                  )}
                </p>
              </div>
              <div className="relative h-2 bg-gray-700 rounded-full overflow-hidden">
                {/* Calculate scale max */}
                {(() => {
                  const maxValue = Math.max(
                    baselineProfit,
                    projected.profit,
                    baselineProfit * 1.2,
                    1,
                  );
                  const baselineWidth = (baselineProfit / maxValue) * 100;
                  const changeWidth =
                    (Math.abs(projected.profit - baselineProfit) / maxValue) *
                    100;
                  const changeLeft =
                    (Math.min(baselineProfit, projected.profit) / maxValue) *
                    100;

                  return (
                    <>
                      {/* Baseline fill (gray) - from 0 to baseline */}
                      <div
                        className="absolute top-0 bottom-0 bg-gray-500"
                        style={{
                          left: "0%",
                          width: `${baselineWidth}%`,
                        }}
                      />
                      {/* Change fill (green/red) - from baseline to new value */}
                      {projected.profit !== baselineProfit && (
                        <div
                          className={`absolute top-0 bottom-0 ${
                            projected.profit > baselineProfit
                              ? "bg-green-500"
                              : "bg-red-500"
                          }`}
                          style={{
                            left: `${changeLeft}%`,
                            width: `${changeWidth}%`,
                          }}
                        />
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
