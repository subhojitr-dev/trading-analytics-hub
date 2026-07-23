"use client";

import { useMemo, useState } from "react";
import DateTreeNav from "./DateTreeNav";
import TradeCard from "./TradeCard";
import StrategyChip from "./StrategyChip";
import type { YearGroup } from "@/lib/tree";
import type { TradeEntry } from "@/lib/blob";
import { formatDateLong } from "@/lib/date";

export default function TradingBotView({
  tree,
  entries,
  strategies,
}: {
  tree: YearGroup<TradeEntry>[];
  entries: TradeEntry[];
  strategies: string[];
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

  const filteredByDate = useMemo(() => {
    if (!activeFilters) return null;
    const query = search.trim().toLowerCase();
    const matches = entries.filter((e) => {
      if (strategyFilter !== null && e.strategy !== strategyFilter) return false;
      if (query === "") return true;
      return (
        e.detail.toLowerCase().includes(query) ||
        e.strategy.toLowerCase().includes(query) ||
        e.filename.toLowerCase().includes(query)
      );
    });

    const byDate = new Map<string, TradeEntry[]>();
    for (const m of matches) {
      if (!byDate.has(m.date)) byDate.set(m.date, []);
      byDate.get(m.date)!.push(m);
    }
    return Array.from(byDate.entries()).sort(([a], [b]) => b.localeCompare(a));
  }, [activeFilters, entries, search, strategyFilter]);

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <aside className="w-full space-y-4 lg:w-64 lg:shrink-0">
        <div>
          <p className="mb-1 text-xs font-medium uppercase text-zinc-500">Strategy</p>
          <div className="flex flex-wrap gap-2">
            {strategies.map((s) => (
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
          filteredByDate && filteredByDate.length > 0 ? (
            filteredByDate.map(([date, items]) => (
              <div key={date}>
                <h2 className="mb-2 text-sm font-semibold text-zinc-600 dark:text-zinc-400">
                  {formatDateLong(date)}
                </h2>
                <div className="space-y-2">
                  {items.map((item) => (
                    <TradeCard key={item.pathname} trade={item} />
                  ))}
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-zinc-500">No trades match the current filters.</p>
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
