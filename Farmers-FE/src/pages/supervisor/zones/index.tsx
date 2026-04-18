import GISWorkspace from "@/components/custom/gis-workspace";
import { useLocation, useSearchParams } from "react-router-dom";

export default function SupervisorZonesPage() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const state = location.state as {
    coordinates?: Array<[number, number]>;
    contractNo?: string;
  } | null;
  const initialPlotId = searchParams.get("plotId") ?? undefined;

  return (
    <GISWorkspace
      title="Vẽ GIS cho lô đất"
      roleLabel="SUPERVISOR"
      description="SUP vẽ polygon GIS và lưu tọa độ vào plot tương ứng theo plotId."
      initialPlotId={initialPlotId}
      initialCoordinates={state?.coordinates}
      initialContractNo={state?.contractNo}
    />
  );
}
