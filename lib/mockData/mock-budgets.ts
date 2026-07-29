// ── Budget Types ─────────────────────────────────────────────────────────────

export interface Budget {
  id: string;
  purposeId: string;
  amount: number;
}

// ── Mock Budgets ─────────────────────────────────────────────────────────────

export const mockBudgets: Budget[] = [
  { id: "1", purposeId: "Food & ingredients", amount: 312000 },
  { id: "2", purposeId: "Staff wages", amount: 268000 },
  { id: "3", purposeId: "Delivery commissions", amount: 86000 },
  { id: "4", purposeId: "Utilities & gas", amount: 40000 },
  { id: "5", purposeId: "Packaging", amount: 53000 },
  { id: "6", purposeId: "Marketing & ads", amount: 44000 },
  { id: "7", purposeId: "Rent & rates", amount: 120000 },
];

// ── Mock Budget CRUD Operations ──────────────────────────────────────────────

let budgets = [...mockBudgets];

export const mockBudgetOperations = {
  getAll: async (): Promise<Budget[]> => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 300));
    return [...budgets];
  },

  create: async (purposeId: string, amount: number): Promise<Budget> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const newBudget: Budget = {
      id: Date.now().toString(),
      purposeId,
      amount,
    };
    budgets.push(newBudget);
    return newBudget;
  },

  update: async (
    id: string,
    updates: { purposeId?: string; amount?: number },
  ): Promise<Budget> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const index = budgets.findIndex((b) => b.id === id);
    if (index === -1) {
      throw new Error("Budget not found");
    }
    budgets[index] = {
      ...budgets[index],
      ...updates,
    };
    return budgets[index];
  },

  delete: async (id: string): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    budgets = budgets.filter((b) => b.id !== id);
  },

  reset: () => {
    budgets = [...mockBudgets];
  },
};
