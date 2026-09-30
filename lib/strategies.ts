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

export const STRATEGY_DESCRIPTIONS: Record<string, string> = {
  TrailingStop:
    "Buys shares of 15 watchlist stocks and protects them with a −10% hard stop-loss. Once a position rises 10%, a trailing stop activates that sits 5% below the highest price seen — so gains are locked in as the stock climbs but the position isn't sold prematurely. If a stock drops 20% from entry, the bot buys 10 more shares (ladder-in) to lower the average cost.",
  PharmaScan:
    "Every morning the bot scans biotech/pharma news for upcoming FDA decisions (PDUFA dates, Phase 3 results, approval events). Stocks with imminent catalysts are added to the Trailing Stop strategy for that day — same −10% stop and trailing stop rules apply, but the position is specifically sized for the binary event. Positions here were triggered by an FDA catalyst, not the regular watchlist.",
  CopyTrade:
    "Monitors Capitol Trades for new stock disclosures by Nancy Pelosi and Michael McCaul. When either politician files a new purchase, the bot copies it immediately — buying 10 shares of the same stock. Sells are never copied, only buys. The portfolio is capped at 10 simultaneous positions.",
  Flywheel:
    "The Options Wheel: a two-phase income strategy run on AVGO, COHR, NBIS, and GLW. Phase 1 — sell a cash-secured put (collect premium, obligate to buy shares if the stock falls to the strike). Phase 2 — if assigned (stock fell to strike), hold the shares and sell a covered call against them to collect more premium. Repeat the cycle. Each leg closes early at 70% profit captured.",
  Strangle:
    "2–3 weeks before a company's earnings report, buys both a call option and a put option on the same stock (a 'strangle'). The position profits if the stock moves sharply in either direction after earnings — it doesn't matter which way. The combined position closes at +20% gain or −20% loss. High implied volatility before the event makes the options expensive, so the bot skips entries where IV is already elevated.",
  IronCondor:
    "Sells a range on SPY (S&P 500 ETF): a put spread below the current price and a call spread above it — four option legs total. Collects premium upfront and profits as long as SPY stays between the two short strikes until expiration. Time decay works in favor of this trade every day it stays in range. Closes at 50% profit captured or when the cost to close hits 2× the original credit (stop-loss). If SPY drifts too close to one side, the bot rolls the threatened spread to a safer strike.",
};

export function strategyDescription(strategy: string): string | null {
  return STRATEGY_DESCRIPTIONS[strategy] ?? null;
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
  if (/\bALL\b/.test(detail)) return "ALL";
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
