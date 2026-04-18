import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import GISWorkspace from "../../../components/custom/gis-workspace";

export default function ZonesPage() {
  const location = useLocation();
  const [initialCoordinates, setInitialCoordinates] = useState<Array<[number, number]> | null>(null);
  const [initialContractNo, setInitialContractNo] = useState<string | null>(null);
  const hasProcessedLocation = useRef(false);

  useEffect(() => {
    if (hasProcessedLocation.current) return;
    hasProcessedLocation.current = true;

    const state = location.state as { coordinates?: Array<[number, number]>; contractNo?: string } | null;
    if (state?.coordinates && Array.isArray(state.coordinates) && state.coordinates.length >= 3) {
      const validCoords = state.coordinates.filter(
        (coord) => Array.isArray(coord) && coord.length === 2 && Number.isFinite(coord[0]) && Number.isFinite(coord[1])
      );
      if (validCoords.length >= 3) {
        setInitialCoordinates(validCoords);
        setInitialContractNo(state.contractNo || null);
      }
    }
  }, [location]);

  return (
    <GISWorkspace
      title="Quản Lý Vùng Trồng"
      roleLabel="ADMIN"
      description="Điều phối dữ liệu GIS toàn hệ thống cho vùng trồng và hợp đồng."
      initialCoordinates={initialCoordinates}
      initialContractNo={initialContractNo}
    />
  );
}
