import Link from "next/link";

const TECHNICAL_CRITERIA = [
  { name: "Uptrend", meaning: "Price is above its 75-day average, and that average is still climbing." },
  { name: "Near 52-Week High", meaning: "Price is within 15% of its highest point in the past year." },
  { name: "Shallow Pullback", meaning: "The recent dip from its high is less than 7% — not a deep drop." },
  { name: "Volume Drying Up", meaning: "Trading volume over the last 5 days is quiet compared to the last 20 — a sign sellers have backed off." },
  { name: "Tight Candles", meaning: "Daily price swings have been small (under 1.5%) recently — calm, orderly trading." },
  { name: "No Whipsaws", meaning: "No wild single-day price swings (over 4%) in the last week." },
  { name: "Inside Bar / Tight Range", meaning: "The last few days have traded in an unusually narrow range — often a pause before a move." },
  { name: "Volatility Contraction", meaning: "Price has been squeezed into a tight 5% range over the last two weeks." },
  { name: "Supply Gone", meaning: "Quiet volume with no heavy sell-off days — sellers appear exhausted." },
  { name: "Healthy Momentum", meaning: "RSI is between 50–75 — trending up without being \"overbought.\"" },
  { name: "MACD Bullish", meaning: "The MACD trend indicator is pointing up and above zero." },
  { name: "Above Key Averages", meaning: "Price is above both its 20-day and 50-day averages, and the 20-day is above the 50-day." },
];

const GRADES = [
  { grade: "A+", range: "10–12 points", meaning: "High conviction — worth looking for an entry today." },
  { grade: "A", range: "8–9 points", meaning: "Watch closely, set an alert at the breakout level." },
  { grade: "B+", range: "6–7 points", meaning: "Setting up, keep it on the watchlist." },
  { grade: "Watch", range: "0–5 points", meaning: "Not ready yet — skip for now." },
];

const FUNDAMENTAL_CRITERIA = [
  { name: "Valuation", meaning: "Forward P/E is below the sector average — the stock isn't overpriced relative to peers." },
  { name: "Free Cash Flow", meaning: "Free cash flow is positive and growing year over year — the company generates real cash." },
  { name: "Earnings Growth", meaning: "EPS growth is positive and accelerating year over year." },
  { name: "Revenue Growth", meaning: "Revenue growth is positive and accelerating year over year." },
  { name: "Margin Expansion", meaning: "EBITDA margin is expanding year over year — the business is getting more efficient." },
];

const MODIFIERS = [
  { score: "4 or 5 out of 5", effect: "Grade moves up one notch (e.g. B → B+)" },
  { score: "3 out of 5", effect: "No change" },
  { score: "2 out of 5", effect: "Grade moves down one notch (e.g. A → A-)" },
  { score: "0 or 1 out of 5", effect: "Grade moves down two notches (e.g. A → B)" },
];

export default function CriteriaPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/stock-analysis"
        className="mb-6 inline-block text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
      >
        ← Back to Stock Analysis
      </Link>

      <h1 className="mb-2 text-2xl font-bold">How Stocks Are Graded</h1>
      <p className="mb-8 text-sm text-zinc-600 dark:text-zinc-400">
        Every stock in the Morning Brief goes through two layers of scoring — a
        technical check every day, and a fundamental check twice a week that can
        nudge the grade up or down.
      </p>

      <section className="mb-10">
        <h2 className="mb-3 text-lg font-semibold">1. Technical score (every day)</h2>
        <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
          12 checks are run against the price chart, one point each. The total
          points become the technical grade below.
        </p>
        <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
          {TECHNICAL_CRITERIA.map((c, i) => (
            <div
              key={c.name}
              className={`flex flex-col gap-1 p-3 text-sm sm:flex-row sm:gap-4 ${
                i % 2 === 1 ? "bg-zinc-50 dark:bg-zinc-900" : ""
              }`}
            >
              <span className="shrink-0 font-medium sm:w-44">{c.name}</span>
              <span className="text-zinc-600 dark:text-zinc-400">{c.meaning}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="mb-3 text-lg font-semibold">Grading scale</h2>
        <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
          {GRADES.map((g, i) => (
            <div
              key={g.grade}
              className={`flex flex-col gap-1 p-3 text-sm sm:flex-row sm:items-center sm:gap-4 ${
                i % 2 === 1 ? "bg-zinc-50 dark:bg-zinc-900" : ""
              }`}
            >
              <span className="w-12 shrink-0 font-semibold">{g.grade}</span>
              <span className="w-28 shrink-0 text-zinc-500">{g.range}</span>
              <span className="text-zinc-600 dark:text-zinc-400">{g.meaning}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="mb-3 text-lg font-semibold">
          2. Fundamental check (Tuesdays &amp; Thursdays)
        </h2>
        <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
          Twice a week, 5 business-health checks are scored (1 point each). The
          result adjusts — but doesn&apos;t replace — the technical grade above.
        </p>
        <div className="mb-4 overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
          {FUNDAMENTAL_CRITERIA.map((c, i) => (
            <div
              key={c.name}
              className={`flex flex-col gap-1 p-3 text-sm sm:flex-row sm:gap-4 ${
                i % 2 === 1 ? "bg-zinc-50 dark:bg-zinc-900" : ""
              }`}
            >
              <span className="shrink-0 font-medium sm:w-40">{c.name}</span>
              <span className="text-zinc-600 dark:text-zinc-400">{c.meaning}</span>
            </div>
          ))}
        </div>
        <p className="mb-2 text-sm font-medium">How the fundamental score changes the grade:</p>
        <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
          {MODIFIERS.map((m, i) => (
            <div
              key={m.score}
              className={`flex flex-col gap-1 p-3 text-sm sm:flex-row sm:gap-4 ${
                i % 2 === 1 ? "bg-zinc-50 dark:bg-zinc-900" : ""
              }`}
            >
              <span className="shrink-0 font-medium sm:w-40">{m.score}</span>
              <span className="text-zinc-600 dark:text-zinc-400">{m.effect}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Earnings risk flag</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Regardless of grade, if a stock is due to report earnings within 6
          calendar days it gets flagged <strong>HIGH RISK</strong>. New entries
          aren&apos;t recommended, and existing positions should consider
          reducing size or tightening stops — earnings can move a stock sharply
          in either direction, overriding any technical or fundamental setup.
        </p>
      </section>
    </div>
  );
}
