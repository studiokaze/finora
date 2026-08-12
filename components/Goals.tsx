"use client";

import { useState, type FormEvent } from "react";
import { uid, useStore } from "@/lib/store";
import { fmtINR } from "@/lib/format";
import { Card, EmptyState, IconPlus, IconX, Meter, StatusChip } from "./ui";

const EMOJIS = ["🎯", "💻", "🛟", "✈️", "🏠", "🚗", "💍", "📈", "🌴", "🎓"];

function ContributeForm({ goalId }: { goalId: string }) {
  const { dispatch } = useStore();
  const [amount, setAmount] = useState("");
  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const v = parseFloat(amount);
    if (!isFinite(v) || v <= 0) return;
    dispatch({ type: "contribute", id: goalId, amount: Math.round(v) });
    setAmount("");
  }
  return (
    <form onSubmit={onSubmit} className="flex gap-1.5">
      <input
        type="number"
        inputMode="numeric"
        min="1"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="+ ₹"
        aria-label="Add to goal"
        className="w-20 rounded-lg border border-ink/10 bg-page px-2 py-1 text-xs font-semibold tabular-nums"
      />
      <button
        type="submit"
        aria-label="Contribute"
        className="rounded-lg bg-ink/90 px-2 text-surface transition-opacity hover:opacity-85"
      >
        <IconPlus size={11} />
      </button>
    </form>
  );
}

export default function Goals() {
  const { state, dispatch } = useStore();
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [emoji, setEmoji] = useState("🎯");

  function onAdd(e: FormEvent) {
    e.preventDefault();
    const t = parseFloat(target);
    if (!name.trim() || !isFinite(t) || t <= 0) return;
    dispatch({
      type: "addGoal",
      goal: { id: uid(), name: name.trim(), emoji, target: Math.round(t), saved: 0 },
    });
    setName("");
    setTarget("");
    setEmoji("🎯");
  }

  return (
    <Card title="Goals" subtitle="Save toward what matters">
      {state.goals.length === 0 ? (
        <EmptyState
          className="py-6"
          title="No goals yet"
          hint="Name it, set a target, and add money whenever you put some aside."
        />
      ) : (
        <ul className="space-y-4">
          {state.goals.map((g) => {
            const pct = (g.saved / g.target) * 100;
            const done = g.saved >= g.target;
            return (
              <li key={g.id} className="group">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-ink/10 bg-page text-base">
                    {g.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="truncate text-sm font-medium">{g.name}</span>
                        {done && <StatusChip tone="good">Reached</StatusChip>}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold tabular-nums">
                          {Math.min(Math.round(pct), 999)}%
                        </span>
                        <button
                          onClick={() => dispatch({ type: "deleteGoal", id: g.id })}
                          aria-label={`Delete goal ${g.name}`}
                          className="rounded-full p-1 text-muted opacity-0 transition-opacity hover:bg-ink/5 hover:text-ink group-hover:opacity-100 focus-visible:opacity-100"
                        >
                          <IconX size={11} />
                        </button>
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted tabular-nums">
                      {fmtINR(g.saved)} of {fmtINR(g.target)}
                    </p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="flex-1">
                        <Meter
                          pct={pct}
                          color={done ? "var(--color-good)" : "var(--color-s3)"}
                          label={`${g.name} progress`}
                        />
                      </div>
                      {!done && <ContributeForm goalId={g.id} />}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <form onSubmit={onAdd} className="mt-4 flex gap-2 border-t border-ink/[0.06] pt-4">
        <select
          value={emoji}
          onChange={(e) => setEmoji(e.target.value)}
          aria-label="Goal emoji"
          className="rounded-xl border border-ink/10 bg-page px-1.5 py-2 text-sm"
        >
          {EMOJIS.map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </select>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New goal"
          aria-label="Goal name"
          className="min-w-0 flex-1 rounded-xl border border-ink/10 bg-page px-2.5 py-2 text-sm font-medium"
        />
        <input
          type="number"
          inputMode="numeric"
          min="1"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          placeholder="₹ target"
          aria-label="Goal target"
          className="w-24 rounded-xl border border-ink/10 bg-page px-2.5 py-2 text-sm font-semibold tabular-nums"
        />
        <button
          type="submit"
          aria-label="Add goal"
          className="rounded-xl bg-ink px-3 text-surface transition-opacity hover:opacity-85"
        >
          <IconPlus size={13} />
        </button>
      </form>
    </Card>
  );
}
