"use client";

import { useState } from "react";
import { monthName } from "@/lib/date";
import type { YearGroup } from "@/lib/tree";

interface DateTreeNavProps<T> {
  tree: YearGroup<T>[];
  selectedDate: string | null;
  onSelectDate: (date: string, items: T[]) => void;
  countLabel?: (items: T[]) => string;
}

export default function DateTreeNav<T>({
  tree,
  selectedDate,
  onSelectDate,
  countLabel,
}: DateTreeNavProps<T>) {
  const firstYear = tree[0]?.year;
  const firstMonth = tree[0]?.months[0]?.month;
  const firstWeek = tree[0]?.months[0]?.weeks[0]?.week;

  const [openYears, setOpenYears] = useState<Set<number>>(
    new Set(firstYear !== undefined ? [firstYear] : [])
  );
  const [openMonths, setOpenMonths] = useState<Set<string>>(
    new Set(firstYear !== undefined && firstMonth !== undefined ? [`${firstYear}-${firstMonth}`] : [])
  );
  const [openWeeks, setOpenWeeks] = useState<Set<string>>(
    new Set(
      firstYear !== undefined && firstMonth !== undefined && firstWeek !== undefined
        ? [`${firstYear}-${firstMonth}-${firstWeek}`]
        : []
    )
  );

  function toggle<K>(set: Set<K>, key: K, setter: (s: Set<K>) => void) {
    const next = new Set(set);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setter(next);
  }

  if (tree.length === 0) {
    return <p className="text-sm text-zinc-500">No files found yet.</p>;
  }

  return (
    <ul className="text-sm">
      {tree.map((y) => (
        <li key={y.year} className="mb-1">
          <button
            onClick={() => toggle(openYears, y.year, setOpenYears)}
            className="flex w-full items-center gap-1 rounded px-2 py-1 text-left font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <span className="w-3">{openYears.has(y.year) ? "▾" : "▸"}</span>
            {y.year}
          </button>
          {openYears.has(y.year) && (
            <ul className="ml-3">
              {y.months.map((m) => {
                const monthKey = `${y.year}-${m.month}`;
                return (
                  <li key={monthKey} className="mb-0.5">
                    <button
                      onClick={() => toggle(openMonths, monthKey, setOpenMonths)}
                      className="flex w-full items-center gap-1 rounded px-2 py-1 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                      <span className="w-3">{openMonths.has(monthKey) ? "▾" : "▸"}</span>
                      {monthName(m.month)}
                    </button>
                    {openMonths.has(monthKey) && (
                      <ul className="ml-3">
                        {m.weeks.map((w) => {
                          const weekKey = `${monthKey}-${w.week}`;
                          return (
                            <li key={weekKey} className="mb-0.5">
                              <button
                                onClick={() => toggle(openWeeks, weekKey, setOpenWeeks)}
                                className="flex w-full items-center gap-1 rounded px-2 py-1 text-left text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                              >
                                <span className="w-3">{openWeeks.has(weekKey) ? "▾" : "▸"}</span>
                                Week {w.week}
                              </button>
                              {openWeeks.has(weekKey) && (
                                <ul className="ml-3">
                                  {w.dates.map((d) => (
                                    <li key={d.date}>
                                      <button
                                        onClick={() => onSelectDate(d.date, d.items)}
                                        className={`flex w-full items-center justify-between rounded px-2 py-1 text-left ${
                                          selectedDate === d.date
                                            ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                                            : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                        }`}
                                      >
                                        <span>{d.date}</span>
                                        {countLabel && (
                                          <span className="text-xs opacity-70">
                                            {countLabel(d.items)}
                                          </span>
                                        )}
                                      </button>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </li>
      ))}
    </ul>
  );
}
