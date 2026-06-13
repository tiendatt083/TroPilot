import * as buildingApi from '../../features/buildings/api.js';
import { BuildingListWorkspace } from '../../features/buildings/components/index.js';

export default function StaffBuildingListPage() {
  return (
    <BuildingListWorkspace
      getBuildings={buildingApi.getStaffBuildings}
      basePath="/staff/buildings"
      eyebrow="Operations staff"
      title="Buildings"
    />
  );
}
