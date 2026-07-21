"use client";

import { useState } from "react";
import type { TradeEntry } from "@/lib/blob";

export default function TradeCard({ trade }: { trade: TradeEntry }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
      >
        <span className="flex min-w-0 items-center gap-2">
          <span className="shrink-0 rounded bg-zinc-200 px-1.5 py-0.5 text-xs font-medium dark:bg-zinc-700">
            {trade.strategy}
          </span>
          <span className="truncate">{trade.detail}</span>
        </span>
        <span className="shrink-0 text-xs text-zinc-500">{trade.time}</span>
      </button>
      {open && (
        <iframe
          src={`/api/file?path=${encodeURIComponent(trade.pathname)}`}
          className="h-64 w-full border-t border-zinc-200 bg-white dark:border-zinc-800"
          title={trade.filename}
          sandbox=""
        />
      )}
    </div>
  );
}
