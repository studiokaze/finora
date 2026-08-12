export interface RateInfo {
  rate: number;
  fetchedAt: number;
  source: "live" | "cached" | "fallback";
  provider: string;
}

const RATE_KEY = "finora:usdinr";
export const RATE_TTL_MS = 60 * 60 * 1000; // refresh hourly

export function loadCachedRate(): RateInfo | null {
  try {
    const raw = localStorage.getItem(RATE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RateInfo;
    if (typeof parsed.rate !== "number" || parsed.rate <= 0) return null;
    return { ...parsed, source: "cached" };
  } catch {
    return null;
  }
}

export function saveRate(info: RateInfo) {
  try {
    localStorage.setItem(RATE_KEY, JSON.stringify(info));
  } catch {
    // storage full/blocked — the in-memory rate still works
  }
}

/** Live USD→INR. Primary: open.er-api.com (no key). Fallback: frankfurter.dev (ECB). */
export async function fetchUsdInr(): Promise<RateInfo> {
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", { cache: "no-store" });
    if (res.ok) {
      const j = await res.json();
      const r = j?.rates?.INR;
      if (typeof r === "number" && r > 0) {
        return { rate: r, fetchedAt: Date.now(), source: "live", provider: "open.er-api.com" };
      }
    }
  } catch {
    // fall through to secondary provider
  }
  const res = await fetch("https://api.frankfurter.dev/v1/latest?base=USD&symbols=INR", {
    cache: "no-store",
  });
  const j = await res.json();
  const r = j?.rates?.INR;
  if (typeof r === "number" && r > 0) {
    return { rate: r, fetchedAt: Date.now(), source: "live", provider: "frankfurter.dev" };
  }
  throw new Error("rate unavailable");
}
