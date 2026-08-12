"use client";

import { useMemo, useState, type FormEvent } from "react";
import {
  currentMonthKey,
  spentByCategory,
  uid,
  useStore,
  EXPENSE_CATEGORIES,
} from "@/lib/store";
import { fmtINR } from "@/lib/format";
import { Card, EmptyState, IconPlus, IconX, Meter, StatusChip } from "./ui";

export default function Budgets() {
  const { state, dispatch } = useStore();
  const [category, setCategory] = useState("");
  const [limit, setLimit] = useState("");

  const monthKey = currentMonthKey();
  const spent = useMemo(() => spentByCategory(state.txns, monthKey), [state.txns, monthKey]);
  const monthName = new Date().toLocaleString("en", { month: "long", year: "numeric" });

  const available = EXPENSE_CATEGORIES.filter(
    (c) => !state.budgets.some((b) => b.category === c),
  );

  const totalLimit = state.budgets.reduce((s, b) => s + b.limit, 0);
  const totalSpent = state.budgets.reduce((s, b) => s + (spent[b.category] ?? 0), 0);

  function onAdd(e: FormEvent) {
    e.preventDefault();
    const cap = parseFloat(limit);
    if (!category || !isFinite(cap) || cap <= 0) return;
    dispatch({ type: "addBudget", budget: { id: uid(), category, limit: Math.round(cap) } });
    setCategory("");
    setLimit("");
  }

  return (
    <Card title="Budgets" subtitle={monthName}>
      {state.budgets.length === 0 ? (
        <EmptyState
          className="py-6"
          title="No budgets yet"
          hint="Set a monthly cap per category — spending tracks against it automatically."
        />
      ) : (
        <ul className="space-y-4">
          {state.budgets.map((b) => {
            const s = spent[b.category] ?? 0;
            const pct = (s / b.limit) * 100;
            const fill =
              pct > 100 ? "var(--color-crit)" : pct >= 85 ? "var(--color-warn)" : "var(--color-s1)";
            return (
              <li key={b.id} className="group">
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    {b.category}
                    {pct > 100 && (
                      <StatusChip tone="crit">Over by {fmtINR(s - b.limit)}</StatusChip>
                    )}
                    {pct >= 85 && pct <= 100 && <StatusChip tone="warn">Near limit</StatusChip>}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold tabular-nums">{fmtINR(s)}</span>
                    <span className="text-xs text-muted tabular-nums">/ {fmtINR(b.limit)}</span>
                    <button
                      onClick={() => dispatch({ type: "deleteBudget", id: b.id })}
                      aria-label={`Remove ${b.category} budget`}
                      className="ml-1 rounded-full p-1 text-muted opacity-0 transition-opacity hover:bg-ink/5 hover:text-ink group-hover:opacity-100 focus-visible:opacity-100"
                    >
                      <IconX size={11} />
                    </button>
                  </span>
                </div>
                <Meter pct={pct} color={fill} label={`${b.category} budget usage`} />
              </li>
            );
          })}
        </ul>
      )}

      {state.budgets.length > 0 && (
        <p className="mt-4 border-t border-ink/[0.06] pt-3 text-xs text-muted">
          <span className="font-semibold text-ink-2 tabular-nums">{fmtINR(totalSpent)}</span> spent
          of <span className="tabular-nums">{fmtINR(totalLimit)}</span> budgeted this month
        </p>
      )}

      {available.length > 0 && (
        <form onSubmit={onAdd} className="mt-4 flex gap-2">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            aria-label="Budget category"
            className="min-w-0 flex-1 rounded-xl border border-ink/10 bg-page px-2.5 py-2 text-sm font-medium text-ink"
          >
            <option value="">Category…</option>
            {available.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <input
            type="number"
            inputMode="numeric"
            min="1"
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
            placeholder="₹ cap"
            aria-label="Monthly cap"
            className="w-24 rounded-xl border border-ink/10 bg-page px-2.5 py-2 text-sm font-semibold tabular-nums"
          />
          <button
            type="submit"
            aria-label="Add budget"
            className="rounded-xl bg-ink px-3 text-surface transition-opacity hover:opacity-85"
          >
            <IconPlus size={13} />
          </button>
        </form>
      )}
    </Card>
  );
}
