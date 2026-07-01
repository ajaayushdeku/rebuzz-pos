// ── What's Coming Forecast ────────────────────────────────────────────────

export type ConfidenceLevel = "High" | "Likely" | "Moderate" | "Low";

export type ForecastDriver = {
  icon: string; // lucide icon name
  label: string;
  description: string;
  impact: number; // percent, positive or negative
};

export type ForecastData = {
  tomorrowForecast: number;
  tomorrowBaseline: number;
  weeklyProjection: number;
  weeklyBaseline: number;
  confidence: ConfidenceLevel;
  weeklyOutlook: string;
  drivers: ForecastDriver[];
};

export const mockForecastData: ForecastData = {
  tomorrowForecast: 4850,
  tomorrowBaseline: 4500,
  weeklyProjection: 32400,
  weeklyBaseline: 31000,
  confidence: "Likely",
  weeklyOutlook: "This week likely lands around $32,400",
  drivers: [
    {
      icon: "TrendingUp",
      label: "Friday spike",
      description:
        "Fridays average 15% higher than midweek baseline due to weekend traffic start",
      impact: 15,
    },
    {
      icon: "Sun",
      label: "Sunny weather",
      description:
        "Clear skies and warm temperatures boost outdoor patio usage and cold beverage sales",
      impact: 5,
    },
    {
      icon: "MapPin",
      label: "Farmers market",
      description:
        "Local farmers market on the street increases walking foot traffic",
      impact: 8,
    },
  ],
};
