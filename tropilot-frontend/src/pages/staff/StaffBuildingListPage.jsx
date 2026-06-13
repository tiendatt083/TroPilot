import * as buildingApi from '../../api/buildingApi.js';
import BuildingListWorkspace from '../../components/building/BuildingListWorkspace.jsx';

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
