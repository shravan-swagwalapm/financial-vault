"use client";

import { useState, useEffect, useCallback } from "react";
import type { Transaction } from "./types";

async function getErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const data: unknown = await res.json();
    if (
      typeof data === "object" &&
      data !== null &&
      "error" in data &&
      typeof data.error === "string" &&
      data.error
    ) {
      return data.error;
    }
  } catch {
    // Ignore invalid error payloads and fall back to the generic message.
  }

  return fallback;
}

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/transactions");
      if (!res.ok) {
        throw new Error(await getErrorMessage(res, "Failed to load transactions"));
      }
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

export function useSync(onComplete: () => void | Promise<void>) {
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sync = useCallback(async () => {
    setSyncing(true);
    setError(null);
    try {
      const res = await fetch("/api/sync", { method: "POST" });
      if (!res.ok) {
        throw new Error(await getErrorMessage(res, "Sync failed"));
      }
      await onComplete();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setSyncing(false);
    }
  }, [onComplete]);

  return { syncing, error, sync };
}
