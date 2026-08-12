export function fmtINR(n: number, maxFraction = 0): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: maxFraction,
  }).format(n);
}

export function fmtUSD(n: number, maxFraction = 2): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: maxFraction,
  }).format(n);
}

const trim1 = (x: number) =>
  x >= 100 ? Math.round(x).toString() : (Math.round(x * 10) / 10).toString();

/** Indian compact: ₹950 → ₹950, 12,400 → ₹12.4K, 4,50,000 → ₹4.5L, 2.1cr → ₹2.1Cr */
export function fmtINRCompact(n: number): string {
  const sign = n < 0 ? "−" : "";
  const abs = Math.abs(n);
  if (abs >= 1e7) return `${sign}₹${trim1(abs / 1e7)}Cr`;
  if (abs >= 1e5) return `${sign}₹${trim1(abs / 1e5)}L`;
  if (abs >= 1e3) return `${sign}₹${trim1(abs / 1e3)}K`;
  return `${sign}₹${Math.round(abs)}`;
}

export function timeAgo(ts: number): string {
  const s = Math.max(0, Math.round((Date.now() - ts) / 1000));
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

/** Clean axis scale: rounded step (1/2/2.5/5 × 10^k), top ≥ max. */
export function niceScale(maxValue: number, tickCount = 4): { top: number; ticks: number[] } {
  const max = Math.max(maxValue, 1);
  const rawStep = max / tickCount;
  const mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const norm = rawStep / mag;
  const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10) * mag;
  const top = step * Math.ceil(max / step - 1e-9);
  const ticks: number[] = [];
  for (let v = 0; v <= top + 1e-9; v += step) ticks.push(Math.round(v));
  return { top, ticks };
}
