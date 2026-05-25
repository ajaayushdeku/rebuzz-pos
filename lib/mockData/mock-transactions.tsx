import { Transaction } from "@/components/dashboardComponents/orderHistory/transaction-columns";

export const mockTransactions: Transaction[] = [
  {
    id: "ORD-001",
    date: "Jan 10 2025",
    timestamp: "09:15",
    customer: "James Holden",
    amount: "42.50",
    paymentMethod: "Card",
    items: [
      {
        name: "Latte",
        quantity: 2,
        unitPrice: 100,
      },
      {
        name: "Croissant",
        quantity: 3,
        unitPrice: 150,
      },
    ],
    status: "completed",
  },
  {
    id: "ORD-002",
    date: "Jan 10 2025",
    timestamp: "10:30",
    customer: "Naomi Nagata",
    amount: "18.00",
    paymentMethod: "Cash",
    items: [
      {
        name: "Espresso",
        quantity: 2,
        unitPrice: 100,
      },
      {
        name: "Muffin",
        quantity: 1,
        unitPrice: 100,
      },
    ],
    status: "completed",
  },
  {
    id: "ORD-003",
    date: "Jan 11 2025",
    timestamp: "08:45",
    customer: "Alex Kamal",
    amount: "67.25",
    paymentMethod: "Loyalty",
    items: [
      {
        name: "Cappuccino",
        quantity: 3,
        unitPrice: 100,
      },
      {
        name: "Sandwich",
        quantity: 2,
        unitPrice: 100,
      },
      {
        name: "Orange Juice",
        quantity: 2,
        unitPrice: 100,
      },
    ],
    status: "completed",
  },
  {
    id: "ORD-004",
    date: "Jan 11 2025",
    timestamp: "11:00",
    customer: "Amos Burton",
    amount: "95.00",
    paymentMethod: "Card",
    items: [
      {
        name: "Black Coffee",
        quantity: 5,
        unitPrice: 100,
      },
      {
        name: "Cookies",
        quantity: 6,
        unitPrice: 100,
      },
    ],
    status: "pending",
  },
  {
    id: "ORD-005",
    date: "Jan 12 2025",
    timestamp: "13:20",
    customer: "Chrisjen Avasarala",
    amount: "33.75",
    paymentMethod: "Card",
    items: [
      {
        name: "Green Tea",
        quantity: 3,
        unitPrice: 100,
      },
      {
        name: "Brownie",
        quantity: 2,
        unitPrice: 100,
      },
    ],
    status: "completed",
  },
  {
    id: "ORD-006",
    date: "Jan 12 2025",
    timestamp: "14:05",
    customer: "Bobbie Draper",
    amount: "120.00",
    paymentMethod: "Loyalty",
    items: [
      {
        name: "Protein Shake",
        quantity: 4,
        unitPrice: 100,
      },
      {
        name: "Energy Bar",
        quantity: 8,
        unitPrice: 100,
      },
    ],
    status: "failed",
  },
  {
    id: "ORD-007",
    date: "Jan 13 2025",
    timestamp: "09:50",
    customer: "Fred Johnson",
    amount: "55.50",
    paymentMethod: "Cash",
    items: [
      {
        name: "Flat White",
        quantity: 3,
        unitPrice: 100,
      },
      {
        name: "Toast",
        quantity: 4,
        unitPrice: 100,
      },
    ],
    status: "completed",
  },
  {
    id: "ORD-008",
    date: "Jan 13 2025",
    timestamp: "16:30",
    customer: "Camina Drummer",
    amount: "28.00",
    paymentMethod: "Card",
    items: [
      {
        name: "Iced Coffee",
        quantity: 2,
        unitPrice: 100,
      },
      {
        name: "Bagel",
        quantity: 2,
        unitPrice: 100,
      },
    ],
    status: "refunded",
  },
  {
    id: "ORD-009",
    date: "Jan 14 2025",
    timestamp: "10:15",
    customer: "Marco Inaros",
    amount: "76.80",
    paymentMethod: "Loyalty",
    items: [
      {
        name: "Mocha",
        quantity: 4,
        unitPrice: 100,
      },
      {
        name: "Cheesecake",
        quantity: 2,
        unitPrice: 100,
      },
      {
        name: "Lemonade",
        quantity: 2,
        unitPrice: 100,
      },
    ],
    status: "pending",
  },
  {
    id: "ORD-010",
    date: "Jan 14 2025",
    timestamp: "12:45",
    customer: "Filip Inaros",
    amount: "15.00",
    paymentMethod: "Cash",
    items: [
      {
        name: "Americano",
        quantity: 1,
        unitPrice: 100,
      },
      {
        name: "Cookie",
        quantity: 2,
        unitPrice: 100,
      },
    ],
    status: "completed",
  },
  {
    id: "ORD-011",
    date: "Jan 15 2025",
    timestamp: "08:00",
    customer: "Clarissa Mao",
    amount: "49.95",
    paymentMethod: "Card",
    items: [
      {
        name: "Chai Latte",
        quantity: 3,
        unitPrice: 100,
      },
      {
        name: "Waffle",
        quantity: 2,
        unitPrice: 100,
      },
    ],
    status: "completed",
  },
  {
    id: "ORD-012",
    date: "Jan 15 2025",
    timestamp: "17:20",
    customer: "Prax Meng",
    amount: "88.40",
    paymentMethod: "Loyalty",
    items: [
      {
        name: "Cold Brew",
        quantity: 4,
        unitPrice: 100,
      },
      {
        name: "Sandwich",
        quantity: 3,
        unitPrice: 100,
      },
      {
        name: "Juice",
        quantity: 3,
        unitPrice: 100,
      },
    ],
    status: "failed",
  },
];
