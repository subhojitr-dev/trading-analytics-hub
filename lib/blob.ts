import { list, get } from '@vercel/blob';
import { cache } from 'react';

export const STOCK_PREFIX = 'stock-analysis/';
export const TRADES_PREFIX = 'trading-bot/';
export const MANIFEST_PATHNAME = 'manifest.json';

export interface StockAnalysisEntry {
  pathname: string;
  date: string; // yyyy-mm-dd
  year: number;
  month: number; // 1-12
  week: number;
  kind: 'report' | 'error';
  reason?: string;
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

export interface LedgerTrade {
  strategy: string;
  symbol: string;
  trade_type: string;
  status: 'OPEN' | 'CLOSED';
  opened_at: string | null;
  qty: number;
  entry_price: number | null;
  current_price: number | null;
  gain_dollars: number;
  gain_pct: number;
  last_updated: string;
  closed_at: string | null;
  close_reason: string | null;
  notes: string;
}

export interface LedgerEntry extends LedgerTrade {
  tradeId: string;
}

interface Manifest {
  generated_at: string | null;
  stockAnalysis: StockAnalysisEntry[];
  trades: TradeEntry[];
  ledger: { generated_at?: string; trades?: Record<string, LedgerTrade> };
}

function emptyManifest(): Manifest {
  return { generated_at: null, stockAnalysis: [], trades: [], ledger: {} };
}

// The local sync script (scripts/sync.mjs) rebuilds this single blob whenever
// something actually changes and every page reads it with ONE get() call --
// this is what replaces the old pattern of calling list() (an expensive
// "Advanced Operation" against Vercel Blob's Hobby-plan quota) plus a get()
// per item on every single page view. `cache()` only dedupes within one
// request/render pass, so a page that needs more than one of the exports
// below still costs a single fetch, not one per export.
export const getManifest = cache(async (): Promise<Manifest> => {
  try {
    const result = await get(MANIFEST_PATHNAME, { access: 'private' });
    if (!result || result.statusCode !== 200) return emptyManifest();
    const text = await new Response(result.stream).text();
    const parsed = JSON.parse(text) as Partial<Manifest>;
    return {
      generated_at: parsed.generated_at ?? null,
      stockAnalysis: parsed.stockAnalysis ?? [],
      trades: parsed.trades ?? [],
      ledger: parsed.ledger ?? {},
    };
  } catch {
    return emptyManifest();
  }
});

export async function listStockAnalysis(): Promise<StockAnalysisEntry[]> {
  const manifest = await getManifest();
  return manifest.stockAnalysis;
}

export async function listTrades(): Promise<TradeEntry[]> {
  const manifest = await getManifest();
  return manifest.trades;
}

export function distinctStrategies(entries: TradeEntry[]): string[] {
  return Array.from(new Set(entries.map((e) => e.strategy))).sort();
}

export async function getTradeLedger(): Promise<{ generatedAt: string | null; trades: LedgerEntry[] }> {
  const manifest = await getManifest();
  const trades = Object.entries(manifest.ledger.trades ?? {}).map(([tradeId, t]) => ({ tradeId, ...t }));
  return { generatedAt: manifest.ledger.generated_at ?? null, trades };
}

// Used by lib/requests.ts (the Request Analysis tab), which manages its own
// small set of user-submitted files under a separate prefix and still reads
// Blob live -- that feature is low-traffic and wasn't part of this cleanup.
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
