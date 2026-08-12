"use client";

import { useMemo } from "react";
import { currentMonthKey, monthTotals, uid, useStore, MAX_BUCKETS } from "@/lib/store";
import { fmtINR } from "@/lib/format";
import { Card, IconPlus, IconX, Segmented, StatusChip } from "./ui";

// validated categorical order — slot color follows the bucket's position
const SLOT_COLORS = [
  "var(--color-s1)",
  "var(--color-s2)",
  "var(--color-s3)",
  "var(--color-s4)",
  "var(--color-s5)",
];
// inside-segment label ink picked by fill luminance
const SLOT_LABEL = ["#ffffff", "#ffffff", "#0b0b0b", "#0b0b0b", "#0b0b0b"];

export default function Allocator() {
  const { state, dispatch } = useStore();
  const monthIncome = useMemo(
    () => monthTotals(state.txns, currentMonthKey()).income,
    [state.txns],
  );

  const base = state.allocBase ?? monthIncome;
  const totalPct = state.buckets.reduce((s, b) => s + b.pct, 0);
  const unassigned = Math.max(0, 100 - totalPct);

  return (
    <Card
      title="Allocator"
      subtitle="Split your income into buckets"
      action={
        <Segmented
          ariaLabel="Allocation base"
          options={[
            { value: "auto", label: "This month" },
            { value: "custom", label: "Custom" },
          ]}
          value={state.allocBase === null ? "auto" : "custom"}
          onChange={(v) =>
            dispatch({ type: "setAllocBase", value: v === "auto" ? null : base || 100000 })
          }
        />
      }
    >
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs text-ink-2">Base amount</p>
          {state.allocBase === null ? (
            <p className="mt-0.5 text-[22px] font-semibold tracking-tight tabular-nums">
              {fmtINR(base)}
            </p>
          ) : (
            <div className="relative mt-1">
              <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted">
                ₹
              </span>
              <input
                type="number"
                inputMode="numeric"
                min="0"
                value={state.allocBase}
                onChange={(e) =>
                  dispatch({ type: "setAllocBase", value: Math.max(0, parseFloat(e.target.value) || 0) })
                }
                aria-label="Custom base amount"
                className="w-36 rounded-xl border border-ink/10 bg-page py-1.5 pl-7 pr-2 text-lg font-semibold tabular-nums"
              />
            </div>
          )}
        </div>
        {totalPct > 100 ? (
          <StatusChip tone="crit">Over-allocated by {totalPct - 100}%</StatusChip>
        ) : unassigned > 0 ? (
          <p className="text-[11px] text-muted">
            {unassigned}% unassigned · {fmtINR((base * unassigned) / 100)}
          </p>
        ) : null}
      </div>

      {/* stacked split — 2px surface gaps, 4px rounded outer ends */}
      <div className="mt-4 flex h-6 w-full gap-[2px]" role="img" aria-label="Allocation split">
        {state.buckets
          .filter((b) => b.pct > 0)
          .map((b, i, arr) => {
            const slot = state.buckets.indexOf(b);
            return (
              <div
                key={b.id}
                className="flex h-6 items-center justify-center overflow-hidden"
                style={{
                  width: `${(b.pct / Math.max(totalPct, 100)) * 100}%`,
                  background: SLOT_COLORS[slot],
                  borderRadius: `${i === 0 ? "4px" : "0"} ${
                    i === arr.length - 1 && unassigned === 0 ? "4px 4px" : "0 0"
                  } ${i === 0 ? "4px" : "0"}`,
                }}
              >
                {b.pct >= 12 && (
                  <span className="text-[10px] font-bold" style={{ color: SLOT_LABEL[slot] }}>
                    {b.pct}%
                  </span>
                )}
              </div>
            );
          })}
        {unassigned > 0 && (
          <div
            className="flex h-6 items-center justify-center rounded-r-[4px] bg-grid"
            style={{ width: `${unassigned}%` }}
          >
            {unassigned >= 12 && (
              <span className="text-[10px] font-bold text-ink-2">{unassigned}%</span>
            )}
          </div>
        )}
      </div>

      <ul className="mt-4 space-y-3">
        {state.buckets.map((b, slot) => (
          <li key={b.id} className="group flex items-center gap-2.5">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ background: SLOT_COLORS[slot] }}
            />
            <input
              value={b.name}
              onChange={(e) =>
                dispatch({ type: "updateBucket", id: b.id, patch: { name: e.target.value } })
              }
              aria-label="Bucket name"
              className="w-20 shrink-0 rounded-md bg-transparent text-sm font-medium focus:bg-page"
            />
            <input
              type="range"
              min="0"
              max="100"
              value={b.pct}
              onChange={(e) =>
                dispatch({ type: "updateBucket", id: b.id, patch: { pct: parseInt(e.target.value, 10) } })
              }
              aria-label={`${b.name} percentage`}
              className="h-1.5 min-w-0 flex-1"
              style={{ accentColor: `var(--color-s${slot + 1})` }}
            />
            <span className="w-9 shrink-0 text-right text-xs font-semibold tabular-nums">
              {b.pct}%
            </span>
            <span className="w-20 shrink-0 text-right text-sm font-semibold tabular-nums">
              {fmtINR((base * b.pct) / 100)}
            </span>
            <button
              onClick={() => dispatch({ type: "deleteBucket", id: b.id })}
              aria-label={`Remove ${b.name}`}
              className="rounded-full p-1 text-muted opacity-0 transition-opacity hover:bg-ink/5 hover:text-ink group-hover:opacity-100 focus-visible:opacity-100"
            >
              <IconX size={11} />
            </button>
          </li>
        ))}
      </ul>

      {state.buckets.length < MAX_BUCKETS && (
        <button
          onClick={() =>
            dispatch({ type: "addBucket", bucket: { id: uid(), name: "New bucket", pct: 0 } })
          }
          className="mt-3 flex items-center gap-1.5 rounded-full border border-ink/10 px-3 py-1.5 text-xs font-semibold text-ink-2 transition-colors hover:bg-ink/5 hover:text-ink"
        >
          <IconPlus size={11} />
          Add bucket
        </button>
      )}
    </Card>
  );
}
