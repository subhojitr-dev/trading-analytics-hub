import { list } from '@vercel/blob';
import { isoWeek } from './date';

export const STOCK_PREFIX = 'stock-analysis/';
export const TRADES_PREFIX = 'trading-bot/';

export interface StockAnalysisEntry {
  pathname: string;
  date: string; // yyyy-mm-dd
  year: number;
  month: number; // 1-12
  week: number;
  kind: 'report' | 'error';
}

export interface TradeEntry {
  pathname: string;
  filename: string;
  date: string; // yyyy-mm-dd
  time: string; // hh:mm:ss
  year: number;
  month: number;
  week: number;
  strategy: string;
  detail: string; // human-readable label derived from the filename
}

export async function listAll(prefix: string): Promise<{ pathname: string }[]> {
  const out: { pathname: string }[] = [];
  let cursor: string | undefined;
  do {
    const result = await list({ prefix, cursor, limit: 1000 });
    out.push(...result.blobs.map((b) => ({ pathname: b.pathname })));
    cursor = result.hasMore ? result.cursor : undefined;
  } while (cursor);
  return out;
}

const STOCK_FILENAME_RE = /Morning_Brief_(\d{4})-(\d{2})-(\d{2})\.(pdf|error)$/;

export async function listStockAnalysis(): Promise<StockAnalysisEntry[]> {
  const blobs = await listAll(STOCK_PREFIX);
  const entries: StockAnalysisEntry[] = [];
  for (const { pathname } of blobs) {
    const match = STOCK_FILENAME_RE.exec(pathname);
    if (!match) continue;
    const [, y, m, d, ext] = match;
    const year = Number(y);
    const month = Number(m);
    const date = `${y}-${m}-${d}`;
    entries.push({
      pathname,
      date,
      year,
      month,
      week: isoWeek(new Date(year, month - 1, Number(d))),
      kind: ext === 'pdf' ? 'report' : 'error',
    });
  }
  entries.sort((a, b) => b.date.localeCompare(a.date));
  return entries;
}

const TRADE_FILENAME_RE = /^(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})_TradingBot_([A-Za-z]+)_(.+)\.html$/;

function toDetailLabel(rawDetail: string): string {
  return rawDetail.replace(/_/g, ' ').replace(/--/g, '—').trim();
}

export async function listTrades(): Promise<TradeEntry[]> {
  const blobs = await listAll(TRADES_PREFIX);
  const entries: TradeEntry[] = [];
  for (const { pathname } of blobs) {
    const filename = pathname.slice(pathname.lastIndexOf('/') + 1);
    const match = TRADE_FILENAME_RE.exec(filename);
    if (!match) continue;
    const [, y, mo, d, hh, mm, ss, strategy, rawDetail] = match;
    const year = Number(y);
    const month = Number(mo);
    entries.push({
      pathname,
      filename,
      date: `${y}-${mo}-${d}`,
      time: `${hh}:${mm}:${ss}`,
      year,
      month,
      week: isoWeek(new Date(year, month - 1, Number(d))),
      strategy,
      detail: toDetailLabel(rawDetail),
    });
  }
  entries.sort((a, b) => (a.date + a.time < b.date + b.time ? 1 : -1));
  return entries;
}

export function distinctStrategies(entries: TradeEntry[]): string[] {
  return Array.from(new Set(entries.map((e) => e.strategy))).sort();
}
