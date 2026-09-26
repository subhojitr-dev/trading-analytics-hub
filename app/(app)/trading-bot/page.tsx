import { listTrades, getTradeLedger } from "@/lib/blob";
import { buildTree } from "@/lib/tree";
import TradingBotView from "@/components/TradingBotView";

export const dynamic = "force-dynamic";

export default async function TradingBotPage() {
  const [entries, ledger] = await Promise.all([listTrades(), getTradeLedger()]);
  const tree = buildTree(entries);
  return <TradingBotView tree={tree} entries={entries} ledger={ledger.trades} />;
}
