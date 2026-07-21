import { listTrades, distinctStrategies } from "@/lib/blob";
import { buildTree } from "@/lib/tree";
import TradingBotView from "@/components/TradingBotView";

export const dynamic = "force-dynamic";

export default async function TradingBotPage() {
  const entries = await listTrades();
  const tree = buildTree(entries);
  const strategies = distinctStrategies(entries);
  return <TradingBotView tree={tree} entries={entries} strategies={strategies} />;
}
