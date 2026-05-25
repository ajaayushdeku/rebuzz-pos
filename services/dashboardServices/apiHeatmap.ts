import { HeatmapDataSet } from "@/components/dashboardComponents/overviewDash/heatmap/Heatmap";
import { MOCK_DATA } from "@/lib/mockData/mock-heatmapdata";

export async function getHeatmapData(): Promise<HeatmapDataSet> {
  return MOCK_DATA;
}
