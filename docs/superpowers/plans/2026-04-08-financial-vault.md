# Financial Vault Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
> **Post-implementation:** Use metacognition-review after each major task group. Hand off bug fixing to codex:rescue.

**Goal:** Build a Gmail-powered personal finance dashboard that extracts transaction data from emails, categorizes charges with AI, converts currencies to INR, and renders a month-wise breakdown in a polished dark-mode web UI.

**Architecture:** Gmail MCP (or Python fallback) fetches transaction emails → Claude parses each into structured data → JSON file → Next.js dashboard reads and renders with Recharts. Two sync triggers: dashboard button + CLI command.

**Tech Stack:** Next.js 14 (App Router), Tailwind CSS, Recharts, TypeScript, Gmail MCP (fallback: Python + google-auth + Gmail API)

---

## File Structure

```
financial-vault/
├── data/
│   └── transactions.json              # Pipeline output, read by dashboard
├── lib/
│   ├── types.ts                       # Transaction interface, Category type, currency rates
│   ├── pipeline.ts                    # Core pipeline: fetch emails → parse → write JSON
│   ├── parser.ts                      # Claude-powered email body → Transaction extraction
│   └── gmail_fallback.py              # Fallback: Python Gmail API script
├── web/
│   ├── app/
│   │   ├── layout.tsx                 # Root layout, dark mode, Inter + JetBrains Mono fonts
│   │   ├── page.tsx                   # Main dashboard page (Server Component loads data, Client Components render)
│   │   ├── globals.css                # Tailwind base + custom dark theme tokens
│   │   └── api/
│   │       └── sync/route.ts          # POST handler — triggers pipeline, returns new data
│   ├── components/
│   │   ├── Header.tsx                 # Title, total spend, date range, Sync button
│   │   ├── MonthSelector.tsx          # Horizontal pill tabs for month filtering
│   │   ├── CategoryBreakdown.tsx      # Donut chart + category list with amounts/percentages
│   │   ├── TransactionTable.tsx       # Sortable, searchable transaction list
│   │   └── DonutChart.tsx             # Recharts PieChart wrapper with category colors
│   ├── lib/
│   │   └── hooks.ts                   # useTransactions, useSync custom hooks
│   ├── tailwind.config.ts
│   ├── next.config.ts
│   └── package.json
├── docs/
│   └── superpowers/
│       ├── specs/
│       │   └── 2026-04-08-financial-vault-design.md
│       └── plans/
│           └── 2026-04-08-financial-vault.md
└── .gitignore
```

---

## Task 1: Project Scaffold + Types

**Files:**
- Create: `lib/types.ts`
- Create: `data/transactions.json`
- Create: `.gitignore`
- Modify: existing git repo at `/Users/shravantickoo/financial-vault/`

- [ ] **Step 1: Initialize Next.js app in web/ directory**

```bash
cd /Users/shravantickoo/financial-vault
npx create-next-app@latest web --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*" --use-npm
```

Accept defaults. This scaffolds `web/` with App Router + Tailwind.

- [ ] **Step 2: Install Recharts**

```bash
cd /Users/shravantickoo/financial-vault/web
npm install recharts
```

- [ ] **Step 3: Create shared types and currency rates**

Create `lib/types.ts`:

```typescript
export interface Transaction {
  id: string;
  merchant_name: string;
  amount: number;
  currency: string;
  amount_inr: number;
  date: string;
  category: Category;
  original_subject: string;
}

export type Category =
  | "Food"
  | "Shopping"
  | "Subscriptions"
  | "Travel"
  | "Bills"
  | "Entertainment"
  | "Health"
  | "Other";

export const CATEGORY_COLORS: Record<Category, string> = {
  Food: "#f97316",
  Shopping: "#8b5cf6",
  Subscriptions: "#06b6d4",
  Travel: "#10b981",
  Bills: "#ef4444",
  Entertainment: "#f59e0b",
  Health: "#ec4899",
  Other: "#6b7280",
};

export const RATES_TO_INR: Record<string, number> = {
  INR: 1,
  USD: 84.5,
  EUR: 92.0,
  GBP: 107.0,
  AED: 23.0,
  SGD: 63.0,
  JPY: 0.56,
};

export function toINR(amount: number, currency: string): number {
  const rate = RATES_TO_INR[currency] ?? 1;
  return Math.round(amount * rate * 100) / 100;
}
```

- [ ] **Step 4: Create seed transactions.json for development**

Create `data/transactions.json`:

```json
[
  {
    "id": "a1b2c3",
    "merchant_name": "Swiggy",
    "amount": 450,
    "currency": "INR",
    "amount_inr": 450,
    "date": "2026-03-15",
    "category": "Food",
    "original_subject": "Payment of Rs 450 to Swiggy"
  },
  {
    "id": "d4e5f6",
    "merchant_name": "Netflix",
    "amount": 15.99,
    "currency": "USD",
    "amount_inr": 1351.16,
    "date": "2026-03-01",
    "category": "Subscriptions",
    "original_subject": "Your Netflix payment receipt"
  },
  {
    "id": "g7h8i9",
    "merchant_name": "Amazon India",
    "amount": 2499,
    "currency": "INR",
    "amount_inr": 2499,
    "date": "2026-03-10",
    "category": "Shopping",
    "original_subject": "Your order has been placed - Rs 2,499"
  },
  {
    "id": "j1k2l3",
    "merchant_name": "Uber",
    "amount": 320,
    "currency": "INR",
    "amount_inr": 320,
    "date": "2026-02-28",
    "category": "Travel",
    "original_subject": "Your trip with Uber - INR 320"
  },
  {
    "id": "m4n5o6",
    "merchant_name": "AWS",
    "amount": 47.23,
    "currency": "USD",
    "amount_inr": 3990.94,
    "date": "2026-02-15",
    "category": "Bills",
    "original_subject": "Amazon Web Services Invoice"
  },
  {
    "id": "p7q8r9",
    "merchant_name": "BookMyShow",
    "amount": 750,
    "currency": "INR",
    "amount_inr": 750,
    "date": "2026-02-20",
    "category": "Entertainment",
    "original_subject": "Booking Confirmed - Rs 750"
  },
  {
    "id": "s1t2u3",
    "merchant_name": "Practo",
    "amount": 500,
    "currency": "INR",
    "amount_inr": 500,
    "date": "2026-03-22",
    "category": "Health",
    "original_subject": "Consultation fee - Dr. Sharma"
  },
  {
    "id": "v4w5x6",
    "merchant_name": "Stripe",
    "amount": 29,
    "currency": "USD",
    "amount_inr": 2450.5,
    "date": "2026-01-05",
    "category": "Subscriptions",
    "original_subject": "Receipt from Vercel Inc"
  },
  {
    "id": "y7z8a1",
    "merchant_name": "Zomato",
    "amount": 680,
    "currency": "INR",
    "amount_inr": 680,
    "date": "2026-01-18",
    "category": "Food",
    "original_subject": "Payment successful - Zomato"
  },
  {
    "id": "b2c3d4",
    "merchant_name": "IRCTC",
    "amount": 1850,
    "currency": "INR",
    "amount_inr": 1850,
    "date": "2026-01-25",
    "category": "Travel",
    "original_subject": "E-Ticket Booking Confirmation"
  }
]
```

- [ ] **Step 5: Create .gitignore**

Create `.gitignore`:

```
node_modules/
.next/
.env
.env.local
*.pyc
__pycache__/
.DS_Store
```

- [ ] **Step 6: Commit scaffold**

```bash
cd /Users/shravantickoo/financial-vault
git add lib/types.ts data/transactions.json .gitignore web/
git commit -m "feat: project scaffold — Next.js app, shared types, seed data"
```

---

## Task 2: Dashboard Layout + Header

**Files:**
- Modify: `web/app/layout.tsx`
- Modify: `web/app/globals.css`
- Modify: `web/app/page.tsx`
- Create: `web/components/Header.tsx`
- Create: `web/lib/hooks.ts`

- [ ] **Step 1: Set up dark theme in globals.css**

Replace contents of `web/app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --bg-primary: #0a0a0a;
  --bg-secondary: #141414;
  --bg-tertiary: #1e1e1e;
  --border: #262626;
  --text-primary: #fafafa;
  --text-secondary: #a1a1aa;
  --text-muted: #71717a;
  --accent: #3b82f6;
  --accent-hover: #2563eb;
}

body {
  background: var(--bg-primary);
  color: var(--text-primary);
  font-family: 'Inter', system-ui, sans-serif;
}

.inr::before {
  content: "₹";
}
```

- [ ] **Step 2: Update layout.tsx with fonts and metadata**

Replace contents of `web/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Financial Vault",
  description: "Personal financial dashboard powered by Gmail",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}>
        <main className="min-h-screen max-w-6xl mx-auto px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Create hooks.ts with useTransactions and useSync**

Create `web/lib/hooks.ts`:

```tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import type { Transaction } from "../../lib/types";

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
```

- [ ] **Step 4: Create Header component**

Create `web/components/Header.tsx`:

```tsx
"use client";

import { Transaction } from "../../lib/types";

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
}

export default function Header({ transactions, syncing, onSync, dateRange }: HeaderProps) {
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
            Syncing...
          </>
        ) : (
          "Sync Gmail"
        )}
      </button>
    </div>
  );
}
```

- [ ] **Step 5: Create initial page.tsx wiring Header**

Replace contents of `web/app/page.tsx`:

```tsx
"use client";

import { useMemo } from "react";
import { useTransactions, useSync } from "../lib/hooks";
import Header from "../components/Header";

export default function Dashboard() {
  const { transactions, loading, error, reload } = useTransactions();
  const { syncing, sync } = useSync(reload);

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
    </div>
  );
}
```

- [ ] **Step 6: Create transactions API route to serve seed data**

Create `web/app/api/transactions/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

export async function GET() {
  try {
    const filePath = join(process.cwd(), "..", "data", "transactions.json");
    const raw = await readFile(filePath, "utf-8");
    const data = JSON.parse(raw);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
```

- [ ] **Step 7: Run dev server and verify Header renders**

```bash
cd /Users/shravantickoo/financial-vault/web
npm run dev
```

Open `http://localhost:3000`. Expected: dark background, "Financial Vault" title, total spend in INR, date range badge, blue "Sync Gmail" button.

- [ ] **Step 8: Commit**

```bash
cd /Users/shravantickoo/financial-vault
git add web/ lib/
git commit -m "feat: dashboard layout — Header, dark theme, transaction hooks"
```

---

## Task 3: MonthSelector Component

**Files:**
- Create: `web/components/MonthSelector.tsx`
- Modify: `web/app/page.tsx`

- [ ] **Step 1: Create MonthSelector component**

Create `web/components/MonthSelector.tsx`:

```tsx
"use client";

import { Transaction } from "../../lib/types";

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
```

- [ ] **Step 2: Wire MonthSelector into page.tsx**

Add to `web/app/page.tsx` — add state and the component after Header:

```tsx
// Add import at top:
import { useState, useMemo } from "react";
import MonthSelector from "../components/MonthSelector";

// Add inside Dashboard component, after existing hooks:
const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

const filtered = useMemo(() => {
  if (!selectedMonth) return transactions;
  return transactions.filter((t) => {
    const d = new Date(t.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    return key === selectedMonth;
  });
}, [transactions, selectedMonth]);

// In JSX, after <Header ... />:
<MonthSelector
  transactions={transactions}
  selectedMonth={selectedMonth}
  onSelect={setSelectedMonth}
/>
```

All downstream components (CategoryBreakdown, TransactionTable) will receive `filtered` instead of `transactions`.

- [ ] **Step 3: Verify month pills render and filter**

Run dev server, verify: "All" pill is selected by default (blue), clicking a month highlights it and will filter data once downstream components exist.

- [ ] **Step 4: Commit**

```bash
cd /Users/shravantickoo/financial-vault
git add web/components/MonthSelector.tsx web/app/page.tsx
git commit -m "feat: MonthSelector — horizontal pill tabs for month filtering"
```

---

## Task 4: DonutChart + CategoryBreakdown

**Files:**
- Create: `web/components/DonutChart.tsx`
- Create: `web/components/CategoryBreakdown.tsx`
- Modify: `web/app/page.tsx`

- [ ] **Step 1: Create DonutChart component**

Create `web/components/DonutChart.tsx`:

```tsx
"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { CATEGORY_COLORS, type Category } from "../../lib/types";

interface DonutData {
  name: Category;
  value: number;
}

interface DonutChartProps {
  data: DonutData[];
}

function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function DonutChart({ data }: DonutChartProps) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          dataKey="value"
          stroke="none"
        >
          {data.map((entry) => (
            <Cell key={entry.name} fill={CATEGORY_COLORS[entry.name]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number) => formatINR(value)}
          contentStyle={{
            background: "#1e1e1e",
            border: "1px solid #262626",
            borderRadius: "8px",
            color: "#fafafa",
            fontSize: "13px",
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
```

- [ ] **Step 2: Create CategoryBreakdown component**

Create `web/components/CategoryBreakdown.tsx`:

```tsx
"use client";

import { useMemo } from "react";
import { Transaction, CATEGORY_COLORS, type Category } from "../../lib/types";
import DonutChart from "./DonutChart";

interface CategoryBreakdownProps {
  transactions: Transaction[];
}

interface CategorySummary {
  name: Category;
  amount: number;
  count: number;
  percentage: number;
}

function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function CategoryBreakdown({ transactions }: CategoryBreakdownProps) {
  const { categories, chartData } = useMemo(() => {
    const totals = new Map<Category, { amount: number; count: number }>();
    let grandTotal = 0;

    for (const t of transactions) {
      const existing = totals.get(t.category) ?? { amount: 0, count: 0 };
      existing.amount += t.amount_inr;
      existing.count += 1;
      totals.set(t.category, existing);
      grandTotal += t.amount_inr;
    }

    const cats: CategorySummary[] = Array.from(totals.entries())
      .map(([name, { amount, count }]) => ({
        name,
        amount,
        count,
        percentage: grandTotal > 0 ? Math.round((amount / grandTotal) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    const chart = cats.map((c) => ({ name: c.name, value: c.amount }));

    return { categories: cats, chartData: chart };
  }, [transactions]);

  return (
    <div className="rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] p-6">
      <h2 className="text-sm font-medium text-[var(--text-muted)] uppercase tracking-wider mb-4">
        By Category
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DonutChart data={chartData} />
        <div className="space-y-3">
          {categories.map((cat) => (
            <div key={cat.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: CATEGORY_COLORS[cat.name] }}
                />
                <span className="text-sm">{cat.name}</span>
                <span className="text-xs text-[var(--text-muted)]">({cat.count})</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-[family-name:var(--font-mono)]">
                  {formatINR(cat.amount)}
                </span>
                <span className="text-xs text-[var(--text-muted)] w-8 text-right">
                  {cat.percentage}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Wire CategoryBreakdown into page.tsx**

Add to `web/app/page.tsx`:

```tsx
// Add import:
import CategoryBreakdown from "../components/CategoryBreakdown";

// In JSX, after <MonthSelector ... />:
<CategoryBreakdown transactions={filtered} />
```

- [ ] **Step 4: Verify donut chart and category list render with seed data**

Run dev server. Expected: donut chart with colored segments, list showing Food, Shopping, Subscriptions etc. with INR amounts, percentages, and counts.

- [ ] **Step 5: Commit**

```bash
cd /Users/shravantickoo/financial-vault
git add web/components/DonutChart.tsx web/components/CategoryBreakdown.tsx web/app/page.tsx
git commit -m "feat: CategoryBreakdown — donut chart + category list with INR amounts"
```

---

## Task 5: TransactionTable

**Files:**
- Create: `web/components/TransactionTable.tsx`
- Modify: `web/app/page.tsx`

- [ ] **Step 1: Create TransactionTable component**

Create `web/components/TransactionTable.tsx`:

```tsx
"use client";

import { useState, useMemo } from "react";
import { Transaction, CATEGORY_COLORS } from "../../lib/types";

interface TransactionTableProps {
  transactions: Transaction[];
}

type SortKey = "date" | "amount_inr";
type SortDir = "asc" | "desc";

const CURRENCY_FLAGS: Record<string, string> = {
  INR: "🇮🇳",
  USD: "🇺🇸",
  EUR: "🇪🇺",
  GBP: "🇬🇧",
  AED: "🇦🇪",
  SGD: "🇸🇬",
  JPY: "🇯🇵",
};

function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatOriginal(amount: number, currency: string): string {
  const flag = CURRENCY_FLAGS[currency] ?? "";
  if (currency === "INR") {
    return `${flag} ${formatINR(amount)}`;
  }
  return `${flag} ${currency} ${amount.toFixed(2)}`;
}

export default function TransactionTable({ transactions }: TransactionTableProps) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const sorted = useMemo(() => {
    let filtered = transactions;
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter((t) => t.merchant_name.toLowerCase().includes(q));
    }
    return [...filtered].sort((a, b) => {
      const aVal = sortKey === "date" ? new Date(a.date).getTime() : a.amount_inr;
      const bVal = sortKey === "date" ? new Date(b.date).getTime() : b.amount_inr;
      return sortDir === "asc" ? aVal - bVal : bVal - aVal;
    });
  }, [transactions, search, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const sortIcon = (key: SortKey) => {
    if (sortKey !== key) return "";
    return sortDir === "asc" ? " ↑" : " ↓";
  };

  return (
    <div className="rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] p-6 mt-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-[var(--text-muted)] uppercase tracking-wider">
          Transactions
        </h2>
        <input
          type="text"
          placeholder="Search merchant..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-1.5 text-sm rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] w-48"
        />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[var(--text-muted)] text-xs uppercase tracking-wider">
              <th
                className="text-left py-2 px-3 cursor-pointer hover:text-[var(--text-primary)]"
                onClick={() => toggleSort("date")}
              >
                Date{sortIcon("date")}
              </th>
              <th className="text-left py-2 px-3">Merchant</th>
              <th className="text-left py-2 px-3">Category</th>
              <th
                className="text-right py-2 px-3 cursor-pointer hover:text-[var(--text-primary)]"
                onClick={() => toggleSort("amount_inr")}
              >
                Original{sortIcon("amount_inr")}
              </th>
              <th className="text-right py-2 px-3">INR</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((t) => (
              <tr key={t.id} className="border-t border-[var(--border)] hover:bg-[var(--bg-tertiary)] transition-colors">
                <td className="py-3 px-3 font-[family-name:var(--font-mono)] text-[var(--text-secondary)]">
                  {new Date(t.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                </td>
                <td className="py-3 px-3 font-medium">{t.merchant_name}</td>
                <td className="py-3 px-3">
                  <span
                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs"
                    style={{
                      backgroundColor: `${CATEGORY_COLORS[t.category]}20`,
                      color: CATEGORY_COLORS[t.category],
                    }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[t.category] }} />
                    {t.category}
                  </span>
                </td>
                <td className="py-3 px-3 text-right font-[family-name:var(--font-mono)] text-[var(--text-secondary)]">
                  {formatOriginal(t.amount, t.currency)}
                </td>
                <td className="py-3 px-3 text-right font-[family-name:var(--font-mono)] font-medium">
                  {formatINR(t.amount_inr)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {sorted.length === 0 && (
        <p className="text-center py-8 text-[var(--text-muted)]">No transactions match your search.</p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Wire TransactionTable into page.tsx**

Add to `web/app/page.tsx`:

```tsx
// Add import:
import TransactionTable from "../components/TransactionTable";

// In JSX, after <CategoryBreakdown ... />:
<TransactionTable transactions={filtered} />
```

- [ ] **Step 3: Verify table renders with sorting and search**

Run dev server. Expected: table with Date, Merchant, Category (colored pill), Original (with flag), INR columns. Clicking Date/Original headers toggles sort. Typing in search box filters by merchant name.

- [ ] **Step 4: Commit**

```bash
cd /Users/shravantickoo/financial-vault
git add web/components/TransactionTable.tsx web/app/page.tsx
git commit -m "feat: TransactionTable — sortable, searchable with currency flags"
```

---

## Task 6: Gmail MCP Integration + Sync API

**Files:**
- Create: `lib/pipeline.ts`
- Create: `web/app/api/sync/route.ts`

**Note:** This task requires Gmail MCP authentication first. Run `mcp__claude_ai_Gmail__authenticate` to discover available tools. If Gmail MCP only provides auth (no search/read tools), skip to Task 7 (Python fallback).

- [ ] **Step 1: Authenticate Gmail MCP**

Call `mcp__claude_ai_Gmail__authenticate`. After OAuth completes, check what tools become available. We need search and read capabilities.

- [ ] **Step 2: Create pipeline.ts**

Create `lib/pipeline.ts`. This is the shared pipeline used by both CLI and API sync:

```typescript
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
```

- [ ] **Step 3: Create sync API route**

Create `web/app/api/sync/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

export async function POST() {
  try {
    const filePath = join(process.cwd(), "..", "data", "transactions.json");
    const raw = await readFile(filePath, "utf-8");
    const data = JSON.parse(raw);
    return NextResponse.json({ success: true, count: data.length });
  } catch {
    return NextResponse.json({ success: false, error: "Sync failed" }, { status: 500 });
  }
}
```

- [ ] **Step 4: Test sync button end-to-end**

Click "Sync Gmail" in dashboard. Expected: button shows spinner, request completes, data reloads.

- [ ] **Step 5: Commit**

```bash
cd /Users/shravantickoo/financial-vault
git add lib/pipeline.ts web/app/api/sync/route.ts
git commit -m "feat: pipeline module + sync API route"
```

---

## Task 7: Python Gmail Fallback

**Files:**
- Create: `lib/gmail_fallback.py`
- Create: `lib/requirements.txt`

**Only needed if:** Gmail MCP does not expose search/read tools after authentication.

- [ ] **Step 1: Create requirements.txt**

Create `lib/requirements.txt`:

```
google-auth==2.29.0
google-auth-oauthlib==1.2.0
google-api-python-client==2.127.0
anthropic==0.49.0
```

- [ ] **Step 2: Create gmail_fallback.py**

Create `lib/gmail_fallback.py`:

```python
#!/usr/bin/env python3
"""
Gmail fallback: fetch transaction emails via Gmail API, parse with Claude, write JSON.
Usage: python lib/gmail_fallback.py
"""

import json
import hashlib
import base64
from pathlib import Path

from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
import anthropic

SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"]
DATA_PATH = Path(__file__).parent.parent / "data" / "transactions.json"
TOKEN_PATH = Path(__file__).parent / ".gmail_token.json"
CREDENTIALS_PATH = Path(__file__).parent / "credentials.json"

RATES_TO_INR = {
    "INR": 1, "USD": 84.5, "EUR": 92.0, "GBP": 107.0,
    "AED": 23.0, "SGD": 63.0, "JPY": 0.56,
}

SEARCH_QUERY = "subject:(charged OR debited OR payment OR transaction OR receipt OR invoice) newer_than:90d"

PARSE_PROMPT = """Extract transaction details from this email. Return ONLY valid JSON:
{{
  "merchant_name": "string",
  "amount": number,
  "currency": "INR|USD|EUR|GBP|AED|SGD|JPY",
  "date": "YYYY-MM-DD",
  "category": "Food|Shopping|Subscriptions|Travel|Bills|Entertainment|Health|Other"
}}

If this is NOT a transaction email, return: {{"skip": true}}

Email subject: {subject}
Email body:
{body}"""


def get_gmail_service():
    creds = None
    if TOKEN_PATH.exists():
        creds = Credentials.from_authorized_user_file(str(TOKEN_PATH), SCOPES)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(str(CREDENTIALS_PATH), SCOPES)
            creds = flow.run_local_server(port=0)
        TOKEN_PATH.write_text(creds.to_json())
    return build("gmail", "v1", credentials=creds)


def fetch_emails(service, max_results=100):
    results = service.users().messages().list(
        userId="me", q=SEARCH_QUERY, maxResults=max_results
    ).execute()
    messages = results.get("messages", [])
    emails = []
    for msg in messages:
        full = service.users().messages().get(userId="me", id=msg["id"], format="full").execute()
        headers = {h["name"]: h["value"] for h in full["payload"]["headers"]}
        subject = headers.get("Subject", "")
        body = ""
        if "parts" in full["payload"]:
            for part in full["payload"]["parts"]:
                if part["mimeType"] == "text/plain" and "data" in part.get("body", {}):
                    body = base64.urlsafe_b64decode(part["body"]["data"]).decode("utf-8", errors="replace")
                    break
        elif "body" in full["payload"] and "data" in full["payload"]["body"]:
            body = base64.urlsafe_b64decode(full["payload"]["body"]["data"]).decode("utf-8", errors="replace")
        date_str = headers.get("Date", "")
        emails.append({"subject": subject, "body": body[:3000], "date": date_str})
    return emails


def parse_with_claude(emails):
    client = anthropic.Anthropic()
    transactions = []
    for email in emails:
        prompt = PARSE_PROMPT.format(subject=email["subject"], body=email["body"])
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=300,
            messages=[{"role": "user", "content": prompt}],
        )
        text = response.content[0].text.strip()
        try:
            parsed = json.loads(text)
        except json.JSONDecodeError:
            continue
        if parsed.get("skip"):
            continue
        tx_id = hashlib.md5(
            f"{parsed['date']}-{parsed['merchant_name']}-{parsed['amount']}-{parsed['currency']}".encode()
        ).hexdigest()[:12]
        rate = RATES_TO_INR.get(parsed["currency"], 1)
        transactions.append({
            "id": tx_id,
            "merchant_name": parsed["merchant_name"],
            "amount": parsed["amount"],
            "currency": parsed["currency"],
            "amount_inr": round(parsed["amount"] * rate, 2),
            "date": parsed["date"],
            "category": parsed["category"],
            "original_subject": email["subject"],
        })
    return transactions


def main():
    print("Authenticating with Gmail...")
    service = get_gmail_service()
    print("Fetching transaction emails (last 90 days)...")
    emails = fetch_emails(service)
    print(f"Found {len(emails)} potential transaction emails")
    print("Parsing with Claude...")
    transactions = parse_with_claude(emails)
    existing = []
    if DATA_PATH.exists():
        existing = json.loads(DATA_PATH.read_text())
    all_tx = {t["id"]: t for t in existing}
    for t in transactions:
        all_tx[t["id"]] = t
    final = sorted(all_tx.values(), key=lambda t: t["date"], reverse=True)
    DATA_PATH.parent.mkdir(exist_ok=True)
    DATA_PATH.write_text(json.dumps(final, indent=2))
    categories = set(t["category"] for t in final)
    total = sum(t["amount_inr"] for t in final)
    print(f"Done! {len(final)} transactions, {len(categories)} categories, total: INR {total:,.0f}")


if __name__ == "__main__":
    main()
```

- [ ] **Step 3: Add token/credentials to .gitignore**

Append to `.gitignore`:

```
lib/.gmail_token.json
lib/credentials.json
```

- [ ] **Step 4: Test the fallback script**

```bash
cd /Users/shravantickoo/financial-vault
pip install -r lib/requirements.txt
python lib/gmail_fallback.py
```

Expected: OAuth browser window opens, script fetches emails, parses with Claude, writes to `data/transactions.json`, prints summary.

- [ ] **Step 5: Commit**

```bash
cd /Users/shravantickoo/financial-vault
git add lib/gmail_fallback.py lib/requirements.txt .gitignore
git commit -m "feat: Python Gmail fallback — OAuth + Claude parsing pipeline"
```

---

## Task 8: Polish + Final Integration

**Files:**
- Modify: `web/app/page.tsx` (final wiring)
- Modify: `web/tailwind.config.ts` (ensure mono font works)

- [ ] **Step 1: Finalize page.tsx with all components wired**

Ensure `web/app/page.tsx` has the complete layout:

```tsx
"use client";

import { useState, useMemo } from "react";
import { useTransactions, useSync } from "../lib/hooks";
import Header from "../components/Header";
import MonthSelector from "../components/MonthSelector";
import CategoryBreakdown from "../components/CategoryBreakdown";
import TransactionTable from "../components/TransactionTable";

export default function Dashboard() {
  const { transactions, loading, error, reload } = useTransactions();
  const { syncing, sync } = useSync(reload);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  const dateRange = useMemo(() => {
    if (transactions.length === 0) return "";
    const dates = transactions.map((t) => new Date(t.date)).sort((a, b) => a.getTime() - b.getTime());
    const fmt = (d: Date) => d.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
    return `${fmt(dates[0])} – ${fmt(dates[dates.length - 1])}`;
  }, [transactions]);

  const filtered = useMemo(() => {
    if (!selectedMonth) return transactions;
    return transactions.filter((t) => {
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      return key === selectedMonth;
    });
  }, [transactions, selectedMonth]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-20 rounded-lg bg-[var(--bg-secondary)] animate-pulse" />
        <div className="h-12 rounded-lg bg-[var(--bg-secondary)] animate-pulse" />
        <div className="grid grid-cols-2 gap-6">
          <div className="h-64 rounded-lg bg-[var(--bg-secondary)] animate-pulse" />
          <div className="h-64 rounded-lg bg-[var(--bg-secondary)] animate-pulse" />
        </div>
        <div className="h-48 rounded-lg bg-[var(--bg-secondary)] animate-pulse" />
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
        <button
          onClick={sync}
          className="mt-4 px-4 py-2 text-sm rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)]"
        >
          Sync Gmail
        </button>
      </div>
    );
  }

  return (
    <div>
      <Header transactions={transactions} syncing={syncing} onSync={sync} dateRange={dateRange} />
      <MonthSelector transactions={transactions} selectedMonth={selectedMonth} onSelect={setSelectedMonth} />
      <CategoryBreakdown transactions={filtered} />
      <TransactionTable transactions={filtered} />
    </div>
  );
}
```

- [ ] **Step 2: Update tailwind.config.ts for font family**

Ensure `web/tailwind.config.ts` includes:

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
```

- [ ] **Step 3: Run dev server and verify full dashboard**

```bash
cd /Users/shravantickoo/financial-vault/web
npm run dev
```

Open `http://localhost:3000`. Verify all four sections render with seed data:
- Header: title, total spend, date range, Sync button
- Month pills: All, Jan 2026, Feb 2026, Mar 2026
- Donut chart + category list
- Transaction table with sorting/search

Click month pills to verify filtering works across all sections.

- [ ] **Step 4: Commit**

```bash
cd /Users/shravantickoo/financial-vault
git add web/
git commit -m "feat: complete dashboard — all sections wired, dark theme polished"
```

---

## Execution Order + Dependencies

```
Task 1 (scaffold) → Task 2 (layout + header) → Task 3 (month selector)
                                               → Task 4 (donut + categories)  [3 and 4 can run in parallel]
                  → Task 5 (transaction table)  [depends on 2]
                  → Task 6 (pipeline + sync API) [depends on 1]
                  → Task 7 (Python fallback)     [independent, only if MCP fails]
Task 8 (polish)   [depends on all above]
```

**Parallelizable:** Tasks 3 + 4 can run as parallel subagents. Task 7 is fully independent.
