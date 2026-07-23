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
    <div className="flex flex-col gap-6 lg:flex-row">
      <aside className="w-full lg:w-64 lg:shrink-0">
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
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">{formatDateLong(item.date)}</h2>
              {item.kind !== "error" && (
                <a
                  href={`/api/file?path=${encodeURIComponent(item.pathname)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden shrink-0 text-sm font-medium text-blue-600 hover:underline dark:text-blue-400 lg:inline-block"
                >
                  Open in new tab ↗
                </a>
              )}
            </div>
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
              <>
                <a
                  href={`/api/file?path=${encodeURIComponent(item.pathname)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-1 rounded-lg border border-zinc-200 bg-white p-8 text-center hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800 lg:hidden"
                >
                  <span className="text-base font-medium text-blue-600 dark:text-blue-400">
                    📄 View Morning Brief PDF ↗
                  </span>
                  <span className="text-xs text-zinc-500">
                    Opens in your phone&apos;s PDF viewer for proper scrolling and zoom.
                  </span>
                </a>
                <iframe
                  src={`/api/file?path=${encodeURIComponent(item.pathname)}`}
                  className="hidden h-[70dvh] w-full rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 lg:block"
                  title={`Morning Brief ${item.date}`}
                />
              </>
            )}
          </>
        ) : (
          <p className="text-sm text-zinc-500">Select a date to view its Morning Brief.</p>
        )}
      </section>
    </div>
  );
}
