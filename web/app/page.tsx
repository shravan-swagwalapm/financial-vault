"use client";

import { useMemo, useState } from "react";
import { useTransactions } from "../lib/hooks";
import { parseTransactionDate, toMonthKey } from "../lib/date";
import Header from "../components/Header";
import MonthSelector from "../components/MonthSelector";
import CategoryBreakdown from "../components/CategoryBreakdown";
import TransactionTable from "../components/TransactionTable";

export default function Dashboard() {
  const { transactions, loading, error, reload } = useTransactions();
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!selectedMonth) return transactions;
    return transactions.filter((t) => toMonthKey(t.date) === selectedMonth);
  }, [transactions, selectedMonth]);

  const dateRange = useMemo(() => {
    if (filtered.length === 0) return "";
    const dates = filtered
      .map((t) => parseTransactionDate(t.date))
      .sort((a, b) => a.getTime() - b.getTime());
    const fmt = (d: Date) => d.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
    const start = fmt(dates[0]);
    const end = fmt(dates[dates.length - 1]);
    return start === end ? start : `${start} – ${end}`;
  }, [filtered]);

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
        <p className="mt-2 text-sm text-[var(--text-muted)]">Run <code className="font-[family-name:var(--font-mono)] text-[var(--accent)]">/sync-financial-vault</code> in Claude Code to sync Gmail.</p>
      </div>
    );
  }

  return (
    <div>
      <Header transactions={filtered} dateRange={dateRange} />
      <MonthSelector
        transactions={transactions}
        selectedMonth={selectedMonth}
        onSelect={setSelectedMonth}
      />
      <CategoryBreakdown transactions={filtered} />
      <TransactionTable transactions={filtered} />
    </div>
  );
}
