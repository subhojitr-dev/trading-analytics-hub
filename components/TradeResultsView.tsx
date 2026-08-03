"use client";

import { useMemo, useState } from "react";
import type { LedgerEntry } from "@/lib/blob";

const STRATEGY_ORDER = ["TrailingStop", "CopyTrade", "Flywheel", "Strangle", "IronCondor"];

function fmtMoney(n: number | null): string {
  if (n === null || Number.isNaN(n)) return "—";
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });
}

function fmtGainDollars(n: number): string {
  const sign = n >= 0 ? "+" : "-";
  return `${sign}$${Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtPct(n: number): string {
  const sign = n >= 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}%`;
}

function fmtDateTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function TradeResultsView({
  trades,
  generatedAt,
}: {
  trades: LedgerEntry[];
  generatedAt: string | null;
}) {
  const [strategyFilter, setStrategyFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"OPEN" | "CLOSED" | "ALL">("OPEN");

  const strategies = useMemo(() => {
    const present = new Set(trades.map((t) => t.strategy));
    return STRATEGY_ORDER.filter((s) => present.has(s));
  }, [trades]);

  const filtered = useMemo(() => {
    return trades
      .filter((t) => (strategyFilter ? t.strategy === strategyFilter : true))
      .filter((t) => (statusFilter === "ALL" ? true : t.status === statusFilter))
      .sort((a, b) => {
        if (a.status !== b.status) return a.status === "OPEN" ? -1 : 1;
        if (a.strategy !== b.strategy) return a.strategy.localeCompare(b.strategy);
        return a.symbol.localeCompare(b.symbol);
      });
  }, [trades, strategyFilter, statusFilter]);

  const openTrades = trades.filter((t) => t.status === "OPEN");
  const closedTrades = trades.filter((t) => t.status === "CLOSED");
  const openUnrealized = openTrades.reduce((sum, t) => sum + t.gain_dollars, 0);
  const closedRealized = closedTrades.reduce((sum, t) => sum + t.gain_dollars, 0);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold">Trade Results</h1>
        <p className="text-xs text-zinc-500">
          {generatedAt
            ? `Last updated ${fmtDateTime(generatedAt)} — refreshed once daily after market close`
            : "No ledger data synced yet"}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Open trades" value={String(openTrades.length)} />
        <StatCard label="Closed trades" value={String(closedTrades.length)} />
        <StatCard
          label="Open unrealized P&L"
          value={fmtGainDollars(openUnrealized)}
          tone={openUnrealized >= 0 ? "pos" : "neg"}
        />
        <StatCard
          label="Closed realized P&L"
          value={fmtGainDollars(closedRealized)}
          tone={closedRealized >= 0 ? "pos" : "neg"}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1 rounded-md border border-zinc-300 p-0.5 dark:border-zinc-700">
          {(["OPEN", "CLOSED", "ALL"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded px-2.5 py-1 text-xs font-medium ${
                statusFilter === s
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              {s === "OPEN" ? "Open" : s === "CLOSED" ? "Closed" : "All"}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {strategies.map((s) => (
            <button
              key={s}
              onClick={() => setStrategyFilter((prev) => (prev === s ? null : s))}
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                strategyFilter === s
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "bg-zinc-200 text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-zinc-100 text-left text-xs uppercase text-zinc-500 dark:bg-zinc-900">
            <tr>
              <th className="px-3 py-2">Strategy</th>
              <th className="px-3 py-2">Symbol</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Qty</th>
              <th className="px-3 py-2 text-right">Entry</th>
              <th className="px-3 py-2 text-right">Current</th>
              <th className="px-3 py-2 text-right">Gain $</th>
              <th className="px-3 py-2 text-right">Gain %</th>
              <th className="px-3 py-2">Opened</th>
              <th className="px-3 py-2">Closed</th>
              <th className="px-3 py-2">Last Updated</th>
              <th className="px-3 py-2">Notes</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={12} className="px-3 py-6 text-center text-zinc-500">
                  No trades match the current filters.
                </td>
              </tr>
            ) : (
              filtered.map((t) => (
                <tr
                  key={t.tradeId}
                  className={`border-t border-zinc-100 dark:border-zinc-800 ${
                    t.status === "CLOSED" ? "opacity-60" : ""
                  }`}
                >
                  <td className="whitespace-nowrap px-3 py-2">{t.strategy}</td>
                  <td className="whitespace-nowrap px-3 py-2 font-medium">{t.symbol}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-zinc-500">{t.trade_type}</td>
                  <td className="px-3 py-2">{t.qty}</td>
                  <td className="px-3 py-2 text-right font-mono">{fmtMoney(t.entry_price)}</td>
                  <td className="px-3 py-2 text-right font-mono">{fmtMoney(t.current_price)}</td>
                  <td
                    className={`px-3 py-2 text-right font-mono font-semibold ${
                      t.gain_dollars >= 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {fmtGainDollars(t.gain_dollars)}
                  </td>
                  <td
                    className={`px-3 py-2 text-right font-mono font-semibold ${
                      t.gain_pct >= 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {fmtPct(t.gain_pct)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-zinc-500">{t.opened_at ?? "—"}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-zinc-500">{t.closed_at ?? "—"}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-xs text-zinc-400">
                    {fmtDateTime(t.last_updated)}
                  </td>
                  <td className="max-w-[240px] truncate px-3 py-2 text-xs text-zinc-400" title={t.notes}>
                    {t.close_reason ? `${t.close_reason} — ` : ""}
                    {t.notes}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({ label, value, tone }: { label: string; value: string; tone?: "pos" | "neg" }) {
  return (
    <div className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
      <p className="text-xs text-zinc-500">{label}</p>
      <p
        className={`text-lg font-semibold ${
          tone === "pos"
            ? "text-emerald-600 dark:text-emerald-400"
            : tone === "neg"
              ? "text-red-600 dark:text-red-400"
              : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}
