// One-shot sync: scan local source folders, upload any files not yet in
// Vercel Blob, then exit. Meant to be invoked on a schedule (Windows Task
// Scheduler), not run as a persistent background process.
//
// Usage:
//   node --env-file=.env.local scripts/sync.mjs
//
// Requires BLOB_READ_WRITE_TOKEN in the environment.

import { list, put } from "@vercel/blob";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

const STOCK_SRC_DIR = "C:\\Users\\subho\\tradingview-mcp-jackson";
const TRADES_SRC_DIR = "C:\\Users\\subho\\tradingbot\\email_archive";

const STOCK_PREFIX = "stock-analysis/";
const TRADES_PREFIX = "trading-bot/";

const STOCK_FILENAME_RE = /^Morning_Brief_(\d{4})-(\d{2})-(\d{2})\.pdf$/;
const TRADE_FILENAME_RE = /^(\d{4})(\d{2})(\d{2})_\d{6}_TradingBot_[A-Za-z]+_.+\.html$/;

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

async function findStockUploads(existing) {
  const uploads = [];
  let filenames;
  try {
    filenames = await readdir(STOCK_SRC_DIR);
  } catch (err) {
    console.warn(`Skipping stock analysis: cannot read ${STOCK_SRC_DIR} (${err.message})`);
    return uploads;
  }

  for (const filename of filenames) {
    const match = STOCK_FILENAME_RE.exec(filename);
    if (!match) continue;
    const [, yyyy, mm] = match;
    const pathname = `${STOCK_PREFIX}${yyyy}/${mm}/${filename}`;
    if (existing.has(pathname)) continue;
    uploads.push({ localPath: path.join(STOCK_SRC_DIR, filename), pathname });
  }
  return uploads;
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

  const [stockUploads, tradeUploads] = await Promise.all([
    findStockUploads(existingStock),
    findTradeUploads(existingTrades),
  ]);

  const stockCount = await uploadAll(stockUploads);
  const tradeCount = await uploadAll(tradeUploads);

  console.log(
    `Sync complete: ${stockCount} stock analysis file(s), ${tradeCount} trade file(s) uploaded.`
  );
}

main().catch((err) => {
  console.error("Sync failed:", err);
  process.exit(1);
});
