import Heatmap from "@/components/dashboardComponents/overviewDash/heatmap/Heatmap";
import { getHeatmapData } from "@/services/dashboardServices/apiHeatmap";

export default async function HeatmapWrapper() {
  const heatmapData = await getHeatmapData();
  return (
    <div className="w-full px-4">
      <Heatmap data={heatmapData} />
    </div>
  );
}
