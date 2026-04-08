# Financial Vault — Design Spec

**Date:** 2026-04-08
**Purpose:** Teaching demo for live audience — "how to build a personal financial dashboard with Claude Code + Gmail MCP"
**Approach:** Pre-build core, walk through key parts live on stream

---

## Overview

A personal financial vault that reads transaction emails from Gmail, uses Claude to parse and categorize charges, converts multi-currency amounts to INR, and renders a clean web dashboard with month-wise breakdowns.

Two sync paths: a "Sync" button in the dashboard UI, and a CLI command for terminal users.

## Architecture

### Primary Path: Gmail MCP Pipeline

```
Gmail MCP Auth
  → Search emails (keywords: "charged", "debited", "payment", "transaction", "receipt", "invoice")
  → Fetch email bodies (last 90 days)
  → Claude parses each email → extracts structured data
  → Convert non-INR amounts to INR (static rate table)
  → Write to data/transactions.json
```

### Fallback Path: Python Gmail API

If Gmail MCP cannot search/read email bodies, swap to a Python script using `google-auth` + Gmail API. Same JSON output — dashboard doesn't change.

```
Python script (OAuth2)
  → Gmail API search + fetch
  → Claude API for parsing
  → Write to data/transactions.json
```

## Data Schema

### Transaction (per entry in transactions.json)

```typescript
interface Transaction {
  id: string;                  // hash of date+merchant+amount for dedup
  merchant_name: string;
  amount: number;
  currency: string;            // "INR", "USD", etc.
  amount_inr: number;          // converted amount
  date: string;                // ISO 8601
  category: Category;
  original_subject: string;    // email subject line
}

type Category =
  | "Food"
  | "Shopping"
  | "Subscriptions"
  | "Travel"
  | "Bills"
  | "Entertainment"
  | "Health"
  | "Other";
```

### Currency Rates

Static object in shared `lib/types.ts` (project root, not under web/):

```typescript
const RATES_TO_INR: Record<string, number> = {
  INR: 1,
  USD: 84.5,
  EUR: 92.0,
  GBP: 107.0,
};
```

## Dashboard UI

**Stack:** Next.js (App Router) + Tailwind + Recharts
**Design:** Dark mode, "like Linear" — high density, monospace accents, muted category colors

### Layout — Single Page, Four Sections

1. **Header** — "Financial Vault" title + total spend in INR + date range badge + Sync button (spinner state while syncing)

2. **Month Selector** — horizontal pill tabs for each month. Filters everything below.

3. **Category Breakdown** — donut chart + list view:
   - Category icon + name
   - Amount in INR
   - % of total
   - Transaction count

4. **Transaction Table** — scrollable list for selected month:
   - Date | Merchant | Category | Original Amount (with currency) | INR Amount
   - Sortable by date/amount
   - Search/filter by merchant name

### Four States

- **Loading** — skeleton cards
- **Empty** — "No transactions found. Click Sync to fetch from Gmail."
- **Error** — "Could not load transaction data."
- **Success** — full dashboard

## Sync Mechanism

### Dashboard Sync (button)
- POST `/api/sync` endpoint in Next.js
- Runs pipeline → regenerates `data/transactions.json`
- Dashboard auto-refreshes after completion
- Button shows spinner + "Syncing..." during run

### CLI Sync
- `npx tsx lib/pipeline.ts` or equivalent command
- Uses shared `lib/pipeline.ts` module (same as API route)
- Outputs summary to terminal: "Found 47 transactions, 6 categories, total: 1,23,456 INR"

## Project Structure

```
financial-vault/
├── data/
│   └── transactions.json
├── lib/
│   ├── types.ts                   # Transaction type + currency rates
│   ├── pipeline.ts                # Shared pipeline logic (used by CLI + API)
│   └── gmail_fallback.py          # Fallback: Python Gmail API
├── web/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── globals.css
│   │   └── api/
│   │       └── sync/route.ts      # POST — calls shared pipeline
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── MonthSelector.tsx
│   │   ├── CategoryBreakdown.tsx
│   │   ├── TransactionTable.tsx
│   │   └── DonutChart.tsx
│   ├── tailwind.config.ts
│   ├── next.config.ts
│   └── package.json
└── docs/
    └── superpowers/specs/
        └── 2026-04-08-financial-vault-design.md
```

## Not Building (YAGNI)

- No auth/login (personal tool, local)
- No database (JSON file is sufficient)
- No real-time Gmail sync (manual trigger only)
- No SMS integration (V2)
- No PDF statement parsing (V2)
- No export/PDF reports
- No deployment (local demo)

## Risk: Gmail MCP Capability

**Unknown:** Whether Gmail MCP can search emails by keyword and return full email bodies.

**Mitigation:** Test MCP first. If it only does auth, fall back to Python Gmail API script. Dashboard is decoupled from data source — only reads `transactions.json`.

## Demo Flow (for live stream)

1. Show the finished dashboard (pre-built)
2. Walk through the pipeline: "here's how we connect Gmail"
3. Trigger a live sync — audience watches transactions populate
4. Explain the Claude parsing: how unstructured emails become structured data
5. Show category breakdown updating in real-time
6. Discuss what V2 would look like (SMS, PDF statements, multi-user)
