import { writeFile, readFile } from "fs/promises";
import { join } from "path";
import { createHash } from "crypto";
import { type Transaction, type Category, toINR } from "./types";

const DATA_PATH = join(__dirname, "..", "data", "transactions.json");

export interface ParsedTransaction {
  merchant_name: string;
  amount: number;
  currency: string;
  date: string;
  category: Category;
}

function generateId(t: ParsedTransaction): string {
  const input = `${t.date}-${t.merchant_name}-${t.amount}-${t.currency}`;
  return createHash("md5").update(input).digest("hex").slice(0, 12);
}

export function buildTransaction(parsed: ParsedTransaction, subject: string): Transaction {
  return {
    id: generateId(parsed),
    merchant_name: parsed.merchant_name,
    amount: parsed.amount,
    currency: parsed.currency,
    amount_inr: toINR(parsed.amount, parsed.currency),
    date: parsed.date,
    category: parsed.category,
    original_subject: subject,
  };
}

export async function loadExisting(): Promise<Transaction[]> {
  try {
    const raw = await readFile(DATA_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function saveTransactions(transactions: Transaction[]): Promise<void> {
  const deduped = Array.from(new Map(transactions.map((t) => [t.id, t])).values());
  deduped.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  await writeFile(DATA_PATH, JSON.stringify(deduped, null, 2));
}

export function getSummary(transactions: Transaction[]): string {
  const categories = new Set(transactions.map((t) => t.category));
  const total = transactions.reduce((sum, t) => sum + t.amount_inr, 0);
  const formatted = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(total);
  return `Found ${transactions.length} transactions, ${categories.size} categories, total: ${formatted}`;
}
