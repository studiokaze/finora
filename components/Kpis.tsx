"use client";

import { useMemo } from "react";
import {
  balanceSpark,
  currentMonthKey,
  monthTotals,
  prevMonthKey,
  totals,
  useStore,
} from "@/lib/store";
import { fmtINR } from "@/lib/format";
import { IconDownRight, IconUpRight } from "./ui";

function Delta({
  pct,
  upIsGood,
  vsLabel,
}: {
  pct: number | null;
  upIsGood: boolean;
  vsLabel: string;
}) {
  if (pct === null || !isFinite(pct)) {
    return <p className="mt-1 text-[11px] text-muted">{vsLabel}</p>;
  }
  const up = pct >= 0;
  const good = up === upIsGood;
  return (
    <p className="mt-1 flex items-center gap-1 text-[11px] font-medium">
      <span className={`flex items-center gap-0.5 ${good ? "text-good-text" : "text-crit"}`}>
        {up ? <IconUpRight size={11} /> : <IconDownRight size={11} />}
        {Math.abs(pct).toFixed(0)}%
      </span>
      <span className="text-muted">{vsLabel}</span>
    </p>
  );
}

function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return null;
  const W = 120;
  const H = 36;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => ({
    x: 4 + (i * (W - 8)) / (values.length - 1),
    y: 6 + (H - 12) * (1 - (v - min) / span),
  }));
  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const last = pts[pts.length - 1];
  return (
    <svg width={W} height={H} aria-hidden className="shrink-0">
      <path d={path} fill="none" stroke="var(--color-axis)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last.x} cy={last.y} r={4} fill="var(--color-s1)" stroke="var(--color-surface)" strokeWidth={2} />
    </svg>
  );
}

function pctChange(cur: number, prev: number): number | null {
  if (prev === 0) return null;
  return ((cur - prev) / prev) * 100;
}

export default function Kpis() {
  const { state } = useStore();
  const { txns } = state;

  const data = useMemo(() => {
    const all = totals(txns);
    const cur = monthTotals(txns, currentMonthKey());
    const prev = monthTotals(txns, prevMonthKey());
    const spark = balanceSpark(txns, 12);
    const savingsRate = cur.income > 0 ? ((cur.income - cur.expense) / cur.income) * 100 : null;
    const prevSavingsRate =
      prev.income > 0 ? ((prev.income - prev.expense) / prev.income) * 100 : null;
    return { all, cur, prev, spark, savingsRate, prevSavingsRate };
  }, [txns]);

  const monthName = new Date().toLocaleString("en", { month: "short" });
  const prevName = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toLocaleString(
    "en",
    { month: "short" },
  );

  const tile = "rounded-2xl border border-ink/10 bg-surface shadow-card px-5 py-4";

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {/* hero — the one number the dashboard leads with */}
      <div className={`${tile} col-span-2 flex items-end justify-between gap-4 lg:col-span-1 lg:flex-col lg:items-start`}>
        <div>
          <p className="text-xs text-ink-2">Balance</p>
          <p className="mt-1 text-5xl font-semibold tracking-tight">{fmtINR(data.all.balance)}</p>
          <p className="mt-1 text-[11px] text-muted">all-time · income − spending</p>
        </div>
        <Sparkline values={data.spark} />
      </div>

      <div className={tile}>
        <p className="text-xs text-ink-2">Income · {monthName}</p>
        <p className="mt-1 text-[26px] font-semibold tracking-tight">{fmtINR(data.cur.income)}</p>
        <Delta pct={pctChange(data.cur.income, data.prev.income)} upIsGood vsLabel={`vs ${prevName}`} />
      </div>

      <div className={tile}>
        <p className="text-xs text-ink-2">Spent · {monthName}</p>
        <p className="mt-1 text-[26px] font-semibold tracking-tight">{fmtINR(data.cur.expense)}</p>
        <Delta
          pct={pctChange(data.cur.expense, data.prev.expense)}
          upIsGood={false}
          vsLabel={`vs ${prevName}`}
        />
      </div>

      <div className={tile}>
        <p className="text-xs text-ink-2">Savings rate</p>
        <p className="mt-1 text-[26px] font-semibold tracking-tight">
          {data.savingsRate === null ? "—" : `${Math.round(data.savingsRate)}%`}
        </p>
        <p className="mt-1 text-[11px] text-muted">
          {data.savingsRate === null
            ? "no income logged this month"
            : "of this month's income kept"}
        </p>
      </div>
    </div>
  );
}
