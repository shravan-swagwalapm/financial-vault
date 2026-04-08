"use client";

import { useMemo, useState } from "react";
import { useTransactions, useSync } from "../lib/hooks";
import { parseTransactionDate, toMonthKey } from "../lib/date";
import Header from "../components/Header";
import MonthSelector from "../components/MonthSelector";
import CategoryBreakdown from "../components/CategoryBreakdown";
import TransactionTable from "../components/TransactionTable";

export default function Dashboard() {
  const { transactions, loading, error, reload, lastSynced } = useTransactions();
  const { syncing, error: syncError, sync, syncResult } = useSync(reload);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!selectedMonth) return transactions;
    return transactions.filter((t) => toMonthKey(t.date) === selectedMonth);
  }, [transactions, selectedMonth]);

  const dateRange = useMemo(() => {
    if (transactions.length === 0) return "";
    const dates = transactions
      .map((t) => parseTransactionDate(t.date))
      .sort((a, b) => a.getTime() - b.getTime());
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
        {syncError && <p className="mt-4 text-sm text-red-400">{syncError}</p>}
        <button
          onClick={sync}
          disabled={syncing}
          className="mt-4 px-4 py-2 text-sm rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {syncing ? "Syncing..." : "Sync Gmail"}
        </button>
      </div>
    );
  }

  return (
    <div>
      <Header transactions={transactions} syncing={syncing} onSync={sync} dateRange={dateRange} syncResult={syncResult} lastSynced={lastSynced} />
      {syncError && <p className="mb-4 text-sm text-red-400">{syncError}</p>}
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
