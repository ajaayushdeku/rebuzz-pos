import {
  FileText,
  CreditCard,
  BarChart2,
  Users,
  TrendingUp,
  HelpCircle,
} from "lucide-react";

export const STEPS = [
  { id: 1, label: "You" },
  { id: 2, label: "Business" },
  { id: 3, label: "Goals" },
] as const;

export const INDUSTRIES = [
  "Design & Creative",
  "Technology",
  "Consulting",
  "Retail",
  "Health & Wellness",
  "Education",
  "Food & Beverage",
  "Other",
];

export const BUSINESS_TYPES = [
  "Sole Proprietor",
  "LLC",
  "Corporation",
  "Partnership",
  "Non-Profit",
];

export const TEAM_SIZES = ["Just me", "2–5", "6–20", "20+"] as const;

export const GOALS = [
  { icon: FileText, label: "Send invoices" },
  { icon: CreditCard, label: "Accept payments" },
  { icon: BarChart2, label: "Track expenses" },
  { icon: Users, label: "Run payroll" },
  {
    icon: TrendingUp,
    label: "Financial reports",
  },
  { icon: HelpCircle, label: "Not sure yet" },
] as const;
