"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { INCOME_CATEGORIES, toDateStr, uid, useStore } from "@/lib/store";
import { fmtINR } from "@/lib/format";
import { IconX } from "./ui";

export default function IncomeModal({ onClose }: { onClose: () => void }) {
  const { dispatch } = useStore();
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Salary");
  const [date, setDate] = useState(() => toDateStr(new Date()));
  const [note, setNote] = useState("");
  const amountRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    amountRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const value = parseFloat(amount);
  const valid = isFinite(value) && value > 0 && !!date;

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!valid) return;
    dispatch({
      type: "addTxn",
      txn: {
        id: uid(),
        type: "income",
        amount: Math.round(value * 100) / 100,
        category,
        note: note.trim(),
        date,
      },
    });
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Add income"
    >
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-ink/30 backdrop-blur-[2px]"
      />
      <div className="relative w-full max-w-sm rounded-2xl border border-ink/10 bg-surface p-5 shadow-pop">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-display text-base tracking-tight">
            <span className="h-2.5 w-2.5 rounded-full bg-s1" />
            Add income
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1.5 text-muted transition-colors hover:bg-ink/5 hover:text-ink"
          >
            <IconX size={13} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="mt-4 space-y-4">
          <label className="block">
            <span className="mb-1 block text-[11px] font-medium text-ink-2">Amount</span>
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-xl font-semibold text-muted">
                ₹
              </span>
              <input
                ref={amountRef}
                type="number"
                inputMode="decimal"
                min="0.01"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                required
                className="w-full rounded-xl border border-ink/10 bg-page py-3 pl-9 pr-3 text-2xl font-semibold tabular-nums text-ink placeholder:text-muted focus:border-s1/40"
              />
            </div>
          </label>

          <div>
            <span className="mb-1.5 block text-[11px] font-medium text-ink-2">Source</span>
            <div className="flex flex-wrap gap-1.5">
              {INCOME_CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  aria-pressed={category === c}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                    category === c
                      ? "bg-ink text-surface"
                      : "border border-ink/10 text-ink-2 hover:bg-ink/5 hover:text-ink"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <label className="block flex-1">
              <span className="mb-1 block text-[11px] font-medium text-ink-2">Date</span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full rounded-xl border border-ink/10 bg-page px-2.5 py-2 text-sm font-medium"
              />
            </label>
            <label className="block flex-1">
              <span className="mb-1 block text-[11px] font-medium text-ink-2">Note</span>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Optional"
                className="w-full rounded-xl border border-ink/10 bg-page px-2.5 py-2 text-sm font-medium placeholder:text-muted"
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={!valid}
            className="w-full rounded-xl bg-s1-deep py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {valid ? `Add ${fmtINR(value)} income` : "Add income"}
          </button>
        </form>
      </div>
    </div>
  );
}
