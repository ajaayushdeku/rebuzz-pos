import {
  ShoppingBag,
  PartyPopper,
  Utensils,
  Megaphone,
} from "lucide-react";

export const designTabs = [
  { id: "create", label: "Create Design" },
  { id: "designs", label: "My Designs" },
  { id: "settings", label: "AI Settings" },
] as const;

export const examplePrompts = [
  {
    title: "Festival offer",
    description: "Create a festive promotional poster",
    icon: PartyPopper,
    prompt:
      "Create a Dashain promotional poster for my clothing store. Include 30% off on selected items. Use a festive red and gold theme.",
  },
  {
    title: "Product promotion",
    description: "Showcase a new product",
    icon: ShoppingBag,
    prompt:
      "Create a modern product promotion for our new sneaker collection. Use a clean background and bold typography.",
  },
  {
    title: "Restaurant offer",
    description: "Promote a special food deal",
    icon: Utensils,
    prompt:
      "Create a social media poster for our restaurant. Promote a 20% discount on all family meals this weekend.",
  },
  {
    title: "Announcement",
    description: "Share business announcements",
    icon: Megaphone,
    prompt:
      "Create a grand opening announcement for our new store. Make it modern, attractive, and suitable for Instagram.",
  },
];

export const instructionSteps = [
  {
    number: "01",
    title: "Describe your idea",
    description:
      "Tell the AI what you want to create. Include your product, promotion, important text, or campaign details.",
  },
  {
    number: "02",
    title: "Add more details",
    description:
      "Answer any follow-up questions about colors, design style, format, or reference images.",
  },
  {
    number: "03",
    title: "Generate your design",
    description:
      "The AI transforms your instructions into a complete promotional graphic.",
  },
  {
    number: "04",
    title: "Download and share",
    description:
      "Download your graphic, save it to My Designs, or ask AI to improve it.",
  },
];

export const demoDesigns = [
  {
    id: "design-1",
    title: "Dashain Mega Offer",
    category: "Festival",
    date: "Oct 18, 2026",
    discount: "30% OFF",
    subtitle: "FESTIVE SEASON SALE",
    background: "from-red-950 via-red-800 to-amber-600",
    accent: "text-amber-300",
  },
  {
    id: "design-2",
    title: "New Collection",
    category: "Product",
    date: "Oct 15, 2026",
    discount: "NEW",
    subtitle: "EXPLORE THE COLLECTION",
    background: "from-slate-950 via-slate-800 to-slate-600",
    accent: "text-white",
  },
  {
    id: "design-3",
    title: "Weekend Food Deal",
    category: "Restaurant",
    date: "Oct 12, 2026",
    discount: "20% OFF",
    subtitle: "A TASTE WORTH SHARING",
    background: "from-orange-950 via-orange-800 to-yellow-600",
    accent: "text-yellow-200",
  },
];