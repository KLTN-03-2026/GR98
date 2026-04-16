import GISWorkspace from "@/components/custom/gis-workspace";

export default function SupervisorZonesPage() {
  return (
    <GISWorkspace
      title="Vẽ GIS cho lô đất"
      roleLabel="SUPERVISOR"
      description="SUP vẽ polygon GIS và lưu tọa độ vào plot tương ứng theo plotId."
    />
  );
}

