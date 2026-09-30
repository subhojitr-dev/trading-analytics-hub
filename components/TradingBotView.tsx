"use client";

import { useMemo, useState } from "react";
import DateTreeNav from "./DateTreeNav";
import TradeCard from "./TradeCard";
import StrategyChip from "./StrategyChip";
import type { YearGroup } from "@/lib/tree";
import type { TradeEntry, LedgerEntry, LedgerLeg, RiskMetrics, IronCondorRisk, StrangleRisk, TrailingStopRisk } from "@/lib/blob";
import { formatDateLong } from "@/lib/date";
import { STRATEGY_ORDER, NO_SYMBOL, strategyLabel, strategyDescription } from "@/lib/strategies";

function money(n: number | null): string {
  return n === null ? "—" : `$${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

function signed(n: number): string {
  return `${n >= 0 ? "+" : "-"}$${Math.abs(n).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function LegsTable({ legs }: { legs: LedgerLeg[] }) {
  return (
    <div className="mt-2 overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="text-zinc-500 border-b border-zinc-200 dark:border-zinc-700">
            <th className="text-left py-1 pr-3 font-medium">Role</th>
            <th className="text-left py-1 pr-3 font-medium">Side</th>
            <th className="text-left py-1 pr-3 font-medium">Type</th>
            <th className="text-right py-1 pr-3 font-medium">Strike</th>
            <th className="text-right py-1 pr-3 font-medium">Entry Premium</th>
            {"current" in legs[0] && <th className="text-right py-1 font-medium">Current Mid</th>}
          </tr>
        </thead>
        <tbody>
          {legs.map((leg, i) => {
            const isShort = leg.side === "short";
            return (
              <tr key={i} className="border-b border-zinc-100 dark:border-zinc-800 last:border-0">
                <td className="py-1 pr-3 font-medium text-zinc-700 dark:text-zinc-300">{leg.role}</td>
                <td className="py-1 pr-3">
                  <span className={`rounded px-1 py-0.5 font-mono font-semibold ${
                    isShort
                      ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                  }`}>
                    {leg.side.toUpperCase()}
                  </span>
                </td>
                <td className="py-1 pr-3">
                  <span className={`font-mono font-medium ${
                    leg.type === "CALL" ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
                  }`}>
                    {leg.type}
                  </span>
                </td>
                <td className="py-1 pr-3 text-right font-mono">${leg.strike?.toFixed(2) ?? "—"}</td>
                <td className="py-1 pr-3 text-right font-mono">
                  {leg.premium != null ? (
                    <span className={isShort ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}>
                      {isShort ? "+" : "−"}${leg.premium.toFixed(2)}
                    </span>
                  ) : "—"}
                </td>
                {"current" in leg && (
                  <td className="py-1 text-right font-mono text-zinc-500">
                    {leg.current != null ? `$${leg.current.toFixed(2)}` : "—"}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function RiskRow({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2 py-0.5">
      <span className="text-zinc-500 text-xs shrink-0">{label}</span>
      <span className="font-mono text-xs font-medium text-right">
        {value}
        {sub && <span className="ml-1 text-zinc-400 font-normal text-[10px]">{sub}</span>}
      </span>
    </div>
  );
}

function RiskPanel({ risk, strategy }: { risk: RiskMetrics; strategy: string }) {
  if (strategy === "IronCondor") {
    const r = risk as IronCondorRisk;
    const daysLabel = r.days_to_expiry != null
      ? r.days_to_expiry <= 0 ? "expires today" : `${r.days_to_expiry}d remaining`
      : null;
    return (
      <div className="mt-2 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-xs">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400 mb-1">Risk Summary</p>
        <RiskRow label="Net credit collected" value={`$${r.net_credit.toFixed(2)}/share`} sub={`($${(r.net_credit * 100).toFixed(0)} total)`} />
        {r.short_put_strike != null && r.short_call_strike != null && (
          <RiskRow
            label="Best case — expire worthless"
            value={`SPY stays $${r.short_put_strike} – $${r.short_call_strike}`}
            sub={r.expiry ? `by ${r.expiry}${daysLabel ? ` (${daysLabel})` : ""} → keep full $${(r.net_credit * 100).toFixed(0)}` : undefined}
          />
        )}
        <RiskRow
          label="Profit target (50%)"
          value={`cost-to-close ≤ $${r.profit_target_credit.toFixed(2)}/share`}
          sub={`lock in $${r.profit_target_dollars.toFixed(0)}`}
        />
        <RiskRow
          label="Stop-loss trigger (2×)"
          value={`cost-to-close ≥ $${r.stop_loss_credit.toFixed(2)}/share`}
          sub={`cuts loss to $${r.stop_loss_dollars.toFixed(0)}`}
        />
        <RiskRow
          label="Max possible loss (if spread fills)"
          value={r.max_loss_per_share != null ? `$${r.max_loss_per_share.toFixed(2)}/share` : "—"}
          sub={r.max_loss_dollars != null ? `($${r.max_loss_dollars.toFixed(0)} total, spread ${r.wing_width} wide)` : undefined}
        />
      </div>
    );
  }
  if (strategy === "Strangle") {
    const r = risk as StrangleRisk;
    return (
      <div className="mt-2 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-xs">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400 mb-1">Risk Summary</p>
        <RiskRow label="Total cost (both legs)" value={`$${r.total_cost.toFixed(2)}/share`} sub={`($${(r.total_cost * 100).toFixed(0)} total)`} />
        <RiskRow label="Profit target (+20%)" value={`combined gain ≥ +20%`} sub={`+$${r.profit_target_dollars.toFixed(0)}`} />
        <RiskRow label="Stop-loss (−20%)" value={`combined loss ≤ −20%`} sub={`−$${r.stop_loss_dollars.toFixed(0)}`} />
      </div>
    );
  }
  if (strategy === "TrailingStop" || strategy === "PharmaScan") {
    const r = risk as TrailingStopRisk;
    return (
      <div className="mt-2 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-xs">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400 mb-1">Risk Summary</p>
        <RiskRow label="Hard stop-loss (−10%)" value={`$${r.stop_loss_price.toFixed(2)}`} sub={`loss $${Math.abs(r.stop_loss_dollars).toFixed(0)}`} />
        <RiskRow label="Trailing stop" value={r.trailing_active ? "ACTIVE — 5% below peak" : "Activates at +10% gain"} />
        {r.highest_price != null && r.trailing_active && (
          <RiskRow label="Highest price seen" value={`$${r.highest_price.toFixed(2)}`} sub={`trail stop @ $${(r.highest_price * 0.95).toFixed(2)}`} />
        )}
      </div>
    );
  }
  return null;
}

// One line of the per-stock "position record" -- the ledger's view of a single trade
// (open date, entry -> current/exit price, P&L). It is what makes a strategy whose
// bot sends few or no email alerts (Flywheel, Iron Condor) still show a full history.
function LedgerLine({ row }: { row: LedgerEntry }) {
  const pos = row.gain_dollars >= 0;
  const hasLegs = row.legs && row.legs.length > 0;
  const hasRisk = row.risk_metrics != null && row.status === "OPEN";
  return (
    <div className="rounded-md bg-zinc-50 px-3 py-2 text-xs dark:bg-zinc-900">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
        <span
          className={`rounded px-1.5 py-0.5 font-medium ${
            row.status === "OPEN"
              ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
              : "bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200"
          }`}
        >
          {row.status}
        </span>
        <span className="font-medium">{row.trade_type}</span>
        <span className="text-zinc-500">
          {row.opened_at ?? "opened —"} → {row.closed_at ?? "still open"}
        </span>
        <span className="text-zinc-500">
          {money(row.entry_price)} → {money(row.current_price)}
        </span>
        <span
          className={`font-mono font-semibold ${
            pos ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
          }`}
        >
          {signed(row.gain_dollars)} ({row.gain_pct >= 0 ? "+" : ""}
          {row.gain_pct.toFixed(2)}%)
        </span>
        {row.close_reason && <span className="text-zinc-500">{row.close_reason}</span>}
        {row.notes && <span className="truncate text-zinc-400">{row.notes}</span>}
      </div>
      {hasLegs && <LegsTable legs={row.legs!} />}
      {hasRisk && <RiskPanel risk={row.risk_metrics!} strategy={row.strategy} />}
    </div>
  );
}

export default function TradingBotView({
  tree,
  entries,
  ledger,
}: {
  tree: YearGroup<TradeEntry>[];
  entries: TradeEntry[];
  ledger: LedgerEntry[];
}) {
  const [selected, setSelected] = useState<{ date: string; items: TradeEntry[] } | null>(null);
  const [strategyFilter, setStrategyFilter] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const activeFilters = strategyFilter !== null || search.trim() !== "";

  function toggleStrategy(strategy: string) {
    setStrategyFilter((prev) => (prev === strategy ? null : strategy));
  }

  function selectDate(date: string, items: TradeEntry[]) {
    setSelected({ date, items });
    setStrategyFilter(null);
    setSearch("");
  }

  // Filtered view: one group per stock, each group in chronological order (oldest
  // first) so a stock reads top-to-bottom as its story -- entry, adjustments, exit.
  const bySymbol = useMemo(() => {
    if (!activeFilters) return null;
    const query = search.trim().toLowerCase();

    const cards = entries.filter((e) => {
      if (strategyFilter !== null && e.strategy !== strategyFilter) return false;
      if (query === "") return true;
      return (
        e.detail.toLowerCase().includes(query) ||
        e.strategy.toLowerCase().includes(query) ||
        strategyLabel(e.strategy).toLowerCase().includes(query) ||
        e.filename.toLowerCase().includes(query)
      );
    });
    const rows = ledger.filter((r) => {
      if (strategyFilter !== null && r.strategy !== strategyFilter) return false;
      if (query === "") return true;
      return (
        r.symbol.toLowerCase().includes(query) ||
        r.strategy.toLowerCase().includes(query) ||
        strategyLabel(r.strategy).toLowerCase().includes(query)
      );
    });

    const groups = new Map<string, { cards: TradeEntry[]; rows: LedgerEntry[] }>();
    const slot = (sym: string) => {
      if (!groups.has(sym)) groups.set(sym, { cards: [], rows: [] });
      return groups.get(sym)!;
    };
    for (const c of cards) slot(c.symbol).cards.push(c);
    for (const r of rows) slot(r.symbol).rows.push(r);

    for (const g of groups.values()) {
      g.cards.sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
      g.rows.sort((a, b) => (a.opened_at ?? "").localeCompare(b.opened_at ?? ""));
    }
    return Array.from(groups.entries()).sort(([a], [b]) => {
      if (a === NO_SYMBOL) return 1;
      if (b === NO_SYMBOL) return -1;
      return a.localeCompare(b);
    });
  }, [activeFilters, entries, ledger, search, strategyFilter]);

  const emptyMessage =
    strategyFilter !== null && search.trim() === ""
      ? `No ${strategyLabel(strategyFilter)} trades recorded yet.` +
        (strategyFilter === "IronCondor"
          ? " The bot has scanned SPY / IWM / GLD but has never opened a condor — hover the button and open the detailed diagram for why."
          : "")
      : "No trades match the current filters.";

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <aside className="w-full space-y-4 lg:w-64 lg:shrink-0">
        <div>
          <p className="mb-1 text-xs font-medium uppercase text-zinc-500">Strategy</p>
          <div className="flex flex-wrap gap-2">
            {STRATEGY_ORDER.map((s) => (
              <StrategyChip
                key={s}
                strategy={s}
                active={strategyFilter === s}
                onToggle={() => toggleStrategy(s)}
              />
            ))}
          </div>
        </div>
        <div>
          <p className="mb-1 text-xs font-medium uppercase text-zinc-500">
            Symbol / action search
          </p>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="e.g. SPY, OPENED"
            className="w-full rounded-md border border-zinc-300 bg-transparent px-2 py-1.5 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700"
          />
        </div>
        <div className="border-t border-zinc-200 pt-3 dark:border-zinc-800">
          <p className="mb-1 text-xs font-medium uppercase text-zinc-500">Browse by date</p>
          <DateTreeNav
            tree={tree}
            selectedDate={activeFilters ? null : selected?.date ?? null}
            onSelectDate={selectDate}
            countLabel={(items) => String(items.length)}
          />
        </div>
      </aside>

      <section className="min-w-0 flex-1 space-y-6">
        {activeFilters ? (
          bySymbol && bySymbol.length > 0 ? (
            <>
              {strategyFilter && strategyDescription(strategyFilter) && (
                <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900">
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                    How {strategyLabel(strategyFilter)} works
                  </p>
                  <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                    {strategyDescription(strategyFilter)}
                  </p>
                </div>
              )}
              <p className="text-xs text-zinc-500">
                Grouped by stock, oldest first — each stock reads as one trade from beginning to end.
              </p>
              {bySymbol.map(([symbol, g]) => (
                <div key={symbol}>
                  <h2 className="mb-2 flex items-baseline gap-2 border-b border-zinc-200 pb-1 text-base font-semibold dark:border-zinc-800">
                    {symbol === NO_SYMBOL ? "General / multi-stock reports" : symbol}
                    <span className="text-xs font-normal text-zinc-500">
                      {g.cards.length} alert{g.cards.length === 1 ? "" : "s"}
                      {g.rows.length > 0 && ` · ${g.rows.length} position${g.rows.length === 1 ? "" : "s"}`}
                    </span>
                  </h2>
                  {g.rows.length > 0 && (
                    <div className="mb-2 space-y-1">
                      {g.rows.map((r) => (
                        <LedgerLine key={r.tradeId} row={r} />
                      ))}
                    </div>
                  )}
                  <div className="space-y-2">
                    {g.cards.map((item) => (
                      <TradeCard key={item.pathname} trade={item} showDate />
                    ))}
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div className="space-y-3">
              {strategyFilter && strategyDescription(strategyFilter) && (
                <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900">
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                    How {strategyLabel(strategyFilter)} works
                  </p>
                  <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                    {strategyDescription(strategyFilter)}
                  </p>
                </div>
              )}
              <p className="text-sm text-zinc-500">{emptyMessage}</p>
            </div>
          )
        ) : selected ? (
          <div>
            <h2 className="mb-2 text-lg font-semibold">{formatDateLong(selected.date)}</h2>
            <div className="space-y-2">
              {selected.items.map((item) => (
                <TradeCard key={item.pathname} trade={item} />
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-zinc-500">
            Select a strategy above, or a date from the tree, to see trades.
          </p>
        )}
      </section>
    </div>
  );
}
