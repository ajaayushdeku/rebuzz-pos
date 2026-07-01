// ── Target Tracker ────────────────────────────────────────────────────────

export type TargetPeriod = "daily" | "weekly" | "monthly";

export type TargetTrackerPeriod = {
  goal: number;
  actual: number;
  label: string; // e.g. "Weekly sales goal (this week)"
};

export type TargetTrackerData = {
  daily: TargetTrackerPeriod;
  weekly: TargetTrackerPeriod;
  monthly: TargetTrackerPeriod;
};

export const mockTargetTrackerData: TargetTrackerData = {
  daily: {
    goal: 13000,
    actual: 1200,
    label: "Daily sales goal (today)",
  },
  weekly: {
    goal: 28000,
    actual: 24800,
    label: "Weekly sales goal (this week)",
  },
  monthly: {
    goal: 120000,
    actual: 125000,
    label: "Monthly sales goal (this month)",
  },
};
