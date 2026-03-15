"use client";

import { calcSubtotal } from "@/lib/orders/pricing";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import type {
  User,
  CartItem,
  MenuItem,
  AddOn,
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
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification as deleteNotificationFromStorage,
  clearAllNotifications,
  recordHPEarned,
  recordHPRedeemed,
} from "./storage";

const STORE_EVENT = "homely_store_changed";

// ─── Auth Context ────────────────────────────────────────────────
interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => {
    success: boolean;
    error?: string;
  };
  register: (data: {
    name: string;
    email: string;
    phone: string;
    password: string;
  }) => { success: boolean; user?: User; error?: string };
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
      const users = getUsers();
      const fresh = users.find((u) => u.id === stored.id);
      const resolvedUser = fresh ?? stored;
      setUser(resolvedUser);
      setCurrentUser(resolvedUser);
    }

    setLoading(false);
  }, []);

  const refreshUser = useCallback(() => {
    const stored = getCurrentUser();

    if (!stored) {
      setUser(null);
      return;
    }

    const users = getUsers();
    const fresh = users.find((u) => u.id === stored.id);

    if (fresh) {
      setUser(fresh);
      setCurrentUser(fresh);
      return;
    }

    setUser(stored);
  }, []);

  const login = useCallback(
    (
      email: string,
      password: string
    ): { success: boolean; error?: string } => {
      const users = getUsers();
      const found = users.find(
        (u) => u.email.toLowerCase() === email.toLowerCase().trim()
      );

      if (!found) {
        return { success: false, error: "No account found with this email." };
      }

      if (found.password !== password) {
        return { success: false, error: "Incorrect password." };
      }

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
    }): { success: boolean; user?: User; error?: string } => {
      const users = getUsers();
      const normalizedEmail = data.email.toLowerCase().trim();

      if (users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
        return {
          success: false,
          error: "An account with this email already exists.",
        };
      }

      const newUser: User = {
        id: generateId("user"),
        name: data.name.trim(),
        email: normalizedEmail,
        phone: data.phone.trim(),
        password: data.password,
        role: "customer",
        hpBalance: 5,
        createdAt: new Date().toISOString(),
      };

      const updated = [...users, newUser];
      setUsers(updated);
      setCurrentUser(newUser);
      setUser(newUser);

      return { success: true, user: newUser };
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
      setCurrentUser(updated);
      if (amount > 0) {
        recordHPEarned(user.id, amount, description);
      } else if (amount < 0) {
        recordHPRedeemed(user.id, Math.abs(amount), description);
      }
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
  addItem: (
    menuItem: MenuItem,
    quantity: number,
    addOns: AddOn[],
    note?: string,
    options?: {
      redemption?: CartItem["redemption"];
    }
  ) => void;
  removeItem: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  updateItemDetails: (
    cartItemId: string,
    updates: {
      quantity: number;
      selectedAddOns: AddOn[];
      note?: string;
    }
  ) => void;
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

function getSortedAddOnIds(addOns: AddOn[]): string[] {
  return [...addOns.map((a) => a.id)].sort();
}

function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    initializeStore();
    const stored = getCartItems();
    setItems(stored);
  }, []);

  const persist = useCallback((newItems: CartItem[]) => {
    setItems(newItems);
    setCartItems(newItems);
  }, []);

  const addItem = useCallback(
    (
      menuItem: MenuItem,
      quantity: number,
      addOns: AddOn[],
      note?: string,
      options?: {
        redemption?: CartItem["redemption"];
      }
    ) => {
      setItems((currentItems) => {
        const normalizedNote = note?.trim() || undefined;
        const redemption = options?.redemption;

        const existing = currentItems.find((i) => {
          const sameMenuItem = i.menuItem.id === menuItem.id;
          const sameNote = (i.note?.trim() || undefined) === normalizedNote;
          const sameRedemption =
            (i.redemption?.mode ?? null) === (redemption?.mode ?? null) &&
            (i.redemption?.hpCostPerUnit ?? 0) === (redemption?.hpCostPerUnit ?? 0);

          const currentAddOnIds = getSortedAddOnIds(i.selectedAddOns);
          const nextAddOnIds = getSortedAddOnIds(addOns);

          const sameAddOns =
            currentAddOnIds.length === nextAddOnIds.length &&
            currentAddOnIds.every((id, idx) => id === nextAddOnIds[idx]);

          return sameMenuItem && sameNote && sameAddOns && sameRedemption;
        });

        let nextItems: CartItem[];

        if (existing) {
          nextItems = currentItems.map((i) =>
            i.id === existing.id
              ? {
                  ...i,
                  quantity: i.quantity + quantity,
                }
              : i
          );
        } else {
          nextItems = [
            ...currentItems,
            {
              id: generateId("cart"),
              menuItem,
              quantity,
              selectedAddOns: addOns,
              note: normalizedNote,
              redemption,
            },
          ];
        }

        setCartItems(nextItems);
        return nextItems;
      });
    },
    []
  );

  const removeItem = useCallback((cartItemId: string) => {
    setItems((currentItems) => {
      const nextItems = currentItems.filter((i) => i.id !== cartItemId);
      setCartItems(nextItems);
      return nextItems;
    });
  }, []);

  const updateQuantity = useCallback((cartItemId: string, quantity: number) => {
    setItems((currentItems) => {
      let nextItems: CartItem[];

      if (quantity <= 0) {
        nextItems = currentItems.filter((i) => i.id !== cartItemId);
      } else {
        nextItems = currentItems.map((i) =>
          i.id === cartItemId ? { ...i, quantity } : i
        );
      }

      setCartItems(nextItems);
      return nextItems;
    });
  }, []);

  const updateItemDetails = useCallback(
    (
      cartItemId: string,
      updates: {
        quantity: number;
        selectedAddOns: AddOn[];
        note?: string;
      }
    ) => {
      setItems((currentItems) => {
        const normalizedNote = updates.note?.trim() || undefined;

        const nextItems = currentItems.flatMap((item) => {
          if (item.id !== cartItemId) return [item];
          if (updates.quantity <= 0) return [];

          return [
            {
              ...item,
              quantity: updates.quantity,
              selectedAddOns: updates.selectedAddOns,
              note: normalizedNote,
            },
          ];
        });

        setCartItems(nextItems);
        return nextItems;
      });
    },
    []
  );

  const clearCart = useCallback(() => {
    persist([]);
  }, [persist]);

  const itemCount = useMemo(
    () => items.reduce((acc, i) => acc + i.quantity, 0),
    [items]
  );

  const subtotal = useMemo(() => calcSubtotal(items), [items]);

  const estimatedHP = useMemo(
    () => calculateHP(items, subtotal, getHPConfig()),
    [items, subtotal]
  );

  return (
    <CartContext.Provider
    value={{
      items,
      addItem,
      removeItem,
      updateQuantity,
      updateItemDetails,
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
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAll: () => void;
  refresh: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export function useNotifications(): NotificationContextType {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error(
      "useNotifications must be used within NotificationProvider"
    );
  }
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

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleStoreChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ scope?: string }>;
      const scope = customEvent.detail?.scope;

      if (!scope || scope === "notifications" || scope === "orders") {
        refresh();
      }
    };

    window.addEventListener(STORE_EVENT, handleStoreChange);
    window.addEventListener("focus", refresh);

    return () => {
      window.removeEventListener(STORE_EVENT, handleStoreChange);
      window.removeEventListener("focus", refresh);
    };
  }, [refresh]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const markAsRead = useCallback(
    (id: string) => {
      if (!user) return;
      markNotificationRead(user.id, id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    },
    [user]
  );

  const markAllAsRead = useCallback(() => {
    if (!user) return;
    markAllNotificationsRead(user.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, [user]);

  const deleteNotificationFn = useCallback(
    (id: string) => {
      deleteNotificationFromStorage(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    },
    []
  );

  const clearAll = useCallback(() => {
    if (!user) return;
    clearAllNotifications(user.id);
    setNotifications([]);
  }, [user]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        deleteNotification: deleteNotificationFn,
        clearAll,
        refresh,
      }}
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
