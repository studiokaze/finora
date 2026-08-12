"use client";

import type { ReactNode } from "react";

// ---------------------------------------------------------------- card

export function Card({
  title,
  subtitle,
  action,
  children,
  className = "",
  bodyClassName = "",
}: {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={`rounded-2xl border border-ink/10 bg-surface shadow-card ${className}`}>
      {(title || action) && (
        <header className="flex items-start justify-between gap-3 px-5 pt-4">
          <div>
            <h2 className="font-display text-[15px] tracking-tight text-ink">{title}</h2>
            {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      <div className={`px-5 pb-5 pt-4 ${bodyClassName}`}>{children}</div>
    </section>
  );
}

// ---------------------------------------------------------------- segmented

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  ariaLabel?: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="flex shrink-0 items-center gap-0.5 rounded-full bg-ink/5 p-0.5"
    >
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
            value === o.value
              ? "bg-surface text-ink shadow-[0_1px_2px_rgb(11_11_11/0.08)]"
              : "text-ink-2 hover:text-ink"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------- status chip

export function StatusChip({
  tone,
  children,
}: {
  tone: "good" | "warn" | "crit";
  children: ReactNode;
}) {
  const styles = {
    good: "bg-good/10 text-good-text",
    warn: "bg-warn/15 text-warn-text",
    crit: "bg-crit/10 text-crit",
  }[tone];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${styles}`}
    >
      {tone === "good" ? <IconCheck size={11} /> : <IconAlert size={11} />}
      {children}
    </span>
  );
}

// ---------------------------------------------------------------- empty state

export function EmptyState({
  title,
  hint,
  action,
  className = "",
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col items-center justify-center gap-2 text-center ${className}`}>
      <p className="text-sm font-medium text-ink-2">{title}</p>
      {hint && <p className="max-w-xs text-xs text-muted">{hint}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

// ---------------------------------------------------------------- meter

/** Single-ratio meter: fill carries state, track is a light tint of the fill. */
export function Meter({ pct, color, label }: { pct: number; color: string; label?: string }) {
  const clamped = Math.max(0, Math.min(pct, 100));
  return (
    <div
      role="meter"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className="h-2 w-full rounded-full"
      style={{ background: `color-mix(in srgb, ${color} 14%, var(--color-surface))` }}
    >
      <div
        className="h-2 rounded-full transition-[width] duration-300"
        style={{ width: `${clamped}%`, background: color }}
      />
    </div>
  );
}

// ---------------------------------------------------------------- icons

function base(size: number) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2.2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
}

export const IconPlus = ({ size = 14 }: { size?: number }) => (
  <svg {...base(size)} aria-hidden>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const IconTrash = ({ size = 14 }: { size?: number }) => (
  <svg {...base(size)} aria-hidden>
    <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" />
  </svg>
);

export const IconX = ({ size = 12 }: { size?: number }) => (
  <svg {...base(size)} aria-hidden>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

export const IconRefresh = ({ size = 14 }: { size?: number }) => (
  <svg {...base(size)} aria-hidden>
    <path d="M21 12a9 9 0 1 1-2.64-6.36M21 3v6h-6" />
  </svg>
);

export const IconSwap = ({ size = 14 }: { size?: number }) => (
  <svg {...base(size)} aria-hidden>
    <path d="M7 4v13M7 17l-3-3M7 17l3-3" transform="rotate(90 12 12)" />
    <path d="M17 20V7M17 7l-3 3M17 7l3 3" transform="rotate(90 12 12)" />
  </svg>
);

export const IconUpRight = ({ size = 12 }: { size?: number }) => (
  <svg {...base(size)} aria-hidden>
    <path d="M7 17L17 7M9 7h8v8" />
  </svg>
);

export const IconDownRight = ({ size = 12 }: { size?: number }) => (
  <svg {...base(size)} aria-hidden>
    <path d="M7 7l10 10M17 9v8H9" />
  </svg>
);

export const IconLock = ({ size = 12 }: { size?: number }) => (
  <svg {...base(size)} aria-hidden>
    <rect x="4" y="11" width="16" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </svg>
);

export const IconCheck = ({ size = 12 }: { size?: number }) => (
  <svg {...base(size)} aria-hidden>
    <path d="M4 12.5l5 5L20 6.5" />
  </svg>
);

export const IconAlert = ({ size = 12 }: { size?: number }) => (
  <svg {...base(size)} aria-hidden>
    <path d="M12 3l10 18H2L12 3zM12 10v4M12 17.5v.5" />
  </svg>
);
