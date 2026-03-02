"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type {
  User,
  CartItem,
  MenuItem,
  AddOn,
  HPTransaction,
  AppNotification,
} from "./types";
import {
  initializeStore,
  getUsers,
  setUsers,
  getCurrentUser,
  setCurrentUser,
  updateUser,
  getCartItems,
  setCartItems,
  getHPConfig,
  calculateHP,
  addNotification as storeAddNotification,
  getNotifications,
  generateId,
} from "./storage";

// ─── Auth Context ────────────────────────────────────────────────
interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => { success: boolean; error?: string };
  register: (data: {
    name: string;
    email: string;
    phone: string;
    password: string;
  }) => { success: boolean; error?: string };
  logout: () => void;
  updateProfile: (data: Partial<User>) => void;
  addHP: (amount: number, description: string) => void;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeStore();
    const stored = getCurrentUser();
    if (stored) {
      // Refresh from users list in case data changed
      const users = getUsers();
      const fresh = users.find((u) => u.id === stored.id);
      setUser(fresh ?? stored);
    }
    setLoading(false);
  }, []);

  const refreshUser = useCallback(() => {
    const stored = getCurrentUser();
    if (stored) {
      const users = getUsers();
      const fresh = users.find((u) => u.id === stored.id);
      if (fresh) {
        setUser(fresh);
        setCurrentUser(fresh);
      }
    }
  }, []);

  const login = useCallback(
    (email: string, password: string): { success: boolean; error?: string } => {
      const users = getUsers();
      const found = users.find(
        (u) => u.email.toLowerCase() === email.toLowerCase()
      );
      if (!found) return { success: false, error: "No account found with this email." };
      if (found.password !== password)
        return { success: false, error: "Incorrect password." };
      setCurrentUser(found);
      setUser(found);
      return { success: true };
    },
    []
  );

  const register = useCallback(
    (data: {
      name: string;
      email: string;
      phone: string;
      password: string;
    }): { success: boolean; error?: string } => {
      const users = getUsers();
      if (users.some((u) => u.email.toLowerCase() === data.email.toLowerCase())) {
        return { success: false, error: "An account with this email already exists." };
      }
      const newUser: User = {
        id: generateId("user"),
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: data.password,
        role: "customer",
        hpBalance: 5, // Welcome bonus
        createdAt: new Date().toISOString(),
      };
      const updated = [...users, newUser];
      setUsers(updated);
      setCurrentUser(newUser);
      setUser(newUser);
      return { success: true };
    },
    []
  );

  const logout = useCallback(() => {
    setCurrentUser(null);
    setUser(null);
  }, []);

  const updateProfile = useCallback(
    (data: Partial<User>) => {
      if (!user) return;
      const updated = { ...user, ...data };
      updateUser(updated);
      setUser(updated);
    },
    [user]
  );

  const addHP = useCallback(
    (amount: number, description: string) => {
      if (!user) return;
      const tx: HPTransaction = {
        id: generateId("hp"),
        userId: user.id,
        amount,
        type: amount > 0 ? "earned" : "redeemed",
        description,
        createdAt: new Date().toISOString(),
      };
      // Store tx in notifications for now
      storeAddNotification({
        id: generateId("notif"),
        userId: user.id,
        title: amount > 0 ? "Points Earned!" : "Points Redeemed",
        message: description,
        type: "points",
        read: false,
        createdAt: new Date().toISOString(),
      });
      const updated = { ...user, hpBalance: user.hpBalance + amount };
      updateUser(updated);
      setUser(updated);
      void tx; // transaction tracked via notifications
    },
    [user]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        updateProfile,
        addHP,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Cart Context ────────────────────────────────────────────────
interface CartContextType {
  items: CartItem[];
  addItem: (menuItem: MenuItem, quantity: number, addOns: AddOn[]) => void;
  removeItem: (menuItemId: string) => void;
  updateQuantity: (menuItemId: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
  estimatedHP: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function useCart(): CartContextType {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const stored = getCartItems();
    setItems(stored);
  }, []);

  const persist = useCallback((newItems: CartItem[]) => {
    setItems(newItems);
    setCartItems(newItems);
  }, []);

  const addItem = useCallback(
    (menuItem: MenuItem, quantity: number, addOns: AddOn[]) => {
      const existing = items.find((i) => i.menuItem.id === menuItem.id);
      if (existing) {
        const updated = items.map((i) =>
          i.menuItem.id === menuItem.id
            ? { ...i, quantity: i.quantity + quantity, selectedAddOns: addOns }
            : i
        );
        persist(updated);
      } else {
        persist([...items, { menuItem, quantity, selectedAddOns: addOns }]);
      }
    },
    [items, persist]
  );

  const removeItem = useCallback(
    (menuItemId: string) => {
      persist(items.filter((i) => i.menuItem.id !== menuItemId));
    },
    [items, persist]
  );

  const updateQuantity = useCallback(
    (menuItemId: string, quantity: number) => {
      if (quantity <= 0) {
        persist(items.filter((i) => i.menuItem.id !== menuItemId));
        return;
      }
      persist(
        items.map((i) =>
          i.menuItem.id === menuItemId ? { ...i, quantity } : i
        )
      );
    },
    [items, persist]
  );

  const clearCart = useCallback(() => {
    persist([]);
  }, [persist]);

  const itemCount = items.reduce((acc, i) => acc + i.quantity, 0);

  const subtotal = items.reduce((acc, i) => {
    const addOnTotal = i.selectedAddOns.reduce((s, a) => s + a.price, 0);
    return acc + (i.menuItem.price + addOnTotal) * i.quantity;
  }, 0);

  const estimatedHP = calculateHP(items, subtotal, getHPConfig());

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        itemCount,
        subtotal,
        estimatedHP,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

// ─── Notification Context ─────────────────────────────────────────
interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  refresh: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export function useNotifications(): NotificationContextType {
  const ctx = useContext(NotificationContext);
  if (!ctx)
    throw new Error("useNotifications must be used within NotificationProvider");
  return ctx;
}

function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const refresh = useCallback(() => {
    if (user) {
      setNotifications(getNotifications(user.id));
    } else {
      setNotifications([]);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = useCallback(
    (id: string) => {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    },
    []
  );

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, markAsRead, refresh }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

// ─── Combined App Provider ──────────────────────────────────────
export function AppProvider({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <CartProvider>
        <NotificationProvider>{children}</NotificationProvider>
      </CartProvider>
    </AuthProvider>
  );
}
