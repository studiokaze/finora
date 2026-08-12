"use client";

import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useState,
  type Dispatch,
  type ReactNode,
} from "react";

// ---------------------------------------------------------------- types

export type TxnType = "income" | "expense";

export interface Txn {
  id: string;
  type: TxnType;
  amount: number;
  category: string;
  note: string;
  date: string; // YYYY-MM-DD
}

export interface Budget {
  id: string;
  category: string;
  limit: number; // monthly cap
}

export interface Goal {
  id: string;
  name: string;
  emoji: string;
  target: number;
  saved: number;
}

export interface Bucket {
  id: string;
  name: string;
  pct: number;
}

export interface State {
  txns: Txn[];
  budgets: Budget[];
  goals: Goal[];
  buckets: Bucket[];
  allocBase: number | null; // null → use this month's income
}

export const EXPENSE_CATEGORIES = [
  "Food",
  "Transport",
  "Rent",
  "Bills",
  "Shopping",
  "Fun",
  "Health",
  "Other",
];
export const INCOME_CATEGORIES = ["Salary", "Freelance", "Business", "Gift", "Other"];

export const MAX_BUCKETS = 5;

export function uid(): string {
  return Math.random().toString(36).slice(2, 9) + Date.now().toString(36);
}

const DEFAULT_STATE: State = {
  txns: [],
  budgets: [],
  goals: [],
  buckets: [
    { id: "b-needs", name: "Needs", pct: 50 },
    { id: "b-wants", name: "Wants", pct: 30 },
    { id: "b-save", name: "Savings", pct: 20 },
  ],
  allocBase: null,
};

// ---------------------------------------------------------------- reducer

type Action =
  | { type: "hydrate"; state: State }
  | { type: "addTxn"; txn: Txn }
  | { type: "deleteTxn"; id: string }
  | { type: "addBudget"; budget: Budget }
  | { type: "deleteBudget"; id: string }
  | { type: "addGoal"; goal: Goal }
  | { type: "deleteGoal"; id: string }
  | { type: "contribute"; id: string; amount: number }
  | { type: "addBucket"; bucket: Bucket }
  | { type: "deleteBucket"; id: string }
  | { type: "updateBucket"; id: string; patch: Partial<Pick<Bucket, "name" | "pct">> }
  | { type: "setAllocBase"; value: number | null }
  | { type: "loadDemo" }
  | { type: "reset" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "hydrate":
      return action.state;
    case "addTxn":
      return { ...state, txns: [...state.txns, action.txn] };
    case "deleteTxn":
      return { ...state, txns: state.txns.filter((t) => t.id !== action.id) };
    case "addBudget":
      return { ...state, budgets: [...state.budgets, action.budget] };
    case "deleteBudget":
      return { ...state, budgets: state.budgets.filter((b) => b.id !== action.id) };
    case "addGoal":
      return { ...state, goals: [...state.goals, action.goal] };
    case "deleteGoal":
      return { ...state, goals: state.goals.filter((g) => g.id !== action.id) };
    case "contribute":
      return {
        ...state,
        goals: state.goals.map((g) =>
          g.id === action.id ? { ...g, saved: Math.max(0, g.saved + action.amount) } : g,
        ),
      };
    case "addBucket":
      if (state.buckets.length >= MAX_BUCKETS) return state;
      return { ...state, buckets: [...state.buckets, action.bucket] };
    case "deleteBucket":
      return { ...state, buckets: state.buckets.filter((b) => b.id !== action.id) };
    case "updateBucket":
      return {
        ...state,
        buckets: state.buckets.map((b) => (b.id === action.id ? { ...b, ...action.patch } : b)),
      };
    case "setAllocBase":
      return { ...state, allocBase: action.value };
    case "loadDemo":
      return demoState();
    case "reset":
      return DEFAULT_STATE;
    default:
      return state;
  }
}

// ---------------------------------------------------------------- dates

export function toDateStr(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${dd}`;
}

export const monthKeyOf = (dateStr: string) => dateStr.slice(0, 7);
export const currentMonthKey = () => monthKeyOf(toDateStr(new Date()));

export function prevMonthKey(): string {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return monthKeyOf(toDateStr(d));
}

// ---------------------------------------------------------------- selectors

export interface PeriodPoint {
  key: string;
  label: string;
  fullLabel: string;
  income: number;
  expense: number;
}

export function monthlySeries(txns: Txn[], n = 12): PeriodPoint[] {
  const now = new Date();
  const points: PeriodPoint[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    points.push({
      key,
      label: d.toLocaleString("en", { month: "short" }),
      fullLabel: d.toLocaleString("en", { month: "long", year: "numeric" }),
      income: 0,
      expense: 0,
    });
  }
  const idx = new Map(points.map((p, i) => [p.key, i]));
  for (const t of txns) {
    const i = idx.get(monthKeyOf(t.date));
    if (i !== undefined) points[i][t.type] += t.amount;
  }
  return points;
}

export function dailySeries(txns: Txn[], n = 30): PeriodPoint[] {
  const now = new Date();
  const points: PeriodPoint[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const key = toDateStr(d);
    points.push({
      key,
      label: String(d.getDate()),
      fullLabel: d.toLocaleString("en", { day: "numeric", month: "short", year: "numeric" }),
      income: 0,
      expense: 0,
    });
  }
  const idx = new Map(points.map((p, i) => [p.key, i]));
  for (const t of txns) {
    const i = idx.get(t.date);
    if (i !== undefined) points[i][t.type] += t.amount;
  }
  return points;
}

export function totals(txns: Txn[]) {
  let income = 0;
  let expense = 0;
  for (const t of txns) t.type === "income" ? (income += t.amount) : (expense += t.amount);
  return { income, expense, balance: income - expense };
}

export function monthTotals(txns: Txn[], key: string) {
  let income = 0;
  let expense = 0;
  for (const t of txns) {
    if (monthKeyOf(t.date) !== key) continue;
    t.type === "income" ? (income += t.amount) : (expense += t.amount);
  }
  return { income, expense, net: income - expense };
}

export function spentByCategory(txns: Txn[], key: string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const t of txns) {
    if (t.type !== "expense" || monthKeyOf(t.date) !== key) continue;
    out[t.category] = (out[t.category] ?? 0) + t.amount;
  }
  return out;
}

/** Cumulative balance at the end of each of the last n months (sparkline). */
export function balanceSpark(txns: Txn[], n = 12): number[] {
  const series = monthlySeries(txns, n);
  const windowKeys = new Set(series.map((p) => p.key));
  const firstKey = series[0]?.key ?? "";
  let pre = 0;
  for (const t of txns) {
    const k = monthKeyOf(t.date);
    if (!windowKeys.has(k) && k < firstKey) pre += t.type === "income" ? t.amount : -t.amount;
  }
  const out: number[] = [];
  let run = pre;
  for (const p of series) {
    run += p.income - p.expense;
    out.push(run);
  }
  return out;
}

// ---------------------------------------------------------------- demo data

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function demoState(): State {
  const rnd = mulberry32(20260812);
  const txns: Txn[] = [];
  const today = new Date();
  for (let i = 364; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
    const ds = toDateStr(d);
    if (d.getDate() === 1)
      txns.push({ id: uid(), type: "income", amount: 85000, category: "Salary", note: "Monthly salary", date: ds });
    if (d.getDate() === 3)
      txns.push({ id: uid(), type: "expense", amount: 18000, category: "Rent", note: "Flat rent", date: ds });
    if (d.getDate() === 15 && rnd() > 0.35) {
      const amt = Math.round((8000 + rnd() * 14000) / 500) * 500;
      txns.push({ id: uid(), type: "income", amount: amt, category: "Freelance", note: "Client project", date: ds });
    }
    const count = rnd() < 0.16 ? 0 : 1 + Math.floor(rnd() * 2.4);
    for (let k = 0; k < count; k++) {
      const pick = rnd();
      let category = "Food";
      let amount = 0;
      if (pick < 0.45) {
        category = "Food";
        amount = 120 + rnd() * 700;
      } else if (pick < 0.6) {
        category = "Transport";
        amount = 60 + rnd() * 350;
      } else if (pick < 0.72) {
        category = "Shopping";
        amount = 400 + rnd() * 2600;
      } else if (pick < 0.82) {
        category = "Fun";
        amount = 200 + rnd() * 1000;
      } else if (pick < 0.92) {
        category = "Bills";
        amount = 300 + rnd() * 1500;
      } else {
        category = "Health";
        amount = 150 + rnd() * 900;
      }
      txns.push({
        id: uid(),
        type: "expense",
        amount: Math.round(amount / 10) * 10,
        category,
        note: "",
        date: ds,
      });
    }
  }
  return {
    txns,
    budgets: [
      { id: uid(), category: "Food", limit: 12000 },
      { id: uid(), category: "Transport", limit: 4000 },
      { id: uid(), category: "Shopping", limit: 8000 },
      { id: uid(), category: "Bills", limit: 6000 },
      { id: uid(), category: "Fun", limit: 5000 },
    ],
    goals: [
      { id: uid(), name: "MacBook Pro", emoji: "💻", target: 150000, saved: 45000 },
      { id: uid(), name: "Emergency fund", emoji: "🛟", target: 200000, saved: 128000 },
      { id: uid(), name: "Goa trip", emoji: "🌴", target: 40000, saved: 12000 },
    ],
    buckets: DEFAULT_STATE.buckets,
    allocBase: null,
  };
}

// ---------------------------------------------------------------- provider

const STORAGE_KEY = "finora:v1";

interface Ctx {
  state: State;
  dispatch: Dispatch<Action>;
  ready: boolean;
}

const StoreCtx = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, DEFAULT_STATE);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) dispatch({ type: "hydrate", state: { ...DEFAULT_STATE, ...JSON.parse(raw) } });
    } catch {
      // corrupt storage — start fresh rather than crash
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // storage full/blocked — app keeps working in memory
    }
  }, [state, ready]);

  return <StoreCtx.Provider value={{ state, dispatch, ready }}>{children}</StoreCtx.Provider>;
}

export function useStore(): Ctx {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");
  return ctx;
}
