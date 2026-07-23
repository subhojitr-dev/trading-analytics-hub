import Link from "next/link";

export default function OverviewPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-2 text-2xl font-bold">Overview</h1>
      <p className="mb-8 text-sm text-zinc-600 dark:text-zinc-400">
        This site is a <strong>read-only viewer</strong>. It doesn&apos;t score any
        stocks or place any trades itself — two separate applications do that
        work, running locally on a Windows PC on their own Task Scheduler
        jobs. This site just displays what they produce.
      </p>

      <section className="mb-8 space-y-4">
        <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <h2 className="mb-1 text-base font-semibold">
            1. TradingView Morning Brief{" "}
            <span className="font-normal text-zinc-500">(tradingview-mcp-jackson)</span>
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Scores a fixed watchlist of 10 stocks every weekday morning using
            live TradingView data — 12 technical checks daily, plus a
            fundamental check twice a week — and generates a PDF report.
          </p>
          <p className="mt-2 text-xs text-zinc-500">Feeds the Stock Analysis tab.</p>
        </div>

        <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <h2 className="mb-1 text-base font-semibold">
            2. Automated Trading Bot System <span className="font-normal text-zinc-500">(tradingbot)</span>
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Runs 5 automated paper-trading strategies (Trailing Stop, Copy
            Trade, Flywheel, Strangle, Iron Condor) against Alpaca&apos;s paper
            trading API throughout market hours, emailing a record every time
            it opens, closes, or adjusts a position. No real money is at risk.
          </p>
          <p className="mt-2 text-xs text-zinc-500">Feeds the Trading Bot Trades tab.</p>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-2 text-lg font-semibold">How the data gets here</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          A separate sync script — also scheduled via Windows Task Scheduler,
          every 20 minutes during market hours — scans the output folders of
          both applications above and uploads new files to private cloud
          storage. This site only ever reads from that storage; it never talks
          to either application directly, and nothing on this site executes
          trades or generates reports.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-2 text-lg font-semibold">How the Trading Bot Trades display works</h2>
        <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-400">
          The strategy chips and the date tree are two separate ways to look
          at the same trades, and only one is active at a time:
        </p>
        <ul className="list-disc space-y-2 pl-5 text-sm text-zinc-600 dark:text-zinc-400">
          <li>
            <strong>Nothing selected</strong> — only the date tree shows. Pick a
            date to see every trade from that day.
          </li>
          <li>
            <strong>Click a strategy chip</strong> — shows every trade for that
            strategy, across every stock and every date, and nothing else.
            Clicking a different chip switches to it; clicking the active one
            again clears the filter and goes back to date-browsing.
          </li>
          <li>
            <strong>Strategy chip + symbol/action search</strong> — typing in
            the search box while a strategy is selected narrows further, to
            just that strategy for that stock or action (e.g. Strangle + AMZN
            shows only Strangle trades on AMZN).
          </li>
          <li>
            <strong>Clicking a date</strong> always clears any active
            strategy/search filter first, so date-browsing and
            strategy-filtering never mix.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">Where errors are logged</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          When the Morning Brief fails to generate, the TradingView Morning
          Brief application writes the reason to a small text file on the PC:
        </p>
        <p className="my-2 rounded-md bg-zinc-100 p-2 font-mono text-xs dark:bg-zinc-900">
          C:\Users\subho\tradingview-mcp-jackson\logs\
          <wbr />
          {"{date}"}-morning-ERROR.txt
        </p>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          (falling back to <span className="font-mono">{"{date}"}-continue-ERROR.txt</span>{" "}
          if that one is missing). A full run trace for the same day lives
          alongside it in <span className="font-mono">{"{date}"}.log</span> for deeper
          digging. The sync script reads that short reason and carries it over
          — it shows up inline wherever a failed date is selected on the{" "}
          <Link href="/stock-analysis" className="text-blue-600 hover:underline dark:text-blue-400">
            Stock Analysis
          </Link>{" "}
          tab, and every failed date is listed together on the{" "}
          <Link href="/errors" className="text-blue-600 hover:underline dark:text-blue-400">
            Errors
          </Link>{" "}
          tab.
        </p>
      </section>
    </div>
  );
}
