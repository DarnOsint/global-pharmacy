import { create } from 'zustand';
import type { Product, Sale, Purchase, Expense, Staff, Customer, Supplier } from '@/types/database';

interface AppState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  products: Product[];
  setProducts: (products: Product[]) => void;

  sales: Sale[];
  setSales: (sales: Sale[]) => void;

  purchases: Purchase[];
  setPurchases: (purchases: Purchase[]) => void;

  expenses: Expense[];
  setExpenses: (expenses: Expense[]) => void;

  staff: Staff[];
  setStaff: (staff: Staff[]) => void;

  customers: Customer[];
  setCustomers: (customers: Customer[]) => void;

  suppliers: Supplier[];
  setSuppliers: (suppliers: Supplier[]) => void;

  pendingSync: number;
  setPendingSync: (count: number) => void;

  isOnline: boolean;
  setIsOnline: (online: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  products: [],
  setProducts: (products) => set({ products }),
  sales: [],
  setSales: (sales) => set({ sales }),
  purchases: [],
  setPurchases: (purchases) => set({ purchases }),
  expenses: [],
  setExpenses: (expenses) => set({ expenses }),
  staff: [],
  setStaff: (staff) => set({ staff }),
  customers: [],
  setCustomers: (customers) => set({ customers }),
  suppliers: [],
  setSuppliers: (suppliers) => set({ suppliers }),

  pendingSync: 0,
  setPendingSync: (count) => set({ pendingSync: count }),
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  setIsOnline: (online) => set({ isOnline: online }),
}));
