import type {
  User,
  Order,
  MenuItem,
  Category,
  HPConfig,
  CartItem,
  AppNotification,
  Reservation,
  ReservationStatus,
  Review,
  ReviewType,
  ExperienceReview,
  DishReview,
} from "./types";

import { categories, menuItems, defaultHPConfig } from "./mock-data";

const KEYS = {
  USERS: "homely_users",
  CURRENT_USER: "homely_current_user",
  ORDERS: "homely_orders",
  MENU_ITEMS: "homely_menu_items",
  CATEGORIES: "homely_categories",
  HP_CONFIG: "homely_hp_config",
  CART: "homely_cart",
  NOTIFICATIONS: "homely_notifications",
  RESERVATIONS: "homely_reservations",
  REVIEWS: "homely_reviews",
  INITIALIZED: "homely_initialized",
} as const;

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function getItem<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function setItem<T>(key: string, value: T): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage full or unavailable
  }
}

// Initialization
export function initializeStore(): void {
  if (!isBrowser()) return;
  const initialized = localStorage.getItem(KEYS.INITIALIZED);
  if (initialized) return;

  setItem(KEYS.MENU_ITEMS, menuItems);
  setItem(KEYS.CATEGORIES, categories);
  setItem(KEYS.HP_CONFIG, defaultHPConfig);

  // Seed admin user
  const adminUser: User = {
    id: "admin-1",
    name: "Admin",
    email: "admin@homely.com",
    phone: "+971500000000",
    password: "admin123",
    role: "admin",
    hpBalance: 0,
    createdAt: new Date().toISOString(),
  };

  setItem(KEYS.USERS, [adminUser]);
  setItem(KEYS.ORDERS, []);
  setItem(KEYS.CART, []);
  setItem(KEYS.NOTIFICATIONS, []);
  setItem(KEYS.RESERVATIONS, []);
  setItem(KEYS.REVIEWS, []);
  localStorage.setItem(KEYS.INITIALIZED, "true");
}

// Users
export function getUsers(): User[] {
  return getItem<User[]>(KEYS.USERS, []);
}

export function setUsers(users: User[]): void {
  setItem(KEYS.USERS, users);
}

export function getCurrentUser(): User | null {
  return getItem<User | null>(KEYS.CURRENT_USER, null);
}

export function setCurrentUser(user: User | null): void {
  setItem(KEYS.CURRENT_USER, user);
}

export function updateUser(updated: User): void {
  const users = getUsers();
  const idx = users.findIndex((u) => u.id === updated.id);
  if (idx !== -1) {
    users[idx] = updated;
    setUsers(users);
  }
  const current = getCurrentUser();
  if (current && current.id === updated.id) {
    setCurrentUser(updated);
  }
}

// Orders
export function getOrders(): Order[] {
  return getItem<Order[]>(KEYS.ORDERS, []);
}

export function setOrders(orders: Order[]): void {
  setItem(KEYS.ORDERS, orders);
}

export function addOrder(order: Order): void {
  const orders = getOrders();
  orders.unshift(order);
  setOrders(orders);
}

export function getUserOrders(userId: string): Order[] {
  return getOrders().filter((o) => o.userId === userId);
}

// Menu Items
export function getMenuItems(): MenuItem[] {
  return getItem<MenuItem[]>(KEYS.MENU_ITEMS, menuItems);
}

export function getCategories(): Category[] {
  return getItem<Category[]>(KEYS.CATEGORIES, categories);
}

// HP Config
export function getHPConfig(): HPConfig {
  return getItem<HPConfig>(KEYS.HP_CONFIG, defaultHPConfig);
}

export function setHPConfig(config: HPConfig): void {
  setItem(KEYS.HP_CONFIG, config);
}

// Cart
export function getCartItems(): CartItem[] {
  return getItem<CartItem[]>(KEYS.CART, []);
}

export function setCartItems(items: CartItem[]): void {
  setItem(KEYS.CART, items);
}

// Notifications
export function getNotifications(userId: string): AppNotification[] {
  const all = getItem<AppNotification[]>(KEYS.NOTIFICATIONS, []);
  return all.filter((n) => n.userId === userId);
}

export function addNotification(notification: AppNotification): void {
  const all = getItem<AppNotification[]>(KEYS.NOTIFICATIONS, []);
  all.unshift(notification);
  setItem(KEYS.NOTIFICATIONS, all);
}

// HP Calculation
export function calculateHP(
  items: CartItem[],
  orderTotal: number,
  config: HPConfig
): number {
  if (config.mode === "per-item") {
    return items.reduce(
      (acc, item) => acc + item.menuItem.hpReward * item.quantity,
      0
    );
  }
  // threshold mode
  let hp = 0;
  const sortedRules = [...config.thresholdRules].sort(
    (a, b) => b.minTotal - a.minTotal
  );
  for (const rule of sortedRules) {
    if (orderTotal >= rule.minTotal) {
      hp = rule.hpReward;
      break;
    }
  }
  return hp;
}

// ─── Menu Item CRUD ──────────────────────────────────────────────
export function setMenuItems(items: MenuItem[]): void {
  setItem(KEYS.MENU_ITEMS, items);
}

export function addMenuItem(item: MenuItem): void {
  const items = getMenuItems();
  items.push(item);
  setMenuItems(items);
}

export function updateMenuItem(updated: MenuItem): void {
  const items = getMenuItems();
  const idx = items.findIndex((i) => i.id === updated.id);
  if (idx !== -1) {
    items[idx] = updated;
    setMenuItems(items);
  }
}

export function deleteMenuItem(id: string): void {
  setMenuItems(getMenuItems().filter((i) => i.id !== id));
}

// ─── Category CRUD ───────────────────────────────────────────────
export function setCategories(cats: Category[]): void {
  setItem(KEYS.CATEGORIES, cats);
}

export function addCategory(cat: Category): void {
  const cats = getCategories();
  cats.push(cat);
  setCategories(cats);
}

export function updateCategory(updated: Category): void {
  const cats = getCategories();
  const idx = cats.findIndex((c) => c.id === updated.id);
  if (idx !== -1) {
    cats[idx] = updated;
    setCategories(cats);
  }
}

export function deleteCategory(id: string): void {
  setCategories(getCategories().filter((c) => c.id !== id));
}

// ─── Order Management ────────────────────────────────────────────
export function updateOrderStatus(
  orderId: string,
  status: import("./types").OrderStatus
): void {
  const orders = getOrders();
  const idx = orders.findIndex((o) => o.id === orderId);
  if (idx !== -1) {
    orders[idx] = { ...orders[idx], status };
    setOrders(orders);
  }
}

export function getAllOrders(): Order[] {
  return getOrders();
}

// ─── Admin Stats Helpers ──────────────────────────────────────────
export function getStats() {
  const orders = getOrders();
  const users = getUsers();
  const items = getMenuItems();

  const totalRevenue = orders
    .filter((o) => o.status !== "Cancelled")
    .reduce((sum, o) => sum + o.total, 0);

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayOrders = orders.filter((o) => o.createdAt.slice(0, 10) === todayStr);
  const todayRevenue = todayOrders
    .filter((o) => o.status !== "Cancelled")
    .reduce((sum, o) => sum + o.total, 0);

  const statusCounts: Record<string, number> = {};
  for (const o of orders) {
    statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
  }

  return {
    totalOrders: orders.length,
    totalRevenue,
    todayOrders: todayOrders.length,
    todayRevenue,
    totalUsers: users.length,
    totalMenuItems: items.length,
    statusCounts,
  };
}

// ─── Reservations ───────────────────────────────────────────────
export function getReservations(): Reservation[] {
  return getItem<Reservation[]>(KEYS.RESERVATIONS, []);
}

export function setReservations(reservations: Reservation[]): void {
  setItem(KEYS.RESERVATIONS, reservations);
}

export function addReservation(reservation: Reservation): void {
  const all = getReservations();
  all.unshift(reservation);
  setReservations(all);

  // Notify admin
  addNotification({
    id: generateId("notif"),
    userId: "admin-1",
    type: "reservation",
    title: "New table reservation",
    message: `${reservation.name} requested a table for ${reservation.guests} on ${reservation.date} at ${reservation.time}.`,
    createdAt: new Date().toISOString(),
    read: false,
  });

  // Notify user (if logged in)
  if (reservation.userId !== null) {
    addNotification({
      id: generateId("notif"),
      userId: reservation.userId,
      type: "reservation",
      title: "Reservation received",
      message: "Your reservation request is received and is pending confirmation.",
      createdAt: new Date().toISOString(),
      read: false,
    });
  }
}

export function updateReservationStatus(
  reservationId: string,
  status: ReservationStatus
): void {
  const all = getReservations();
  const idx = all.findIndex((r) => r.id === reservationId);
  if (idx !== -1) {
    all[idx] = { ...all[idx], status };
    setReservations(all);
  }
}

export function deleteReservation(reservationId: string): void {
  setReservations(getReservations().filter((r) => r.id !== reservationId));
}

export function getUserReservations(userId: string): Reservation[] {
  return getReservations().filter((r) => r.userId === userId);
}

// ─── Reviews (Experience + Dish) ──────────────────────────────────
export function getReviews(params?: {
  type?: ReviewType;
  menuItemId?: string;
  limit?: number;
}): Review[] {
  const all = getItem<Review[]>(KEYS.REVIEWS, []);

  const filtered = all.filter((r) => {
    if (params?.type && r.type !== params.type) return false;

    if (params?.menuItemId) {
      if (r.type !== "dish") return false;
      return r.menuItemId === params.menuItemId;
    }

    return true;
  });

  // newest first
  filtered.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  return typeof params?.limit === "number" ? filtered.slice(0, params.limit) : filtered;
}

export function setReviews(reviews: Review[]): void {
  setItem(KEYS.REVIEWS, reviews);
}

export function addExperienceReview(input: {
  userId: string | null;
  userName: string;
  userEmail?: string;
  rating: number;
  comment: string;
  visitDate?: string;
  tags?: string[];
}): ExperienceReview {
  const review: ExperienceReview = {
    id: generateId("rev"),
    type: "experience",
    userId: input.userId,
    userName: input.userName,
    userEmail: input.userEmail,
    rating: input.rating,
    comment: input.comment,
    visitDate: input.visitDate,
    tags: input.tags,
    createdAt: new Date().toISOString(),
  };

  const all = getItem<Review[]>(KEYS.REVIEWS, []);
  all.unshift(review);
  setItem(KEYS.REVIEWS, all);

  return review;
}

export function addDishReview(input: {
  userId: string | null;
  userName: string;
  userEmail?: string;
  rating: number;
  comment: string;
  menuItemId: string;
}): DishReview {
  const item = getMenuItems().find((m) => m.id === input.menuItemId);

  const review: DishReview = {
    id: generateId("rev"),
    type: "dish",
    userId: input.userId,
    userName: input.userName,
    userEmail: input.userEmail,
    rating: input.rating,
    comment: input.comment,
    menuItemId: input.menuItemId,
    menuItemName: item?.name ?? "Unknown item",
    createdAt: new Date().toISOString(),
  };

  const all = getItem<Review[]>(KEYS.REVIEWS, []);
  all.unshift(review);
  setItem(KEYS.REVIEWS, all);

  return review;
}

export function deleteReview(reviewId: string): void {
  const all = getItem<Review[]>(KEYS.REVIEWS, []);
  setItem(
    KEYS.REVIEWS,
    all.filter((r) => r.id !== reviewId)
  );
}

// Unique ID generator
export function generateId(prefix: string = "id"): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

