// One-shot sync: scan local source folders, upload any new files, refresh the
// trade ledger, and rebuild a single manifest.json that the Next.js site
// reads instead of calling Blob's list()/get() on every page view. Meant to
// be invoked on a schedule (Windows Task Scheduler), not run as a persistent
// background process.
//
// Vercel Blob's Hobby plan caps "Advanced Operations" (put/copy/list) at
// 2,000/month, shared across the whole account. This script runs every 20
// minutes, 24/7 (~2,100 runs/month) via the TradingAnalyticsHubSync task, so
// two list() calls per run would alone blow the cap before counting any
// uploads or site traffic. To stay well under it, this script:
//   - Tracks what's already in Blob in a local state file (sync-state.json)
//     instead of calling list() to check every run. list() is only ever
//     called once, to bootstrap that state file the first time it's missing.
//   - Only calls put() for a file it doesn't already know about.
//   - Only re-uploads manifest.json when something actually changed (a new
//     file, a retention deletion, or the trade ledger's mtime moved).
//   - del() is free per Vercel's pricing docs, so retention cleanup doesn't
//     consume any quota.
//
// Usage:
//   node --env-file=.env.local scripts/sync.mjs
//
// Requires BLOB_READ_WRITE_TOKEN in the environment.

import { put, del } from "@vercel/blob";
import { readdir, readFile, writeFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const STOCK_SRC_DIR = "C:\\Users\\subho\\tradingview-mcp-jackson";
const STOCK_LOGS_DIR = "C:\\Users\\subho\\tradingview-mcp-jackson\\logs";
const TRADES_SRC_DIR = "C:\\Users\\subho\\tradingbot\\email_archive";
const LEDGER_SRC_FILE = "C:\\Users\\subho\\tradingbot\\reports\\trade_ledger.json";
const STATE_FILE = fileURLToPath(new URL("./sync-state.json", import.meta.url));

const STOCK_PREFIX = "stock-analysis/";
const TRADES_PREFIX = "trading-bot/";
const MANIFEST_PATHNAME = "manifest.json";

const STOCK_FILENAME_RE = /^Morning_Brief_(\d{4})-(\d{2})-(\d{2})\.pdf$/;
const TRADE_FILENAME_RE = /^(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})_TradingBot_([A-Za-z]+)_(.+)\.html$/;

// generate_pdf_report.py falls back to a short "Session data not available"
// page when the day's session JSON is missing. That fallback PDF is always
// ~2.1KB; real reports are always 6KB+. Uploading it as a real report would
// mean the site shows a "broken" viewer for that date, so it's diverted to
// an .error marker instead of being uploaded as a .pdf.
const STOCK_ERROR_MAX_BYTES = 4000;

// No need to keep data older than this -- keeps Blob storage small and
// keeps the manifest itself small to parse on every page view.
const RETENTION_DAYS = 60;

// ── Local state (replaces calling Blob's list() on every run) ─────────────────

function emptyState() {
  return { stock: {}, trades: {}, bootstrapped: false, lastRetentionCheck: null, lastManifestSignature: null };
}

async function loadState() {
  try {
    const text = await readFile(STATE_FILE, "utf8");
    return { ...emptyState(), ...JSON.parse(text) };
  } catch {
    return emptyState();
  }
}

async function saveState(state) {
  await writeFile(STATE_FILE, JSON.stringify(state, null, 2));
}

// One-time only: if sync-state.json doesn't exist yet (first run after this
// redesign, or the file was deleted), seed it from whatever's already in
// Blob so we don't try to re-upload years of already-uploaded files. This is
// the only place this script calls list() -- never on routine runs.
async function bootstrapFromBlobIfNeeded(state) {
  if (state.bootstrapped) return;

  console.log("No local sync state yet -- bootstrapping from existing Blob contents (one-time list() calls)...");
  const { list } = await import("@vercel/blob");

  for (const prefix of [STOCK_PREFIX, TRADES_PREFIX]) {
    let cursor;
    do {
      const result = await list({ prefix, cursor, limit: 1000 });
      for (const b of result.blobs) {
        if (prefix === STOCK_PREFIX) {
          const m = /(\d{4})\/(\d{2})\/Morning_Brief_(\d{4})-(\d{2})-(\d{2})\.(pdf|error)$/.exec(b.pathname);
          if (!m) continue;
          const [, , , yyyy, mm, dd, ext] = m;
          const dateStr = `${yyyy}-${mm}-${dd}`;
          const kind = ext === "pdf" ? "report" : "error";
          let reason;
          if (kind === "error") {
            reason = (await readErrorReason(dateStr)) ?? "Reason unavailable (bootstrapped from existing storage).";
          }
          state.stock[dateStr] = {
            pathname: b.pathname, kind, reason,
            year: Number(yyyy), month: Number(mm), day: Number(dd),
          };
        } else {
          const filename = b.pathname.slice(b.pathname.lastIndexOf("/") + 1);
          const tm = TRADE_FILENAME_RE.exec(filename);
          if (!tm) continue;
          const [, yyyy, mo, d, hh, mm2, ss, strategy, rawDetail] = tm;
          state.trades[b.pathname] = {
            pathname: b.pathname, filename,
            date: `${yyyy}-${mo}-${d}`, time: `${hh}:${mm2}:${ss}`,
            year: Number(yyyy), month: Number(mo), day: Number(d),
            strategy, detail: toDetailLabel(rawDetail),
          };
        }
      }
      cursor = result.hasMore ? result.cursor : undefined;
    } while (cursor);
  }

  state.bootstrapped = true;
  console.log(
    `Bootstrap complete: ${Object.keys(state.stock).length} stock analysis entries, ${Object.keys(state.trades).length} trade entries.`
  );
}

// ── date helpers (mirrors lib/date.ts's isoWeek so manifest entries match
//    exactly what the site used to compute itself) ─────────────────────────

function isoWeek(y, m, d) {
  const date = new Date(Date.UTC(y, m - 1, d));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function toDetailLabel(rawDetail) {
  return rawDetail.replace(/_/g, " ").replace(/--/g, "—").trim();
}

// The morning brief runner writes a small {date}-morning-ERROR.txt (or
// -continue-ERROR.txt) alongside its full run log whenever a step fails —
// e.g. "Credit balance is too low", "API Error: 529 Overloaded". That's the
// actual reason a report didn't generate, so it's read and carried along
// with the .error marker instead of a generic message. Local file read only
// -- never touches Blob.
async function readErrorReason(dateStr) {
  const candidates = [
    path.join(STOCK_LOGS_DIR, `${dateStr}-morning-ERROR.txt`),
    path.join(STOCK_LOGS_DIR, `${dateStr}-continue-ERROR.txt`),
  ];
  for (const candidate of candidates) {
    try {
      const text = (await readFile(candidate, "utf8")).trim();
      if (text) return text;
    } catch {
      // try the next candidate
    }
  }
  return null;
}

// ── Stock analysis: scan local PDFs, upload new ones / mark failures ──────────

async function syncStockAnalysis(state) {
  let changed = false;
  let filenames;
  try {
    filenames = await readdir(STOCK_SRC_DIR);
  } catch (err) {
    console.warn(`Skipping stock analysis: cannot read ${STOCK_SRC_DIR} (${err.message})`);
    return changed;
  }

  for (const filename of filenames) {
    const match = STOCK_FILENAME_RE.exec(filename);
    if (!match) continue;
    const [, yyyy, mm, dd] = match;
    const dateStr = `${yyyy}-${mm}-${dd}`;
    const localPath = path.join(STOCK_SRC_DIR, filename);
    const info = await stat(localPath);
    const pdfPathname = `${STOCK_PREFIX}${yyyy}/${mm}/${filename}`;
    const errorPathname = pdfPathname.replace(/\.pdf$/, ".error");
    const isError = info.size < STOCK_ERROR_MAX_BYTES;
    const existing = state.stock[dateStr];

    if (isError) {
      const reason = (await readErrorReason(dateStr)) ?? "No session data was available (reason not logged).";
      if (existing && existing.kind !== "error") {
        await del(existing.pathname);
      }
      if (!existing || existing.kind !== "error" || existing.reason !== reason) {
        await put(errorPathname, JSON.stringify({ reason }), {
          access: "private", addRandomSuffix: false, allowOverwrite: true, contentType: "application/json",
        });
        state.stock[dateStr] = { pathname: errorPathname, kind: "error", reason, year: Number(yyyy), month: Number(mm), day: Number(dd) };
        console.log(`Marked failed report: ${errorPathname}`);
        changed = true;
      }
    } else {
      if (existing && existing.kind === "error") {
        await del(existing.pathname);
      }
      if (!existing || existing.kind !== "report") {
        if (info.size === 0) {
          console.warn(`Skipping empty file: ${localPath}`);
          continue;
        }
        const body = await readFile(localPath);
        await put(pdfPathname, body, { access: "private", addRandomSuffix: false, allowOverwrite: false });
        state.stock[dateStr] = { pathname: pdfPathname, kind: "report", year: Number(yyyy), month: Number(mm), day: Number(dd) };
        console.log(`Uploaded ${pdfPathname}`);
        changed = true;
      }
    }
  }
  return changed;
}

// ── Trade cards: scan local HTMLs, upload new ones ─────────────────────────

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(full)));
    else files.push(full);
  }
  return files;
}

async function syncTrades(state) {
  let changed = false;
  let allFiles;
  try {
    allFiles = await walk(TRADES_SRC_DIR);
  } catch (err) {
    console.warn(`Skipping trading bot trades: cannot read ${TRADES_SRC_DIR} (${err.message})`);
    return changed;
  }

  for (const localPath of allFiles) {
    const filename = path.basename(localPath);
    const match = TRADE_FILENAME_RE.exec(filename);
    if (!match) continue;
    const [, yyyy, mo, d, hh, mm, ss, strategy, rawDetail] = match;
    const pathname = `${TRADES_PREFIX}${yyyy}/${mo}/${filename}`;
    if (state.trades[pathname]) continue; // already uploaded, known locally

    const info = await stat(localPath);
    if (info.size === 0) {
      console.warn(`Skipping empty file: ${localPath}`);
      continue;
    }
    const body = await readFile(localPath);
    await put(pathname, body, { access: "private", addRandomSuffix: false, allowOverwrite: false });
    state.trades[pathname] = {
      pathname, filename,
      date: `${yyyy}-${mo}-${d}`, time: `${hh}:${mm}:${ss}`,
      year: Number(yyyy), month: Number(mo), day: Number(d),
      strategy, detail: toDetailLabel(rawDetail),
    };
    console.log(`Uploaded ${pathname}`);
    changed = true;
  }
  return changed;
}

// ── Retention: drop anything older than RETENTION_DAYS, at most once/day ──────
// del() is free (per Vercel's Blob pricing docs), so this costs no quota.

async function applyRetention(state) {
  const todayStr = new Date().toISOString().slice(0, 10);
  if (state.lastRetentionCheck === todayStr) return false; // already ran today

  const cutoff = daysAgo(RETENTION_DAYS);
  const toDelete = [];

  for (const [key, entry] of Object.entries(state.stock)) {
    if (new Date(entry.year, entry.month - 1, entry.day) < cutoff) {
      toDelete.push(entry.pathname);
      delete state.stock[key];
    }
  }
  for (const [key, entry] of Object.entries(state.trades)) {
    if (new Date(entry.year, entry.month - 1, entry.day) < cutoff) {
      toDelete.push(entry.pathname);
      delete state.trades[key];
    }
  }

  if (toDelete.length > 0) {
    await del(toDelete);
    console.log(`Retention: removed ${toDelete.length} blob(s) older than ${RETENTION_DAYS} days.`);
  }
  state.lastRetentionCheck = todayStr;
  return toDelete.length > 0;
}

// ── Manifest: everything the site needs, in one blob ───────────────────────
// Built entirely from local state + the local ledger file -- no Blob reads.

async function buildAndMaybeUploadManifest(state, forceUpload) {
  let ledgerRaw = { generated_at: null, trades: {} };
  let ledgerMtime = null;
  try {
    const [text, info] = await Promise.all([readFile(LEDGER_SRC_FILE, "utf8"), stat(LEDGER_SRC_FILE)]);
    ledgerRaw = JSON.parse(text);
    ledgerMtime = info.mtimeMs;
  } catch (err) {
    console.warn(`No trade ledger available yet: ${err.message}`);
  }

  const stockAnalysis = Object.values(state.stock)
    .map((e) => ({
      pathname: e.pathname,
      date: `${e.year}-${String(e.month).padStart(2, "0")}-${String(e.day).padStart(2, "0")}`,
      year: e.year,
      month: e.month,
      week: isoWeek(e.year, e.month, e.day),
      kind: e.kind,
      reason: e.reason,
    }))
    .sort((a, b) => b.date.localeCompare(a.date));

  const trades = Object.values(state.trades)
    .map((e) => ({
      pathname: e.pathname,
      filename: e.filename,
      date: e.date,
      time: e.time,
      year: e.year,
      month: e.month,
      week: isoWeek(e.year, e.month, e.day),
      strategy: e.strategy,
      detail: e.detail,
    }))
    .sort((a, b) => (a.date + a.time < b.date + b.time ? 1 : -1));

  const signature = JSON.stringify({
    stockCount: stockAnalysis.length,
    tradeCount: trades.length,
    ledgerMtime,
  });

  if (!forceUpload && signature === state.lastManifestSignature) {
    return false; // nothing changed since the last upload -- skip the call
  }

  const manifest = {
    generated_at: new Date().toISOString(),
    stockAnalysis,
    trades,
    ledger: ledgerRaw,
  };
  await put(MANIFEST_PATHNAME, JSON.stringify(manifest), {
    access: "private", addRandomSuffix: false, allowOverwrite: true, contentType: "application/json",
  });
  state.lastManifestSignature = signature;
  console.log(
    `Uploaded ${MANIFEST_PATHNAME} (${stockAnalysis.length} reports, ${trades.length} trades, ${Object.keys(ledgerRaw.trades ?? {}).length} ledger rows).`
  );
  return true;
}

async function main() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error("BLOB_READ_WRITE_TOKEN is not set. Aborting.");
    process.exit(1);
  }

  const state = await loadState();
  try {
    await bootstrapFromBlobIfNeeded(state);

    const stockChanged = await syncStockAnalysis(state);
    const tradesChanged = await syncTrades(state);
    const retentionChanged = await applyRetention(state);

    const manifestUploaded = await buildAndMaybeUploadManifest(state, stockChanged || tradesChanged || retentionChanged);

    console.log(
      `Sync complete. stock_changed=${stockChanged} trades_changed=${tradesChanged} retention_changed=${retentionChanged} manifest_uploaded=${manifestUploaded}`
    );
  } finally {
    // Always persist whatever progress was made (bootstrap, uploads, retention)
    // even if a later step throws -- e.g. the Blob store being suspended
    // shouldn't force re-doing the one-time bootstrap list() calls on every retry.
    await saveState(state);
  }
}

main().catch((err) => {
  console.error("Sync failed:", err);
  process.exit(1);
});
