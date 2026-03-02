export interface AddOn {
  id: string;
  name: string;
  price: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  categorySlug: string;
  images: string[];
  available: boolean;
  hpReward: number;
  hpRedeemCost: number;
  addOns: AddOn[];
  tags: string[];
  isMostOrdered: boolean;
  isLimitedOffer: boolean;
  isDailySpecial: boolean;
  preparationTime: string;
  rating: number;
  reviewCount: number;
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  selectedAddOns: AddOn[];
}

export type OrderStatus =
  | "Order Placed"
  | "Preparing"
  | "Out for Delivery"
  | "Delivered"
  | "Cancelled";

export type PaymentMethod = "cash" | "card";

export interface DeliveryAddress {
  fullName: string;
  phone: string;
  address: string;
  area: string;
  notes: string;
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  total: number;
  subtotal: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  deliveryAddress: DeliveryAddress;
  hpEarned: number;
  createdAt: string;
}

export type HPTransactionType = "earned" | "redeemed" | "bonus";

export interface HPTransaction {
  id: string;
  userId: string;
  amount: number;
  type: HPTransactionType;
  description: string;
  createdAt: string;
}

export type UserRole = "customer" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
  hpBalance: number;
  createdAt: string;
}

export type NotificationType = "order" | "points" | "reservation" | "general";

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  createdAt: string;
}

export type HPMode = "per-item" | "threshold";

export interface HPThresholdRule {
  minTotal: number;
  hpReward: number;
}

export interface HPConfig {
  mode: HPMode;
  thresholdRules: HPThresholdRule[];
}

export type ReviewType = "experience" | "dish";

export interface ReviewBase {
  id: string;
  type: ReviewType;

  // user snapshot (no approval system)
  userId: string | null;
  userName: string;
  userEmail?: string;

  rating: number; // 1-5
  comment: string;

  createdAt: string; // ISO
}

export interface ExperienceReview extends ReviewBase {
  type: "experience";
  visitDate?: string; // yyyy-mm-dd (optional)
  tags?: string[]; // optional (service, ambience, etc.)
}

export interface DishReview extends ReviewBase {
  type: "dish";
  menuItemId: string;
  menuItemName: string;// snapshot for safety
}

export type Review = ExperienceReview | DishReview;

export type ReservationStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed";

export interface Reservation {
  id: string;
  userId: string | null;

  name: string;
  phone: string;

  guests: number;
  date: string; // yyyy-mm-dd
  time: string; // HH:mm

  notes?: string;

  status: ReservationStatus;
  createdAt: string; // ISO
}


 