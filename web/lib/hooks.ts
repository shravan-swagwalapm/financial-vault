"use client";

import { useState, useEffect, useCallback } from "react";
import type { Transaction } from "./types";

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/transactions");
      if (!res.ok) throw new Error("Failed to load transactions");
      const data = await res.json();
      setTransactions(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { transactions, loading, error, reload: load };
}

export function useSync(onComplete: () => void) {
  const [syncing, setSyncing] = useState(false);

  const sync = useCallback(async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/sync", { method: "POST" });
      if (!res.ok) throw new Error("Sync failed");
      onComplete();
    } finally {
      setSyncing(false);
    }
  }, [onComplete]);

  return { syncing, sync };
}
