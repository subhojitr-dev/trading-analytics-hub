import { listAnalysisRequests, type AnalysisRequest } from "@/lib/requests";

export const dynamic = "force-dynamic";

function formatSubmittedAt(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function RequestCard({ request }: { request: AnalysisRequest }) {
  return (
    <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <p className="mb-2 text-xs text-zinc-500">{formatSubmittedAt(request.submittedAt)}</p>
      <div className="space-y-3 text-sm">
        {request.stock && (
          <div>
            <p className="font-medium">
              Analyze <span className="font-mono">{request.stock.symbol}</span>
            </p>
            {request.stock.extraCriteria && (
              <p className="mt-0.5 text-zinc-600 dark:text-zinc-400">
                Extra criteria: {request.stock.extraCriteria}
              </p>
            )}
          </div>
        )}
        {request.optionsTest && (
          <div>
            <p className="font-medium">
              Test <span className="font-semibold">{request.optionsTest.strategy}</span> on{" "}
              <span className="font-mono">{request.optionsTest.symbol}</span>
            </p>
            {request.optionsTest.notes && (
              <p className="mt-0.5 text-zinc-600 dark:text-zinc-400">
                Notes: {request.optionsTest.notes}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default async function RequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const allRequests = await listAnalysisRequests();
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const requests = allRequests.filter((r) => new Date(r.submittedAt).getTime() >= weekAgo);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-2 text-2xl font-bold">Request Analysis</h1>
      <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
        Ask for a stock to be looked at, or an options strategy to be tested —
        including strategies not currently running in the trading bot.
        Submissions are saved here for review; nothing runs automatically yet.
      </p>

      {params.submitted === "1" && (
        <div className="mb-6 rounded-lg border border-green-300 bg-green-50 p-3 text-sm text-green-900 dark:border-green-900 dark:bg-green-950 dark:text-green-200">
          Request saved.
        </div>
      )}
      {params.error === "empty" && (
        <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
          Fill in at least one section before submitting.
        </div>
      )}

      <form action="/api/requests" method="POST" className="space-y-6">
        <fieldset className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <legend className="px-1 text-sm font-semibold">Analyze a stock</legend>
          <label className="mb-1 mt-2 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Stock symbol
          </label>
          <input
            name="stockSymbol"
            placeholder="e.g. TSLA"
            className="mb-3 w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700"
          />
          <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Extra criteria to include (optional)
          </label>
          <textarea
            name="extraCriteria"
            rows={2}
            placeholder="Anything beyond the usual 12 technical + 5 fundamental checks — e.g. insider buying, a specific price level, sector comparison"
            className="w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700"
          />
        </fieldset>

        <fieldset className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <legend className="px-1 text-sm font-semibold">Test an options strategy</legend>
          <label className="mb-1 mt-2 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Stock symbol
          </label>
          <input
            name="optionsSymbol"
            placeholder="e.g. AAPL"
            className="mb-3 w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700"
          />
          <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Strategy
          </label>
          <input
            name="strategyName"
            placeholder="An existing one, or a brand new strategy idea"
            className="mb-3 w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700"
          />
          <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Notes / parameters (optional)
          </label>
          <textarea
            name="strategyNotes"
            rows={2}
            placeholder="Entry/exit rules, strike selection, timeframe, anything specific"
            className="w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700"
          />
        </fieldset>

        <button
          type="submit"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          Submit request
        </button>
      </form>

      <h2 className="mb-1 mt-10 text-lg font-semibold">Past requests</h2>
      <p className="mb-3 text-xs text-zinc-500">Showing the last 7 days.</p>
      {requests.length === 0 ? (
        <p className="text-sm text-zinc-500">
          {allRequests.length === 0
            ? "No requests submitted yet."
            : "No requests in the last 7 days."}
        </p>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <RequestCard key={r.id} request={r} />
          ))}
        </div>
      )}
    </div>
  );
}
