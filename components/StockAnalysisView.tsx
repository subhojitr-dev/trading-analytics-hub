"use client";

import { useState } from "react";
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

  const pdf = selected?.items[0];

  return (
    <div className="flex gap-6">
      <aside className="w-64 shrink-0">
        <DateTreeNav
          tree={tree}
          selectedDate={selected?.date ?? null}
          onSelectDate={(date, items) => setSelected({ date, items })}
        />
      </aside>
      <section className="min-w-0 flex-1">
        {pdf ? (
          <>
            <h2 className="mb-3 text-lg font-semibold">{formatDateLong(pdf.date)}</h2>
            <iframe
              src={`/api/file?path=${encodeURIComponent(pdf.pathname)}`}
              className="h-[80vh] w-full rounded-lg border border-zinc-200 bg-white dark:border-zinc-800"
              title={`Morning Brief ${pdf.date}`}
            />
          </>
        ) : (
          <p className="text-sm text-zinc-500">Select a date to view its Morning Brief.</p>
        )}
      </section>
    </div>
  );
}
