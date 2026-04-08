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
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/data/transactions.json?t=${Date.now()}`);
      if (!res.ok) throw new Error("Failed to load transactions");
      const data: Transaction[] = await res.json();
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
