import {
  CreditCard,
  Receipt,
  Gauge,
  LucideIcon,
  Building,
  Building2,
  User,
  Users,
  UsersRound,
  Settings,
  Package,
  Boxes,
  BadgePercent,
  Gift,
  Tag,
  TrendingUp,
  HandCoins,
  UserCog,
  LayoutDashboard,
  FileText,
  Lock,
  ShieldCheck,
  Award,
  ScanEye,
  Coins,
  Landmark,
  PieChart,
  Wallet,
  Banknote,
  History,
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
    icon: ShieldCheck,
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
        label: "Profit & Cost",
        href: "/dashboard/profit-cost",
        icon: HandCoins,
      },
      {
        label: "Tax Analytics",
        href: "/dashboard/tax-analytics",
        icon: Landmark,
      },
      {
        label: "Expense Analytics",
        href: "/dashboard/expenses",
        icon: PieChart,
      },
      { label: "Inventory", href: "/dashboard/inventory", icon: Boxes },
      { label: "Employee", href: "/dashboard/employee", icon: UsersRound },
      { label: "Customers", href: "/dashboard/customers", icon: Users },
    ],
  },
  {
    type: "section",
    label: "Sales & Payments",
    icon: Banknote,
    items: [
      { label: "Invoices", href: "/records/invoices", icon: FileText },
      { label: "Expenses", href: "/records/expenses", icon: Wallet },
      {
        label: "Credits",
        href: "/records/credits",
        icon: CreditCard,
      },
      {
        label: "Order History",
        href: "/records/order-history",
        icon: History,
      },
      { label: "Customers", href: "/records/customers", icon: Users },
      { label: "Products", href: "/records/products", icon: Package },
    ],
  },

  {
    type: "single",
    label: "Offer",
    icon: Gift,
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
      { label: "Manage Employees", href: "/settings/staffs", icon: UserCog },
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
