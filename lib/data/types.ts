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
  id: string;
  menuItem: MenuItem;
  quantity: number;
  selectedAddOns: AddOn[];
  note?: string;
}

export type OrderStatus =
  | "Pending"
  | "Confirmed"
  | "Preparing"
  | "Out for Delivery"
  | "Delivered"
  | "Cancelled";

export type PaymentMethod = "cash" | "card";

export interface DeliveryAddress {
  fullName: string;
  phone: string;
  street: string;
  apartment?: string;
  floor?: string;
  room?: string;
  area: string;
  lat?: number;
  lng?: number;
  notes?: string;
}

export interface Order {
  id: string;
  orderNo: string;
  userId: string;
  items: CartItem[];

  subtotal: number;
  deliveryFee?: number;
  discount?: number;
  total: number;

  status: OrderStatus;
  paymentMethod: PaymentMethod;
  deliveryAddress: DeliveryAddress;
  hpEarned: number;

  lastContactedAt?: string;
  lastContactedStatus?: OrderStatus;

  confirmedAt?: string;
  preparingAt?: string;
  outForDeliveryAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;

  confirmedEtaMinutes?: number;
  adminRemark?: string;

  statusUpdatedAt?: string;

  createdAt: string;
}

export type HPTransactionType = "earned" | "redeemed" | "bonus";

export type UserRole = "customer" | "admin";

export interface User {
  [x: string]: any;
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
  userId: string | null;
  userName: string;
  userEmail?: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface ExperienceReview extends ReviewBase {
  type: "experience";
  visitDate?: string;
  tags?: string[];
}

export interface DishReview extends ReviewBase {
  type: "dish";
  menuItemId: string;
  menuItemName: string;
}

export type Review = ExperienceReview | DishReview;

export type ReservationStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed"
  | "not-visited";

export interface Reservation {
  id: string;
  userId: string | null;

  name: string;
  phone: string;

  guests: number;
  date: string;
  time: string;

  notes?: string;

  status: ReservationStatus;

  completedAt?: string;
  notVisitedAt?: string;
  notVisitedReason?: string;

  createdAt: string;
}

// HP Transaction history
export interface HPTransaction {
  id: string;
  userId: string;
  amount: number;
  type: HPTransactionType;
  description: string;
  orderId?: string;
  createdAt: string;
}

// Saved delivery addresses
export interface SavedAddress {
  id: string;
  userId: string;
  label: string;
  fullName: string;
  phone: string;
  street: string;
  apartment?: string;
  floor?: string;
  room?: string;
  area: string;
  lat?: number;
  lng?: number;
  notes?: string;
  isDefault: boolean;
  createdAt: string;
}

// Referral system
export interface Referral {
  id: string;
  referrerId: string;
  referredUserId: string;
  referralCode: string;
  hpAwarded: number;
  status: "pending" | "completed";
  createdAt: string;
  completedAt?: string;
}

// User extended with referral code
export interface UserReferralInfo {
  referralCode: string;
  totalReferrals: number;
  totalHPEarned: number;
}
