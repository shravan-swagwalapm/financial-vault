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
  syncing: boolean;
  onSync: () => void;
  dateRange: string;
  syncResult?: string | null;
  lastSynced?: Date | null;
}

export default function Header({ transactions, syncing, onSync, dateRange, syncResult, lastSynced }: HeaderProps) {
  const totalSpend = transactions.reduce((sum, t) => sum + t.amount_inr, 0);

  return (
    <div className="flex items-center justify-between mb-8">
      <div>
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
      <div className="flex flex-col items-end gap-1">
        <button
          onClick={onSync}
          disabled={syncing}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {syncing ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Syncing Gmail...
            </>
          ) : (
            "Sync Gmail"
          )}
        </button>
        {syncResult && (
          <span className="text-xs text-emerald-400">{syncResult}</span>
        )}
        {lastSynced && !syncResult && (
          <span className="text-xs text-[var(--text-muted)]">
            Last synced {lastSynced.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
          </span>
        )}
      </div>
    </div>
  );
}
