import Link from "next/link";
import { listStockAnalysis } from "@/lib/blob";

export const dynamic = "force-dynamic";

export default async function ErrorsPage() {
  const entries = await listStockAnalysis();
  const errors = entries.filter((e) => e.kind === "error");

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-2 text-2xl font-bold">Errors</h1>
      <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
        Dates where the Morning Brief failed to generate, with the reason
        captured from{" "}
        <Link href="/overview" className="text-blue-600 hover:underline dark:text-blue-400">
          the source application&apos;s error logs
        </Link>
        .
      </p>

      {errors.length === 0 ? (
        <p className="text-sm text-zinc-500">No errors recorded.</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
          {errors.map((e, i) => (
            <div
              key={e.pathname}
              className={`flex flex-col gap-1 p-3 text-sm sm:flex-row sm:gap-4 ${
                i % 2 === 1 ? "bg-zinc-50 dark:bg-zinc-900" : ""
              }`}
            >
              <span className="w-28 shrink-0 font-mono font-medium">{e.date}</span>
              <span className="text-amber-700 dark:text-amber-400">
                {e.reason ?? "not logged"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
