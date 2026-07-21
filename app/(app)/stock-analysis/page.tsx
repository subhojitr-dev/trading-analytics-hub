import { listStockAnalysis } from "@/lib/blob";
import { buildTree } from "@/lib/tree";
import StockAnalysisView from "@/components/StockAnalysisView";

export const dynamic = "force-dynamic";

export default async function StockAnalysisPage() {
  const entries = await listStockAnalysis();
  const tree = buildTree(entries);
  return <StockAnalysisView tree={tree} />;
}
