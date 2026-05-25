import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface UIState {
  // Modals
  isCreateInvoiceModalOpen: boolean;
  isCustomerModalOpen: boolean;
  isPaymentModalOpen: boolean;
  selectedInvoiceId: string | null;

  // Sidebar
  isSidebarCollapsed: boolean;

  // Notifications
  notifications: Array<{
    id: string;
    type: "success" | "error" | "warning" | "info";
    message: string;
    duration?: number;
  }>;

  // Actions
  openCreateInvoiceModal: () => void;
  closeCreateInvoiceModal: () => void;
  openCustomerModal: () => void;
  closeCustomerModal: () => void;
  openPaymentModal: (invoiceId: string) => void;
  closePaymentModal: () => void;
  toggleSidebar: () => void;
  addNotification: (
    notification: Omit<UIState["notifications"][0], "id">,
  ) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

export const useUIStore = create<UIState>()(
  devtools(
    (set) => ({
      // Initial state
      isCreateInvoiceModalOpen: false,
      isCustomerModalOpen: false,
      isPaymentModalOpen: false,
      selectedInvoiceId: null,
      isSidebarCollapsed: false,
      notifications: [],

      // Modal actions
      openCreateInvoiceModal: () => set({ isCreateInvoiceModalOpen: true }),
      closeCreateInvoiceModal: () => set({ isCreateInvoiceModalOpen: false }),
      openCustomerModal: () => set({ isCustomerModalOpen: true }),
      closeCustomerModal: () => set({ isCustomerModalOpen: false }),
      openPaymentModal: (invoiceId) =>
        set({
          isPaymentModalOpen: true,
          selectedInvoiceId: invoiceId,
        }),
      closePaymentModal: () =>
        set({
          isPaymentModalOpen: false,
          selectedInvoiceId: null,
        }),

      // Sidebar
      toggleSidebar: () =>
        set((state) => ({
          isSidebarCollapsed: !state.isSidebarCollapsed,
        })),

      // Notifications
      addNotification: (notification) =>
        set((state) => ({
          notifications: [
            ...state.notifications,
            {
              ...notification,
              id: Date.now().toString(),
            },
          ],
        })),

      removeNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        })),

      clearNotifications: () => set({ notifications: [] }),
    }),
    { name: "UIStore" },
  ),
);
