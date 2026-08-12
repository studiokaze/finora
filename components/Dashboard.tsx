"use client";

import { StoreProvider, useStore } from "@/lib/store";
import Kpis from "./Kpis";
import Cashflow from "./Cashflow";
import Converter from "./Converter";
import Budgets from "./Budgets";
import Goals from "./Goals";
import Allocator from "./Allocator";
import Transactions from "./Transactions";
import { IconLock, IconTrash } from "./ui";

function Header() {
  const { dispatch } = useStore();
  return (
    <header className="sticky top-0 z-20 border-b border-ink/[0.06] bg-page/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-ink font-display text-sm text-surface">
            ₹
          </span>
          <span className="font-display text-lg tracking-tight">finora</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden items-center gap-1.5 text-xs text-ink-2 sm:flex">
            <IconLock size={11} />
            Data stays on this device
          </span>
          <button
            onClick={() => {
              if (confirm("Clear all Finora data from this browser? This cannot be undone.")) {
                dispatch({ type: "reset" });
              }
            }}
            aria-label="Clear all data"
            title="Clear all data"
            className="rounded-full border border-ink/10 p-2 text-ink-2 transition-colors hover:bg-ink/5 hover:text-ink"
          >
            <IconTrash size={13} />
          </button>
        </div>
      </div>
    </header>
  );
}

function Skeleton() {
  const block = "animate-pulse rounded-2xl bg-ink/5";
  return (
    <div className="mx-auto max-w-6xl space-y-4 px-4 pt-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className={`${block} h-28 ${i === 0 ? "col-span-2 lg:col-span-1" : ""}`} />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className={`${block} h-80 lg:col-span-2`} />
        <div className={`${block} h-80`} />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className={`${block} h-64`} />
        <div className={`${block} h-64`} />
        <div className={`${block} h-64`} />
      </div>
    </div>
  );
}

function Shell() {
  const { ready } = useStore();
  return (
    <div className="min-h-dvh">
      <Header />
      <h1 className="sr-only">Finora — personal financial planner</h1>
      {!ready ? (
        <Skeleton />
      ) : (
        <main className="mx-auto max-w-6xl space-y-4 px-4 pb-10 pt-6">
          <Kpis />
          <section className="grid items-start gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Cashflow />
            </div>
            <Converter />
          </section>
          <section className="grid items-start gap-4 lg:grid-cols-3">
            <Budgets />
            <Goals />
            <Allocator />
          </section>
          <Transactions />
          <footer className="pt-4 text-center text-[11px] text-muted">
            All data lives in your browser&apos;s localStorage — nothing is sent to any server.
            Exchange rate via open.er-api.com / frankfurter.dev.
          </footer>
        </main>
      )}
    </div>
  );
}

export default function Dashboard() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  );
}
