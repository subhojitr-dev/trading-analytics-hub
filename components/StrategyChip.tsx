"use client";

import { useEffect, useRef, useState } from "react";
import { STRATEGY_INFO } from "./StrategyInfo";
import { strategyLabel } from "@/lib/strategies";

// How long the popover stays open after the mouse leaves, so a slightly
// diagonal path from the chip to the "View detailed diagram" link (or a brief
// pass over a neighbouring chip) doesn't close it.
const CLOSE_DELAY_MS = 250;

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
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const info = STRATEGY_INFO[strategy];

  function open() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = null;
    setHovered(true);
  }

  function scheduleClose() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setHovered(false), CLOSE_DELAY_MS);
  }

  useEffect(() => () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  return (
    <div
      className={`relative inline-block ${hovered ? "z-50" : ""}`}
      onMouseEnter={open}
      onMouseLeave={scheduleClose}
      onFocus={open}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) scheduleClose();
      }}
    >
      <button
        onClick={onToggle}
        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
          active
            ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
            : "bg-zinc-200 text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
        }`}
      >
        {strategyLabel(strategy)}
      </button>
      {hovered && info && (
        // pt-2 (not mt-2) so the gap between chip and card is still part of the
        // hover area -- the mouse never "leaves" on its way down to the link.
        <div className="absolute left-0 top-full z-50 pt-2">
          <div className="w-[min(18rem,calc(100vw-2rem))] rounded-lg border border-zinc-200 bg-white p-3 text-left shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
            <p className="mb-2 text-sm font-semibold">{info.label}</p>
            <info.Diagram />
            <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">{info.blurb}</p>
            <p className="mt-2 text-xs">
              <span className="font-medium text-zinc-700 dark:text-zinc-300">Useful when: </span>
              <span className="text-zinc-600 dark:text-zinc-400">{info.usefulWhen}</span>
            </p>
            {info.detailedDiagramUrl && (
              <a
                href={info.detailedDiagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 block rounded-md bg-blue-50 px-2 py-1.5 text-center text-xs font-medium text-blue-700 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-300 dark:hover:bg-blue-900"
              >
                View detailed diagram →
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
