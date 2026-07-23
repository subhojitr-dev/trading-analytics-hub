// One-shot sync: scan local source folders, upload any files not yet in
// Vercel Blob, then exit. Meant to be invoked on a schedule (Windows Task
// Scheduler), not run as a persistent background process.
//
// Usage:
//   node --env-file=.env.local scripts/sync.mjs
//
// Requires BLOB_READ_WRITE_TOKEN in the environment.

import { list, put, del } from "@vercel/blob";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

const STOCK_SRC_DIR = "C:\\Users\\subho\\tradingview-mcp-jackson";
const STOCK_LOGS_DIR = "C:\\Users\\subho\\tradingview-mcp-jackson\\logs";
const TRADES_SRC_DIR = "C:\\Users\\subho\\tradingbot\\email_archive";

const STOCK_PREFIX = "stock-analysis/";
const TRADES_PREFIX = "trading-bot/";

const STOCK_FILENAME_RE = /^Morning_Brief_(\d{4})-(\d{2})-(\d{2})\.pdf$/;
const TRADE_FILENAME_RE = /^(\d{4})(\d{2})(\d{2})_\d{6}_TradingBot_[A-Za-z]+_.+\.html$/;

// generate_pdf_report.py falls back to a short "Session data not available"
// page when the day's session JSON is missing. That fallback PDF is always
// ~2.1KB; real reports are always 6KB+. Uploading it as a real report would
// mean the site shows a "broken" viewer for that date, so it's diverted to
// an .error marker instead of being uploaded as a .pdf.
const STOCK_ERROR_MAX_BYTES = 4000;

async function listExistingPathnames(prefix) {
  const pathnames = new Set();
  let cursor;
  do {
    const result = await list({ prefix, cursor, limit: 1000 });
    for (const b of result.blobs) pathnames.add(b.pathname);
    cursor = result.hasMore ? result.cursor : undefined;
  } while (cursor);
  return pathnames;
}

// The morning brief runner writes a small {date}-morning-ERROR.txt (or
// -continue-ERROR.txt) alongside its full run log whenever a step fails —
// e.g. "Credit balance is too low", "API Error: 529 Overloaded". That's the
// actual reason a report didn't generate, so it's read and carried along
// with the .error marker instead of a generic message.
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

async function planStockActions(existing) {
  const uploads = [];
  const errorUploads = [];
  const staleDeletes = [];

  let filenames;
  try {
    filenames = await readdir(STOCK_SRC_DIR);
  } catch (err) {
    console.warn(`Skipping stock analysis: cannot read ${STOCK_SRC_DIR} (${err.message})`);
    return { uploads, errorUploads, staleDeletes };
  }

  for (const filename of filenames) {
    const match = STOCK_FILENAME_RE.exec(filename);
    if (!match) continue;
    const [, yyyy, mm, dd] = match;
    const localPath = path.join(STOCK_SRC_DIR, filename);
    const info = await stat(localPath);
    const pdfPathname = `${STOCK_PREFIX}${yyyy}/${mm}/${filename}`;
    const errorPathname = pdfPathname.replace(/\.pdf$/, ".error");

    if (info.size < STOCK_ERROR_MAX_BYTES) {
      if (existing.has(pdfPathname)) staleDeletes.push(pdfPathname);
      const reason =
        (await readErrorReason(`${yyyy}-${mm}-${dd}`)) ??
        "No session data was available (reason not logged).";
      errorUploads.push({ pathname: errorPathname, reason });
    } else {
      if (existing.has(errorPathname)) staleDeletes.push(errorPathname);
      if (!existing.has(pdfPathname)) uploads.push({ localPath, pathname: pdfPathname });
    }
  }
  return { uploads, errorUploads, staleDeletes };
}

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(full)));
    } else {
      files.push(full);
    }
  }
  return files;
}

async function findTradeUploads(existing) {
  const uploads = [];
  let allFiles;
  try {
    allFiles = await walk(TRADES_SRC_DIR);
  } catch (err) {
    console.warn(`Skipping trading bot trades: cannot read ${TRADES_SRC_DIR} (${err.message})`);
    return uploads;
  }

  for (const localPath of allFiles) {
    const filename = path.basename(localPath);
    const match = TRADE_FILENAME_RE.exec(filename);
    if (!match) continue;
    const [, yyyy, mm] = match;
    const pathname = `${TRADES_PREFIX}${yyyy}/${mm}/${filename}`;
    if (existing.has(pathname)) continue;
    uploads.push({ localPath, pathname });
  }
  return uploads;
}

async function uploadAll(uploads) {
  let uploaded = 0;
  for (const { localPath, pathname } of uploads) {
    const info = await stat(localPath);
    if (info.size === 0) {
      console.warn(`Skipping empty file: ${localPath}`);
      continue;
    }
    const body = await readFile(localPath);
    await put(pathname, body, {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: false,
    });
    console.log(`Uploaded ${pathname}`);
    uploaded += 1;
  }
  return uploaded;
}

async function main() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error("BLOB_READ_WRITE_TOKEN is not set. Aborting.");
    process.exit(1);
  }

  const [existingStock, existingTrades] = await Promise.all([
    listExistingPathnames(STOCK_PREFIX),
    listExistingPathnames(TRADES_PREFIX),
  ]);

  const [stockPlan, tradeUploads] = await Promise.all([
    planStockActions(existingStock),
    findTradeUploads(existingTrades),
  ]);

  if (stockPlan.staleDeletes.length > 0) {
    await del(stockPlan.staleDeletes);
    console.log(`Removed ${stockPlan.staleDeletes.length} stale stock analysis blob(s).`);
  }

  for (const { pathname, reason } of stockPlan.errorUploads) {
    await put(pathname, JSON.stringify({ reason }), {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
    });
    console.log(`Marked failed report: ${pathname} (${reason})`);
  }

  const stockCount = await uploadAll(stockPlan.uploads);
  const tradeCount = await uploadAll(tradeUploads);

  console.log(
    `Sync complete: ${stockCount} stock analysis file(s), ${stockPlan.errorUploads.length} failed-report marker(s), ${tradeCount} trade file(s) uploaded.`
  );
}

main().catch((err) => {
  console.error("Sync failed:", err);
  process.exit(1);
});
