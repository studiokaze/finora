# finora

A personal financial planner that lives entirely in your browser.

- **Income & spending** — quick-add transactions, full table view
- **Cash flow chart** — daily (30d) and monthly (12m) views with hover tooltips
- **Live USD → INR** — latest rate from open.er-api.com (frankfurter.dev fallback), cached hourly
- **Budgets** — monthly caps per category with near-limit / over-budget states
- **Goals** — savings targets with progress and quick contributions
- **Allocator** — split income into buckets (50/30/20 by default) with sliders
- **Local-first** — everything persists to `localStorage`; nothing leaves your device

## Stack

Next.js 16 (App Router) · React 19 · Tailwind CSS v4 · TypeScript · hand-rolled SVG charts

## Run

```bash
npm install
npm run dev
```
