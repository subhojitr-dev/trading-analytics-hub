import { getTradeLedger } from "@/lib/blob";
import TradeResultsView from "@/components/TradeResultsView";

export const dynamic = "force-dynamic";

export default async function TradeResultsPage() {
  const { generatedAt, trades } = await getTradeLedger();
  // Pharma Scan "WATCHED" rows are monitoring results, not positions -- they
  // live on the Trading Bot page, not in the P&L table.
  return <TradeResultsView trades={trades.filter((t) => t.status !== "WATCHED")} generatedAt={generatedAt} />;
}
