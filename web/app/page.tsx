"use client";

import { useMemo, useState } from "react";
import { useTransactions, useSync } from "../lib/hooks";
import Header from "../components/Header";
import MonthSelector from "../components/MonthSelector";
import CategoryBreakdown from "../components/CategoryBreakdown";

export default function Dashboard() {
  const { transactions, loading, error, reload } = useTransactions();
  const { syncing, sync } = useSync(reload);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!selectedMonth) return transactions;
    return transactions.filter((t) => {
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      return key === selectedMonth;
    });
  }, [transactions, selectedMonth]);

  const dateRange = useMemo(() => {
    if (transactions.length === 0) return "";
    const dates = transactions.map((t) => new Date(t.date)).sort((a, b) => a.getTime() - b.getTime());
    const fmt = (d: Date) => d.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
    return `${fmt(dates[0])} – ${fmt(dates[dates.length - 1])}`;
  }, [transactions]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-20 rounded-lg bg-[var(--bg-secondary)] animate-pulse" />
        <div className="h-12 rounded-lg bg-[var(--bg-secondary)] animate-pulse" />
        <div className="grid grid-cols-2 gap-6">
          <div className="h-64 rounded-lg bg-[var(--bg-secondary)] animate-pulse" />
          <div className="h-64 rounded-lg bg-[var(--bg-secondary)] animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-red-400 text-lg">{error}</p>
        <button onClick={reload} className="mt-4 text-sm text-[var(--accent)] hover:underline">
          Try again
        </button>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-[var(--text-muted)] text-lg">No transactions found.</p>
        <button onClick={sync} className="mt-4 px-4 py-2 text-sm rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)]">
          Sync Gmail
        </button>
      </div>
    );
  }

  return (
    <div>
      <Header transactions={transactions} syncing={syncing} onSync={sync} dateRange={dateRange} />
      <MonthSelector
        transactions={transactions}
        selectedMonth={selectedMonth}
        onSelect={setSelectedMonth}
      />
      <CategoryBreakdown transactions={filtered} />
    </div>
  );
}
