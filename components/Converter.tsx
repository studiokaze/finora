"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchUsdInr, loadCachedRate, saveRate, RATE_TTL_MS, type RateInfo } from "@/lib/rates";
import { timeAgo } from "@/lib/format";
import { Card, IconRefresh, StatusChip } from "./ui";

// plain number string — commas are invalid inside <input type="number">
const round2 = (x: number) => String(Math.round(x * 100) / 100);

export default function Converter() {
  const [rate, setRate] = useState<RateInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [usd, setUsd] = useState("100");
  const [inr, setInr] = useState("");
  const [edited, setEdited] = useState<"usd" | "inr">("usd");
  // re-render every 30s so "updated Xm ago" stays honest
  const [, setTick] = useState(0);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const info = await fetchUsdInr();
      saveRate(info);
      setRate(info);
    } catch {
      setRate((prev) => prev ?? { rate: 88, fetchedAt: Date.now(), source: "fallback", provider: "estimate" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const cached = loadCachedRate();
    if (cached) setRate(cached);
    if (!cached || Date.now() - cached.fetchedAt > RATE_TTL_MS) void refresh();
    const t = setInterval(() => setTick((n) => n + 1), 30_000);
    return () => clearInterval(t);
  }, [refresh]);

  const r = rate?.rate ?? null;
  const usdNum = parseFloat(usd);
  const inrNum = parseFloat(inr);

  const inrShown =
    edited === "usd" ? (r && isFinite(usdNum) ? round2(usdNum * r) : "") : inr;
  const usdShown =
    edited === "inr" ? (r && isFinite(inrNum) ? round2(inrNum / r) : "") : usd;

  const inputCls =
    "w-full rounded-xl border border-ink/10 bg-page py-2.5 pr-3 text-lg font-semibold tabular-nums text-ink placeholder:text-muted focus:border-s1/40";

  return (
    <Card
      title="USD → INR"
      subtitle="Latest exchange rate"
      action={
        <button
          onClick={() => void refresh()}
          disabled={loading}
          aria-label="Refresh exchange rate"
          className="rounded-full border border-ink/10 p-2 text-ink-2 transition-colors hover:bg-ink/5 hover:text-ink disabled:opacity-50"
        >
          <span className={loading ? "block animate-spin" : "block"}>
            <IconRefresh size={13} />
          </span>
        </button>
      }
    >
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[32px] font-semibold leading-none tracking-tight">
            {r ? `₹${r.toFixed(2)}` : "—"}
          </p>
          <p className="mt-1.5 text-[11px] text-muted">per US dollar</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          {rate?.source === "live" && (
            <span className="flex items-center gap-1.5 rounded-full bg-good/10 px-2 py-0.5 text-[11px] font-semibold text-good-text">
              <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-good" />
              Live
            </span>
          )}
          {rate?.source === "cached" && (
            <span className="flex items-center gap-1.5 rounded-full bg-ink/5 px-2 py-0.5 text-[11px] font-semibold text-ink-2">
              <span className="h-1.5 w-1.5 rounded-full bg-axis" />
              Cached
            </span>
          )}
          {rate?.source === "fallback" && <StatusChip tone="warn">Offline estimate</StatusChip>}
          {rate && rate.source !== "fallback" && (
            <p className="text-[10px] text-muted">
              {timeAgo(rate.fetchedAt)} · {rate.provider}
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <label className="block">
          <span className="mb-1 block text-[11px] font-medium text-ink-2">US Dollar</span>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted">
              $
            </span>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              value={usdShown}
              onChange={(e) => {
                setUsd(e.target.value);
                setEdited("usd");
              }}
              className={`${inputCls} pl-7`}
              placeholder="0"
            />
          </div>
        </label>

        <div className="flex justify-center">
          <span className="rounded-full border border-ink/10 bg-page p-1.5 text-muted" aria-hidden>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 4v16M12 20l-4-4M12 20l4-4" />
            </svg>
          </span>
        </div>

        <label className="block">
          <span className="mb-1 block text-[11px] font-medium text-ink-2">Indian Rupee</span>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted">
              ₹
            </span>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              value={inrShown}
              onChange={(e) => {
                setInr(e.target.value);
                setEdited("inr");
              }}
              className={`${inputCls} pl-7`}
              placeholder="0"
            />
          </div>
        </label>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {[10, 50, 100, 500, 1000].map((v) => (
          <button
            key={v}
            onClick={() => {
              setUsd(String(v));
              setEdited("usd");
            }}
            className="rounded-full border border-ink/10 px-2.5 py-1 text-[11px] font-semibold text-ink-2 transition-colors hover:bg-ink/5 hover:text-ink"
          >
            ${v >= 1000 ? `${v / 1000}k` : v}
          </button>
        ))}
      </div>
    </Card>
  );
}
