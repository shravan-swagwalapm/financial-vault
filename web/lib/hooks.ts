"use client";

import { useState, useEffect, useCallback } from "react";
import type { Transaction } from "./types";

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/data/transactions.json?t=${Date.now()}`);
      if (!res.ok) throw new Error("Failed to load transactions");
      const data: Transaction[] = await res.json();
      setTransactions(data);
      setLastSynced(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { transactions, loading, error, reload: load, lastSynced };
}

export function useSync(onComplete: () => void | Promise<void>) {
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  const sync = useCallback(async () => {
    setSyncing(true);
    setError(null);
    setSyncResult(null);
    try {
      // Fetch fresh data (cache-busted)
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/data/transactions.json?t=${Date.now()}`);
      if (!res.ok) throw new Error("Sync failed");
      const data: Transaction[] = await res.json();
      const total = data.reduce((s, t) => s + t.amount_inr, 0);
      const fmt = new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }).format(total);
      setSyncResult(`${data.length} transactions synced — ${fmt} total`);
      await onComplete();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setSyncing(false);
    }
  }, [onComplete]);

  return { syncing, error, sync, syncResult };
}
