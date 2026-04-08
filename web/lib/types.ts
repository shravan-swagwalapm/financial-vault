export interface Transaction {
  id: string;
  merchant_name: string;
  amount: number;
  currency: string;
  amount_inr: number;
  date: string;
  category: Category;
  original_subject: string;
}

export type Category =
  | "Food"
  | "Shopping"
  | "Subscriptions"
  | "Travel"
  | "Bills"
  | "Entertainment"
  | "Health"
  | "Other";

export const CATEGORY_COLORS: Record<Category, string> = {
  Food: "#f97316",
  Shopping: "#8b5cf6",
  Subscriptions: "#06b6d4",
  Travel: "#10b981",
  Bills: "#ef4444",
  Entertainment: "#f59e0b",
  Health: "#ec4899",
  Other: "#6b7280",
};

export const RATES_TO_INR: Record<string, number> = {
  INR: 1,
  USD: 84.5,
  EUR: 92.0,
  GBP: 107.0,
  AED: 23.0,
  SGD: 63.0,
  JPY: 0.56,
};

export function toINR(amount: number, currency: string): number {
  const rate = RATES_TO_INR[currency] ?? 1;
  return Math.round(amount * rate * 100) / 100;
}
