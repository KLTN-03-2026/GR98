import GISWorkspace from "@/components/custom/gis-workspace";
import { useSearchParams } from "react-router-dom";

export default function SupervisorZonesPage() {
  const [searchParams] = useSearchParams();
  const initialPlotId = searchParams.get("plotId") ?? undefined;

  return (
    <GISWorkspace
      title="Vẽ GIS cho lô đất"
      roleLabel="SUPERVISOR"
      description="SUP vẽ polygon GIS và lưu tọa độ vào plot tương ứng theo plotId."
      initialPlotId={initialPlotId}
    />
  );
}

