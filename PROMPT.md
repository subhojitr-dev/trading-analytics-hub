# Trading Analytics Hub — Build Prompt

Build the Trading Analytics Hub per the plan below: Next.js 14 App Router + TypeScript + Tailwind in
`C:\Users\subho\trading_analytics_hub`, deployed to Vercel, storage on Vercel Blob.

## Sources
- Stock Analysis PDFs: `C:\Users\subho\tradingview-mcp-jackson\Morning_Brief_YYYY-MM-DD.pdf`
- Trading Bot trade cards: `C:\Users\subho\tradingbot\email_archive\YYYY-Www\*.html`
  (filename pattern: `{yyyymmdd}_{hhmmss}_TradingBot_{Strategy}_{ACTION..}_{symbol/detail}.html`,
  each file also contains an `<!-- Subject: ... -->` HTML comment with a human-readable summary)

## App
Two tabs:
1. **Stock Analysis** — Year > Month > Week > Date tree (default: most recent date). Selecting a
   date embeds that day's PDF inline via `<iframe>`/`<object>` (native browser PDF viewer).
2. **Trading Bot Trades** — same Year > Month > Week > Date tree as the default/"list all" view,
   plus a filter bar (strategy, symbol, action — multi-select) that narrows across the whole
   manifest regardless of what's expanded in the tree. Selected trades render as their original
   styled HTML cards (sandboxed iframe), grouped by date, each with a one-line
   strategy/action/symbol header parsed from the filename + Subject comment.

## Storage & data model
- Vercel Blob paths: `stock-analysis/{yyyy}/{mm}/Morning_Brief_{yyyy-mm-dd}.pdf` and
  `trading-bot/{yyyy}/{Www}/{original-filename}.html`
- A `manifest.json` blob holds one row per file: `{path, date, week, year, strategy, action,
  symbols[], subject}` so the app never needs to list/parse Blob contents live — it just reads
  and filters the manifest.

## Auth
`middleware.ts` gates every route behind a login page + `AUTH_PASSWORD` env var, sets an httpOnly
cookie. Files are served only through an authenticated `/api/file` proxy route (never public Blob
URLs) so the password gate can't be bypassed by guessing/leaking a Blob URL.

## Sync mechanism
A local Node script (`scripts/sync.mjs`) run on a schedule (Windows Task Scheduler, every
15–30 min on weekdays during market hours) does one pass: diff local source folders against
`manifest.json`, upload any new files to Blob, rewrite `manifest.json`, exit. It is NOT a
persistent background daemon — each run is a short scan-diff-upload-exit cycle triggered by the
Task Scheduler, not a continuously running watcher process.

## Build steps
1. Scaffold Next.js app in `trading_analytics_hub`
2. Vercel Blob SDK + manifest schema/helpers
3. Sync script: scan both sources → parse metadata → upload → update manifest
4. Password-gate middleware + login page
5. Stock Analysis tab (tree nav + inline PDF viewer)
6. Trading Bot Trades tab (tree nav + filter bar + card list)
7. `/api/file` authenticated proxy route
8. Dry-run sync script against real folders, verify manifest correctness
9. Git init → GitHub repo → Vercel project → env vars (`BLOB_READ_WRITE_TOKEN`, `AUTH_PASSWORD`)
10. Windows Task Scheduler job for periodic sync
11. End-to-end check: password gate, both tabs populated, filters, PDF viewer
