import { getTradeLedger } from "@/lib/blob";
import TradeResultsView from "@/components/TradeResultsView";

export const dynamic = "force-dynamic";

export default async function TradeResultsPage() {
  const { generatedAt, trades } = await getTradeLedger();
  return <TradeResultsView trades={trades} generatedAt={generatedAt} />;
}
