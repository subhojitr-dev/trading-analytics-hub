"use client";

import { useMemo, useState } from "react";
import DateTreeNav from "./DateTreeNav";
import TradeCard from "./TradeCard";
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
  const firstEntry = tree[0]?.months[0]?.weeks[0]?.dates[0];
  const [selected, setSelected] = useState<{ date: string; items: TradeEntry[] } | null>(
    firstEntry ? { date: firstEntry.date, items: firstEntry.items } : null
  );
  const [strategyFilter, setStrategyFilter] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");

  const activeFilters = strategyFilter.size > 0 || search.trim() !== "";

  function toggleStrategy(strategy: string) {
    setStrategyFilter((prev) => {
      const next = new Set(prev);
      if (next.has(strategy)) next.delete(strategy);
      else next.add(strategy);
      return next;
    });
  }

  const filteredByDate = useMemo(() => {
    if (!activeFilters) return null;
    const query = search.trim().toLowerCase();
    const matches = entries.filter((e) => {
      if (strategyFilter.size > 0 && !strategyFilter.has(e.strategy)) return false;
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
    <div className="flex gap-6">
      <aside className="w-64 shrink-0 space-y-4">
        <div>
          <p className="mb-1 text-xs font-medium uppercase text-zinc-500">Strategy</p>
          <div className="flex flex-wrap gap-1">
            {strategies.map((s) => (
              <button
                key={s}
                onClick={() => toggleStrategy(s)}
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                  strategyFilter.has(s)
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "bg-zinc-200 text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                }`}
              >
                {s}
              </button>
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
            onSelectDate={(date, items) => setSelected({ date, items })}
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
          <p className="text-sm text-zinc-500">No trades found yet.</p>
        )}
      </section>
    </div>
  );
}
