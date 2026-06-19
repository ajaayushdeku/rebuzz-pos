import {
  CreditCard,
  ShoppingCart,
  Receipt,
  Gauge,
  LucideIcon,
  Building,
  Building2,
  User,
  Users,
  Settings,
  Package,
  BadgePercent,
  Tag,
  TrendingUp,
  HandCoins,
  UserCog,
  ClipboardList,
  LayoutDashboard,
  FileText,
  Lock,
  Award,
  ScanEye,
  Coins,
} from "lucide-react";

export type NavigationItem =
  | {
      type: "single";
      label: string;
      href: string;
      icon: LucideIcon;
    }
  | {
      type: "section";
      label: string;
      icon: LucideIcon;
      items: { label: string; href: string; icon: LucideIcon }[];
    };

export const profileNavigationConfig: NavigationItem[] = [
  {
    type: "single",
    label: "Personal Information",
    icon: User,
    href: "/profile",
  },
  {
    type: "single",
    label: "Business Information",
    icon: Building,
    href: "/profile/business",
  },
  {
    type: "single",
    label: "Password & Security",
    icon: Settings,
    href: "/profile/password",
  },
];

export const navigationConfig: NavigationItem[] = [
  {
    type: "section",
    label: "Dashboard",
    icon: Gauge,
    items: [
      { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
      {
        label: "Sales & Revenue",
        href: "/dashboard/sales-revenue",
        icon: TrendingUp,
      },
      {
        label: "Profit vs Expense",
        href: "/dashboard/profit-cost",
        icon: HandCoins,
      },
      {
        label: "Tax Analytics",
        href: "/dashboard/tax-analytics",
        icon: Receipt,
      },
      { label: "Inventory", href: "/dashboard/inventory", icon: Package },
      { label: "Employee", href: "/dashboard/employee", icon: UserCog },
      { label: "Customers", href: "/dashboard/customers", icon: Users },
    ],
  },
  {
    type: "section",
    label: "Records",
    icon: FileText,
    items: [
      { label: "Invoices", href: "/invoices", icon: FileText },
      {
        label: "Order History",
        href: "/records/order-history",
        icon: ClipboardList,
      },
      { label: "Customers", href: "/records/customers", icon: Users },
      { label: "Products", href: "/records/products", icon: Package },
    ],
  },
  {
    type: "single",
    label: "Expense / Purchase",
    icon: ShoppingCart,
    href: "/expenses",
  },
  {
    type: "single",
    label: "Offer",
    icon: BadgePercent,
    href: "/offers",
  },
  {
    type: "section",
    label: "Settings",
    icon: Settings,
    items: [
      { label: "Business", href: "/settings/business", icon: Building2 },
      {
        label: "Change Password",
        href: "/settings/change-password",
        icon: Lock,
      },
      { label: "Manage Staffs", href: "/settings/staffs", icon: UserCog },
      { label: "Currency", href: "/settings/currency", icon: Coins },
      { label: "Tax", href: "/settings/tax", icon: Receipt },
      { label: "Discount", href: "/settings/discount", icon: BadgePercent },
      { label: "Category", href: "/settings/category", icon: Tag },
      { label: "Loyalty Point", href: "/settings/loyalty-points", icon: Award },
    ],
  },
  {
    type: "single",
    label: "Receipt AI",
    icon: ScanEye,
    href: "/bizexpense",
  },
];
