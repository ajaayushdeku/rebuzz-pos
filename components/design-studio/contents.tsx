import {
  Type,
  Image as ImageIcon,
  CircleDollarSign,
  RectangleHorizontal,
  LucideIcon,
  Shapes,
} from "lucide-react";

export type LayerType = "text" | "image" | "shape" | "banner";

export type DesignLayer = {
  id: string;
  name: string;
  type: LayerType;
  icon: LucideIcon;
  visible: boolean;
  fontSize: number;
  opacity: number;
  content: string;
  color: string;
  backgroundColor?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  src?: string;
};

export type DesignTemplate = {
  id: string;
  name: string;
  category: string;
  thumbnail: string;
  canvasSize: string;
  width: number;
  height: number;
  layers: DesignLayer[];
};

export const initialLayers: DesignLayer[] = [
  {
    id: "background",
    name: "Background",
    type: "shape",
    visible: true,
    icon: Shapes,
    fontSize: 16,
    opacity: 100,
    content: "",
    color: "#ffffff",
    backgroundColor: "#fff7e6",
    x: 0,
    y: 0,
    width: 1080,
    height: 1080,
  },
  {
    id: "headline",
    name: "Headline",
    type: "text",
    visible: true,
    icon: Type,
    fontSize: 64,
    opacity: 100,
    content: "MEGA SALE",
    color: "#202a3d",
    x: 100,
    y: 200,
    width: 880,
    height: 100,
  },
  {
    id: "discount",
    name: "Discount",
    type: "text",
    visible: true,
    icon: Type,
    fontSize: 96,
    opacity: 100,
    content: "50% OFF",
    color: "#e63946",
    x: 100,
    y: 350,
    width: 880,
    height: 120,
  },
  {
    id: "banner",
    name: "Banner",
    type: "banner",
    visible: true,
    icon: ImageIcon,
    fontSize: 28,
    opacity: 100,
    content: "LIMITED TIME OFFER",
    color: "#ffffff",
    backgroundColor: "#244074",
    x: 150,
    y: 650,
    width: 780,
    height: 80,
  },
];

export const designTemplates: DesignTemplate[] = [
  {
    id: "mega-sale",
    name: "Mega Sale",
    category: "Offers",
    thumbnail: "/templates/mega-sale.png",
    canvasSize: "1080",
    width: 1080,
    height: 1080,
    layers: [
      {
        id: "bg",
        name: "Background",
        type: "shape",
        icon: ImageIcon,
        visible: true,
        fontSize: 16,
        opacity: 100,
        content: "",
        color: "#ffffff",
        backgroundColor: "#f8fafc",
        x: 0,
        y: 0,
        width: 1080,
        height: 1080,
      },
      {
        id: "headline",
        name: "Headline",
        type: "text",
        icon: Type,
        visible: true,
        fontSize: 88,
        opacity: 100,
        content: "MEGA SALE",
        color: "#202a3d",
        x: 100,
        y: 260,
        width: 880,
        height: 120,
      },
      {
        id: "discount",
        name: "Discount",
        type: "text",
        icon: CircleDollarSign,
        visible: true,
        fontSize: 64,
        opacity: 100,
        content: "30% OFF",
        color: "#f04444",
        x: 100,
        y: 410,
        width: 880,
        height: 100,
      },
      {
        id: "banner",
        name: "Banner",
        type: "banner",
        icon: RectangleHorizontal,
        visible: true,
        fontSize: 32,
        opacity: 100,
        content: "Limited-time offer",
        color: "#292929",
        backgroundColor: "#f6c653",
        x: 100,
        y: 570,
        width: 880,
        height: 90,
      },
    ],
  },
  {
    id: "minimal-promo",
    name: "Minimal Promo",
    category: "Offers",
    thumbnail: "/templates/minimal-promo.png",
    canvasSize: "1080",
    width: 1080,
    height: 1080,
    layers: [
      {
        id: "bg",
        name: "Background",
        type: "shape",
        icon: ImageIcon,
        visible: true,
        fontSize: 16,
        opacity: 100,
        content: "",
        color: "#ffffff",
        backgroundColor: "#e8f0ff",
        x: 0,
        y: 0,
        width: 1080,
        height: 1080,
      },
      {
        id: "headline",
        name: "Headline",
        type: "text",
        icon: Type,
        visible: true,
        fontSize: 72,
        opacity: 100,
        content: "SPECIAL OFFER",
        color: "#244074",
        x: 80,
        y: 300,
        width: 920,
        height: 110,
      },
      {
        id: "discount",
        name: "Discount",
        type: "text",
        icon: CircleDollarSign,
        visible: true,
        fontSize: 52,
        opacity: 100,
        content: "SAVE 20%",
        color: "#d94646",
        x: 80,
        y: 450,
        width: 920,
        height: 90,
      },
    ],
  },
];

export const canvasPresets = [
  {
    id: "1080",
    name: "Social Post",
    width: 1080,
    height: 1080,
    category: "Social Media",
  },
  {
    id: "instagram-portrait",
    name: "Instagram Portrait",
    width: 1080,
    height: 1350,
    category: "Social Media",
  },
  {
    id: "instagram-story",
    name: "Story / Reel",
    width: 1080,
    height: 1920,
    category: "Social Media",
  },
  {
    id: "facebook-cover",
    name: "Facebook Cover",
    width: 820,
    height: 312,
    category: "Social Media",
  },
  {
    id: "facebook-post",
    name: "Facebook Post",
    width: 1200,
    height: 630,
    category: "Social Media",
  },
  {
    id: "youtube-thumbnail",
    name: "YouTube Thumbnail",
    width: 1280,
    height: 720,
    category: "Video",
  },
  {
    id: "1920",
    name: "Presentation",
    width: 1920,
    height: 1080,
    category: "Presentation",
  },
  {
    id: "website-banner",
    name: "Website Banner",
    width: 1920,
    height: 600,
    category: "Web",
  },
  {
    id: "a4-portrait",
    name: "A4 Portrait",
    width: 2480,
    height: 3508,
    category: "Print",
  },
  {
    id: "a4-landscape",
    name: "A4 Landscape",
    width: 3508,
    height: 2480,
    category: "Print",
  },
];
