"use client";

import { Transaction } from "../lib/types";

function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

interface HeaderProps {
  transactions: Transaction[];
  dateRange: string;
}

export default function Header({ transactions, dateRange }: HeaderProps) {
  const totalSpend = transactions.reduce((sum, t) => sum + t.amount_inr, 0);

  return (
    <div className="mb-8">
      <h1 className="text-2xl font-semibold tracking-tight">Financial Vault</h1>
      <div className="flex items-center gap-3 mt-1">
        <span className="text-3xl font-bold font-[family-name:var(--font-mono)]">
          {formatINR(totalSpend)}
        </span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--bg-tertiary)] text-[var(--text-muted)] border border-[var(--border)]">
          {dateRange}
        </span>
      </div>
    </div>
  );
}
