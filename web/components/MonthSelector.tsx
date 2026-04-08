"use client";

import { Transaction } from "../lib/types";

interface MonthSelectorProps {
  transactions: Transaction[];
  selectedMonth: string | null;
  onSelect: (month: string | null) => void;
}

export default function MonthSelector({ transactions, selectedMonth, onSelect }: MonthSelectorProps) {
  const months = Array.from(
    new Set(
      transactions.map((t) => {
        const d = new Date(t.date);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      })
    )
  ).sort();

  const formatMonth = (key: string) => {
    const [year, month] = key.split("-");
    return new Date(Number(year), Number(month) - 1).toLocaleDateString("en-IN", {
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
      <button
        onClick={() => onSelect(null)}
        className={`px-3 py-1.5 text-sm rounded-full whitespace-nowrap transition-colors ${
          selectedMonth === null
            ? "bg-[var(--accent)] text-white"
            : "bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border)]"
        }`}
      >
        All
      </button>
      {months.map((m) => (
        <button
          key={m}
          onClick={() => onSelect(m)}
          className={`px-3 py-1.5 text-sm rounded-full whitespace-nowrap transition-colors ${
            selectedMonth === m
              ? "bg-[var(--accent)] text-white"
              : "bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border)]"
          }`}
        >
          {formatMonth(m)}
        </button>
      ))}
    </div>
  );
}
