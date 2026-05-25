import {
  CreditCard,
  ShoppingCart,
  Receipt,
  Gauge,
  LucideIcon,
  Building,
  User,
  Settings,
  Package,
  BadgePercent,
  Tag,
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
      items: { label: string; href: string }[];
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
      { label: "Overview", href: "/dashboard" },
      {
        label: "Sales & Revenue",
        href: "/dashboard/sales-revenue",
      },
      {
        label: "Customers",
        href: "/dashboard/customers",
      },
      {
        label: "Inventory",
        href: "/dashboard/inventory",
      },
      {
        label: "Profit & Cost",
        href: "/dashboard/profit-cost",
      },
      {
        label: "Staffs",
        href: "/dashboard/staff",
      },
      {
        label: "Order History",
        href: "/dashboard/order-history",
      },
    ],
  },
  {
    type: "section",
    label: "Sales & Payments",
    icon: CreditCard,
    items: [
      // {
      //   label: "Estimates",
      //   href: "/estimates",
      // },
      { label: "Invoices", href: "/invoices" },
      // {
      //   label: "Recurring Invoices",
      //   href: "/recurring-invoices",
      // },
      // {
      //   label: "Checkouts",
      //   href: "/checkouts",
      // },
      // {
      //   label: "Customer Statements",
      //   href: "/customer-statements",
      // },
      {
        label: "Customers",
        href: "/customers",
      },
      {
        label: "Products",
        href: "/products",
      },
    ],
  },
  {
    type: "section",
    label: "Expense / Purchase",
    icon: ShoppingCart,
    items: [
      {
        label: "Bills",
        href: "/bills",
      },
      {
        label: "Vendors",
        href: "/vendors",
      },
      {
        label: "Products & Services",
        href: "/products-services",
      },
    ],
  },

  {
    type: "single",
    label: "Offer",
    icon: Tag,
    href: "/offers",
  },

  {
    type: "single",
    label: "Loyalty Point",
    icon: BadgePercent,
    href: "/loyalty-points",
  },
  {
    type: "single",
    label: "Receipt AI",
    icon: Receipt,
    href: "/bizexpense",
  },
  {
    type: "single",
    label: "Biz Expense",
    icon: Building,
    href: "/bizexpenses",
  },
];
