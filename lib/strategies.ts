// Single source of truth for the strategy buttons shown on the Trading Bot Trades
// and Trade Results tabs. The buttons are ALWAYS all six -- a strategy with no
// trades yet (e.g. Iron Condor) still gets a button and an explanatory empty state,
// instead of silently vanishing because no data exists for it.

export const STRATEGY_ORDER = [
  "CopyTrade",
  "Strangle",
  "TrailingStop",
  "IronCondor",
  "Flywheel",
  "PharmaScan",
] as const;

export const STRATEGY_LABEL: Record<string, string> = {
  CopyTrade: "Copy Trade",
  Strangle: "Strangle",
  TrailingStop: "TrailingStop",
  IronCondor: "Iron Condor",
  Flywheel: "FlyWheel",
  PharmaScan: "Pharma Scan",
};

export function strategyLabel(strategy: string): string {
  return STRATEGY_LABEL[strategy] ?? strategy;
}

// Words that appear in trade-notification subjects and could be mistaken for a ticker.
const NOT_A_TICKER = new Set([
  "PUT", "CALL", "BUY", "SELL", "ALL", "STOP", "LOSS", "HIT", "OPENED", "CLOSED", "SKIP",
  "SKIPPED", "IN", "CC", "CSP", "PHARMA", "CATALYST", "LADDER", "DAILY", "REPORT", "EXPIRED",
  "WORTHLESS", "ASSIGNED", "CALLED", "AWAY", "ROLLED", "UP", "DOWN", "IV", "ADJUSTMENT",
  "PROFIT", "EARNINGS", "TOO", "HIGH", "NEW", "FDA", "ETF", "EARLY", "HOLDING", "SHARES",
  "SOLD", "ADDED", "TRIAL", "RESULTS", "APPROVAL", "EVENT", "SIDE", "TARGET",
]);

export const NO_SYMBOL = "—";

/** First ticker-looking token in a notification label, e.g. "STOP LOSS HIT SELL ALL GOOGL -5%" -> GOOGL. */
export function extractSymbol(detail: string): string {
  if (/daily report/i.test(detail)) return NO_SYMBOL;
  for (const token of detail.split(/[\s/]+/)) {
    if (/^[A-Z]{1,5}(\.[A-Z])?$/.test(token) && !NOT_A_TICKER.has(token)) return token;
  }
  // "ALL" is a word in "SELL ALL GOOGL" but also the Allstate ticker in "BUY ALL x10".
  if (/bALLb/.test(detail)) return "ALL";
  return NO_SYMBOL;
}

interface Taggable {
  strategy: string;
  detail: string;
}

/**
 * The Pharma Scan feeds catalysts into the Trailing Stop bot, so its emails are all
 * subject-tagged "TrailingStop". Any ticker that ever produced a "PHARMA CATALYST"
 * alert (or has a PharmaScan row in the ledger) is treated as Pharma Scan for its
 * whole life -- catalyst alert, buy, and stop-loss sell -- so one stock's full
 * history stays together.
 */
export function withSymbolAndPharma<T extends Taggable>(
  entries: T[],
  ledgerRows: { strategy: string; symbol: string }[],
): (T & { symbol: string })[] {
  const pharma = new Set<string>();
  for (const r of ledgerRows) if (r.strategy === "PharmaScan") pharma.add(r.symbol);
  const tagged = entries.map((e) => ({ ...e, symbol: extractSymbol(e.detail) }));
  for (const e of tagged) {
    if (/PHARMA CATALYST/i.test(e.detail) && e.symbol !== NO_SYMBOL) pharma.add(e.symbol);
  }
  return tagged.map((e) =>
    e.strategy === "TrailingStop" && pharma.has(e.symbol) ? { ...e, strategy: "PharmaScan" } : e,
  );
}
