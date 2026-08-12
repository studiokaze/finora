"use client";

import { useMemo, useState, type FormEvent } from "react";
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  toDateStr,
  uid,
  useStore,
  type TxnType,
} from "@/lib/store";
import { fmtINR } from "@/lib/format";
import { Card, EmptyState, IconX, Segmented } from "./ui";

export default function Transactions() {
  const { state, dispatch } = useStore();
  const [type, setType] = useState<TxnType>("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [date, setDate] = useState(() => toDateStr(new Date()));
  const [note, setNote] = useState("");
  const [showAll, setShowAll] = useState(false);

  const categories = type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  const sorted = useMemo(
    () => [...state.txns].reverse().sort((a, b) => b.date.localeCompare(a.date)),
    [state.txns],
  );
  const visible = showAll ? sorted : sorted.slice(0, 8);

  function onTypeChange(t: TxnType) {
    setType(t);
    setCategory(t === "expense" ? "Food" : "Salary");
  }

  function onAdd(e: FormEvent) {
    e.preventDefault();
    const v = parseFloat(amount);
    if (!isFinite(v) || v <= 0 || !date) return;
    dispatch({
      type: "addTxn",
      txn: { id: uid(), type, amount: Math.round(v * 100) / 100, category, note: note.trim(), date },
    });
    setAmount("");
    setNote("");
  }

  const inputCls =
    "rounded-xl border border-ink/10 bg-page px-2.5 py-2 text-sm font-medium text-ink placeholder:text-muted";

  return (
    <Card
      title="Transactions"
      subtitle="Log income and spending — stored only on this device"
      action={
        <Segmented
          ariaLabel="Transaction type"
          options={[
            { value: "expense", label: "Expense" },
            { value: "income", label: "Income" },
          ]}
          value={type}
          onChange={onTypeChange}
        />
      }
    >
      <form onSubmit={onAdd} className="flex flex-wrap gap-2">
        <input
          type="number"
          inputMode="decimal"
          min="0.01"
          step="any"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="₹ amount"
          aria-label="Amount"
          required
          className={`${inputCls} w-28 font-semibold tabular-nums`}
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          aria-label="Category"
          className={inputCls}
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          aria-label="Date"
          required
          className={inputCls}
        />
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Note (optional)"
          aria-label="Note"
          className={`${inputCls} min-w-32 flex-1`}
        />
        <button
          type="submit"
          className="rounded-xl bg-ink px-5 py-2 text-sm font-semibold text-surface transition-opacity hover:opacity-85"
        >
          Add {type}
        </button>
      </form>

      {sorted.length === 0 ? (
        <EmptyState
          className="py-8"
          title="Nothing logged yet"
          hint="Everything you add lives in your browser's local storage — private to this device."
        />
      ) : (
        <>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] font-semibold uppercase tracking-wide text-muted">
                  <th className="py-2 pr-4 font-semibold">Date</th>
                  <th className="py-2 pr-4 font-semibold">Category</th>
                  <th className="hidden py-2 pr-4 font-semibold sm:table-cell">Note</th>
                  <th className="py-2 text-right font-semibold">Amount</th>
                  <th className="w-8" aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {visible.map((t) => {
                  const d = new Date(`${t.date}T00:00:00`);
                  return (
                    <tr key={t.id} className="group border-t border-ink/[0.06]">
                      <td className="whitespace-nowrap py-2.5 pr-4 text-xs text-ink-2 tabular-nums">
                        {d.toLocaleString("en", { day: "numeric", month: "short" })}
                      </td>
                      <td className="py-2.5 pr-4">
                        <span className="flex items-center gap-2 font-medium">
                          <span
                            className="h-2 w-2 shrink-0 rounded-full"
                            style={{
                              background:
                                t.type === "income" ? "var(--color-s1)" : "var(--color-s2)",
                            }}
                          />
                          {t.category}
                        </span>
                      </td>
                      <td className="hidden max-w-48 truncate py-2.5 pr-4 text-xs text-muted sm:table-cell">
                        {t.note || "—"}
                      </td>
                      <td
                        className={`py-2.5 text-right font-semibold tabular-nums ${
                          t.type === "income" ? "text-good-text" : "text-ink"
                        }`}
                      >
                        {t.type === "income" ? "+" : "−"}
                        {fmtINR(t.amount)}
                      </td>
                      <td className="py-2.5 pl-2 text-right">
                        <button
                          onClick={() => dispatch({ type: "deleteTxn", id: t.id })}
                          aria-label="Delete transaction"
                          className="rounded-full p-1 text-muted opacity-0 transition-opacity hover:bg-ink/5 hover:text-ink group-hover:opacity-100 focus-visible:opacity-100"
                        >
                          <IconX size={11} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {sorted.length > 8 && (
            <button
              onClick={() => setShowAll((s) => !s)}
              className="mt-3 w-full rounded-xl border border-ink/10 py-2 text-xs font-semibold text-ink-2 transition-colors hover:bg-ink/5 hover:text-ink"
            >
              {showAll ? "Show less" : `View all ${sorted.length}`}
            </button>
          )}
        </>
      )}
    </Card>
  );
}
