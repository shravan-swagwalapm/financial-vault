"use client";

import { useState, useMemo } from "react";
import { Transaction, CATEGORY_COLORS } from "../lib/types";
import { parseTransactionDate } from "../lib/date";

interface TransactionTableProps {
  transactions: Transaction[];
}

type SortKey = "date" | "amount_inr";
type SortDir = "asc" | "desc";

const CURRENCY_FLAGS: Record<string, string> = {
  INR: "🇮🇳",
  USD: "🇺🇸",
  EUR: "🇪🇺",
  GBP: "🇬🇧",
  AED: "🇦🇪",
  SGD: "🇸🇬",
  JPY: "🇯🇵",
};

function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatOriginal(amount: number, currency: string): string {
  const flag = CURRENCY_FLAGS[currency] ?? "";
  if (currency === "INR") {
    return `${flag} ${formatINR(amount)}`;
  }
  return `${flag} ${currency} ${amount.toFixed(2)}`;
}

export default function TransactionTable({ transactions }: TransactionTableProps) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const sorted = useMemo(() => {
    let filtered = transactions;
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter((t) => t.merchant_name.toLowerCase().includes(q));
    }
    return [...filtered].sort((a, b) => {
      const aVal = sortKey === "date" ? parseTransactionDate(a.date).getTime() : a.amount_inr;
      const bVal = sortKey === "date" ? parseTransactionDate(b.date).getTime() : b.amount_inr;
      return sortDir === "asc" ? aVal - bVal : bVal - aVal;
    });
  }, [transactions, search, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const sortIcon = (key: SortKey) => {
    if (sortKey !== key) return "";
    return sortDir === "asc" ? " ↑" : " ↓";
  };

  return (
    <div className="rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] p-6 mt-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-[var(--text-muted)] uppercase tracking-wider">
          Transactions
        </h2>
        <input
          type="text"
          placeholder="Search merchant..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-1.5 text-sm rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] w-48"
        />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[var(--text-muted)] text-xs uppercase tracking-wider">
              <th
                className="text-left py-2 px-3 cursor-pointer hover:text-[var(--text-primary)]"
                onClick={() => toggleSort("date")}
              >
                Date{sortIcon("date")}
              </th>
              <th className="text-left py-2 px-3">Merchant</th>
              <th className="text-left py-2 px-3">Category</th>
              <th
                className="text-right py-2 px-3 cursor-pointer hover:text-[var(--text-primary)]"
                onClick={() => toggleSort("amount_inr")}
              >
                Original{sortIcon("amount_inr")}
              </th>
              <th className="text-right py-2 px-3">INR</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((t) => (
              <tr key={t.id} className="border-t border-[var(--border)] hover:bg-[var(--bg-tertiary)] transition-colors">
                <td className="py-3 px-3 font-[family-name:var(--font-mono)] text-[var(--text-secondary)]">
                  {parseTransactionDate(t.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                </td>
                <td className="py-3 px-3 font-medium">{t.merchant_name}</td>
                <td className="py-3 px-3">
                  <span
                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs"
                    style={{
                      backgroundColor: `${CATEGORY_COLORS[t.category]}20`,
                      color: CATEGORY_COLORS[t.category],
                    }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[t.category] }} />
                    {t.category}
                  </span>
                </td>
                <td className="py-3 px-3 text-right font-[family-name:var(--font-mono)] text-[var(--text-secondary)]">
                  {formatOriginal(t.amount, t.currency)}
                </td>
                <td className="py-3 px-3 text-right font-[family-name:var(--font-mono)] font-medium">
                  {formatINR(t.amount_inr)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {sorted.length === 0 && (
        <p className="text-center py-8 text-[var(--text-muted)]">No transactions match your search.</p>
      )}
    </div>
  );
}
