"use client";

import { useState } from "react";
import Link from "next/link";
import DateTreeNav from "./DateTreeNav";
import type { YearGroup } from "@/lib/tree";
import type { StockAnalysisEntry } from "@/lib/blob";
import { formatDateLong } from "@/lib/date";

export default function StockAnalysisView({
  tree,
}: {
  tree: YearGroup<StockAnalysisEntry>[];
}) {
  const firstEntry = tree[0]?.months[0]?.weeks[0]?.dates[0];
  const [selected, setSelected] = useState<
    { date: string; items: StockAnalysisEntry[] } | null
  >(firstEntry ? { date: firstEntry.date, items: firstEntry.items } : null);

  const item = selected?.items[0];

  return (
    <div className="flex gap-6">
      <aside className="w-64 shrink-0">
        <Link
          href="/stock-analysis/criteria"
          className="mb-4 inline-block text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
        >
          How stocks are graded →
        </Link>
        <DateTreeNav
          tree={tree}
          selectedDate={selected?.date ?? null}
          onSelectDate={(date, items) => setSelected({ date, items })}
          countLabel={(items) => (items[0]?.kind === "error" ? "⚠" : "")}
        />
      </aside>
      <section className="min-w-0 flex-1">
        {item ? (
          <>
            <h2 className="mb-3 text-lg font-semibold">{formatDateLong(item.date)}</h2>
            {item.kind === "error" ? (
              <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
                <p className="font-medium">⚠ Report unavailable for this date</p>
                <p className="mt-1">
                  The Morning Brief generation failed. This usually resolves on its own
                  the next time the report is generated; check back tomorrow.
                </p>
                <p className="mt-2 font-mono text-xs opacity-80">
                  Reason: {item.reason ?? "not logged"}
                </p>
              </div>
            ) : (
              <iframe
                src={`/api/file?path=${encodeURIComponent(item.pathname)}`}
                className="h-[80vh] w-full rounded-lg border border-zinc-200 bg-white dark:border-zinc-800"
                title={`Morning Brief ${item.date}`}
              />
            )}
          </>
        ) : (
          <p className="text-sm text-zinc-500">Select a date to view its Morning Brief.</p>
        )}
      </section>
    </div>
  );
}
