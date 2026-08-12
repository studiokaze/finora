"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { dailySeries, monthlySeries, useStore, type PeriodPoint } from "@/lib/store";
import { fmtINR, fmtINRCompact, niceScale } from "@/lib/format";
import { Card, EmptyState, Segmented } from "./ui";

const SERIES = [
  { key: "income", name: "Income", color: "var(--color-s1)" },
  { key: "expense", name: "Spending", color: "var(--color-s2)" },
] as const;

type Mode = "daily" | "monthly";

/** Column with a 4px-rounded data end and a square baseline. */
function roundedCol(x: number, yTop: number, w: number, h: number): string {
  const r = Math.min(4, w / 2, h);
  const yB = yTop + h;
  return [
    `M${x},${yB}`,
    `L${x},${yTop + r}`,
    `Q${x},${yTop} ${x + r},${yTop}`,
    `L${x + w - r},${yTop}`,
    `Q${x + w},${yTop} ${x + w},${yTop + r}`,
    `L${x + w},${yB}`,
    "Z",
  ].join(" ");
}

function Chart({ points, mode }: { points: PeriodPoint[]; mode: Mode }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => setWidth(entries[0].contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const H = 248;
  const PAD = { l: 48, r: 8, t: 10, b: 24 };
  const innerW = Math.max(width - PAD.l - PAD.r, 0);
  const innerH = H - PAD.t - PAD.b;

  const maxV = Math.max(...points.map((p) => Math.max(p.income, p.expense)), 1);
  const { top, ticks } = niceScale(maxV, 4);
  const y = (v: number) => PAD.t + innerH * (1 - v / top);
  const band = points.length ? innerW / points.length : 0;
  const barW = Math.max(3, Math.min(mode === "daily" ? 7 : 18, band * 0.32));

  const hovered = hover !== null ? points[hover] : null;
  const tooltipX =
    hover !== null ? Math.min(Math.max(PAD.l + band * hover + band / 2, 84), width - 84) : 0;
  const tooltipY = hovered ? y(Math.max(hovered.income, hovered.expense)) - 10 : 0;

  return (
    <div ref={wrapRef} className="relative" onMouseLeave={() => setHover(null)}>
      {width > 0 && (
        <svg
          width={width}
          height={H}
          role="img"
          aria-label={`Cash flow: income and spending per ${mode === "daily" ? "day, last 30 days" : "month, last 12 months"}`}
        >
          {ticks.map((t) =>
            t === 0 ? null : (
              <g key={t}>
                <line
                  x1={PAD.l}
                  x2={width - PAD.r}
                  y1={y(t)}
                  y2={y(t)}
                  stroke="var(--color-grid)"
                  strokeWidth={1}
                />
                <text
                  x={PAD.l - 8}
                  y={y(t) + 3.5}
                  textAnchor="end"
                  fontSize={10}
                  fill="var(--color-muted)"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {fmtINRCompact(t)}
                </text>
              </g>
            ),
          )}

          {points.map((p, i) => {
            const cx = PAD.l + band * i + band / 2;
            const xInc = cx - barW - 1; // 2px surface gap between the pair
            const xExp = cx + 1;
            const hInc = p.income > 0 ? Math.max(y(0) - y(p.income), 1.5) : 0;
            const hExp = p.expense > 0 ? Math.max(y(0) - y(p.expense), 1.5) : 0;
            return (
              <g key={p.key} style={{ filter: hover === i ? "brightness(1.08)" : undefined }}>
                {hInc > 0 && (
                  <path d={roundedCol(xInc, y(0) - hInc, barW, hInc)} fill="var(--color-s1)" />
                )}
                {hExp > 0 && (
                  <path d={roundedCol(xExp, y(0) - hExp, barW, hExp)} fill="var(--color-s2)" />
                )}
              </g>
            );
          })}

          {/* baseline above marks so columns stay square at zero */}
          <line
            x1={PAD.l}
            x2={width - PAD.r}
            y1={y(0)}
            y2={y(0)}
            stroke="var(--color-axis)"
            strokeWidth={1}
          />

          {points.map(
            (p, i) =>
              (mode === "monthly" || i % 5 === 0) && (
                <text
                  key={`x-${p.key}`}
                  x={PAD.l + band * i + band / 2}
                  y={H - 6}
                  textAnchor="middle"
                  fontSize={10}
                  fill="var(--color-muted)"
                >
                  {p.label}
                </text>
              ),
          )}

          {/* hover/focus bands — the hit target is the whole slot, not the mark */}
          {points.map((p, i) => (
            <rect
              key={`h-${p.key}`}
              x={PAD.l + band * i}
              y={PAD.t}
              width={band}
              height={innerH}
              fill="transparent"
              tabIndex={0}
              aria-label={`${p.fullLabel}: income ${fmtINR(p.income)}, spending ${fmtINR(p.expense)}`}
              onMouseEnter={() => setHover(i)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              style={{ outline: "none" }}
            />
          ))}
        </svg>
      )}

      {hovered && (
        <div
          className="pointer-events-none absolute z-10 min-w-[160px] -translate-x-1/2 -translate-y-full rounded-xl border border-ink/10 bg-surface px-3 py-2.5 shadow-pop"
          style={{ left: tooltipX, top: Math.max(tooltipY, 8) }}
        >
          <p className="text-[11px] font-medium text-muted">{hovered.fullLabel}</p>
          {SERIES.map((s) => (
            <div key={s.key} className="mt-1.5 flex items-center gap-2">
              <span className="h-0.5 w-3 rounded-full" style={{ background: s.color }} />
              <span className="text-sm font-semibold tabular-nums">{fmtINR(hovered[s.key])}</span>
              <span className="text-[11px] text-ink-2">{s.name}</span>
            </div>
          ))}
          <div className="mt-2 flex items-center justify-between border-t border-ink/10 pt-1.5">
            <span className="text-[11px] text-ink-2">Net</span>
            <span
              className={`text-xs font-semibold tabular-nums ${
                hovered.income - hovered.expense >= 0 ? "text-good-text" : "text-crit"
              }`}
            >
              {hovered.income - hovered.expense >= 0 ? "+" : "−"}
              {fmtINR(Math.abs(hovered.income - hovered.expense))}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Cashflow() {
  const { state, dispatch } = useStore();
  const [mode, setMode] = useState<Mode>("monthly");

  const points = useMemo(
    () => (mode === "daily" ? dailySeries(state.txns, 30) : monthlySeries(state.txns, 12)),
    [state.txns, mode],
  );

  const hasData = state.txns.length > 0;

  return (
    <Card
      title="Cash flow"
      subtitle={mode === "daily" ? "Last 30 days" : "Last 12 months"}
      action={
        <Segmented
          ariaLabel="Chart granularity"
          options={[
            { value: "daily", label: "Daily" },
            { value: "monthly", label: "Monthly" },
          ]}
          value={mode}
          onChange={setMode}
        />
      }
    >
      {hasData ? (
        <>
          <div className="mb-1 flex items-center justify-end gap-4">
            {SERIES.map((s) => (
              <span key={s.key} className="flex items-center gap-1.5 text-xs text-ink-2">
                <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: s.color }} />
                {s.name}
              </span>
            ))}
          </div>
          <Chart points={points} mode={mode} />
        </>
      ) : (
        <EmptyState
          className="h-[248px]"
          title="No transactions yet"
          hint="Add your first income or expense below — or explore the app with demo data (you can clear it anytime)."
          action={
            <button
              onClick={() => dispatch({ type: "loadDemo" })}
              className="rounded-full bg-ink px-4 py-2 text-xs font-semibold text-surface transition-opacity hover:opacity-85"
            >
              Load demo data
            </button>
          }
        />
      )}
    </Card>
  );
}
