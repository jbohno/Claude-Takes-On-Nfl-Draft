# 2026 NFL Draft Dashboard

Personal draft command center. Local-only, dark NFL broadcast aesthetic, persistent via `localStorage`.

## Stack

- Vite + React + TypeScript
- Tailwind CSS
- @dnd-kit/core + @dnd-kit/sortable for drag-to-rank
- lucide-react for icons
- `node-fetch` + `cheerio` for the RAS scraper

## Setup

```
npm install
npm run dev
```

Open http://localhost:5173.

## Scripts

- `npm run dev` — dev server
- `npm run build` — production build
- `npm run preview` — preview the prod build
- `npm run fetch-ras` — populate `/data/rasScores.json` (not committed — gitignored)

## Sections

1. **My Big Board** — drag-sort top 150 prospects, top 50 = "the board", 51–150 = "the pool". Slots editable inline; order persists.
2. **Consensus Mock** — read-only first-round snapshot from `/data/consensusMock.json`. Update by editing that file.
3. **My Mock** — drop in a mock-sim screenshot; notes autosave.
4. **Claude's Mock** — first-round picks with reasoning from `/data/claudesMock.json`.
5. **Claude's Top 50** — RAS-weighted prospect score. Run the scraper first.

## Data files (editable by hand)

- `data/players2026.json` — 150 prospect slots, first 20 seeded
- `data/consensusMock.json` — consensus first round (manual snapshot)
- `data/claudesMock.json` — Claude's mock + reasoning
- `data/productionStats.json` — placeholder production metrics for Section 5
- `data/rasScores.json` — **generated**, gitignored, produced by `npm run fetch-ras`

## RAS scraper note

`ras.football` has no public API. The scraper at `scripts/fetchRAS.ts` respectfully paces requests and caches output. Please don't hammer the site — re-run only when the class updates.
