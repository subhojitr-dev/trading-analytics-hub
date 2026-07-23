"use client";

import { useState } from "react";
import { STRATEGY_INFO } from "./StrategyInfo";

export default function StrategyChip({
  strategy,
  active,
  onToggle,
}: {
  strategy: string;
  active: boolean;
  onToggle: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const info = STRATEGY_INFO[strategy];

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        onClick={onToggle}
        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
          active
            ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
            : "bg-zinc-200 text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
        }`}
      >
        {strategy}
      </button>
      {hovered && info && (
        <div className="absolute left-0 top-full z-50 mt-2 w-[min(18rem,calc(100vw-2rem))] rounded-lg border border-zinc-200 bg-white p-3 text-left shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
          <p className="mb-2 text-sm font-semibold">{info.label}</p>
          <info.Diagram />
          <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">{info.blurb}</p>
          <p className="mt-2 text-xs">
            <span className="font-medium text-zinc-700 dark:text-zinc-300">Useful when: </span>
            <span className="text-zinc-600 dark:text-zinc-400">{info.usefulWhen}</span>
          </p>
        </div>
      )}
    </div>
  );
}
