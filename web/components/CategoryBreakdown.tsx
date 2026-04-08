"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import { Transaction, CATEGORY_COLORS, type Category } from "../lib/types";

const DonutChart = dynamic(() => import("./DonutChart"), { ssr: false });

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
