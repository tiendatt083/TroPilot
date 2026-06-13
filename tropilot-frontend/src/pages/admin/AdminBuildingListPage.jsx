import * as buildingApi from '../../api/buildingApi.js';
import BuildingListWorkspace from '../../components/building/BuildingListWorkspace.jsx';

export default function AdminBuildingListPage() {
  return (
    <BuildingListWorkspace
      getBuildings={buildingApi.getAdminBuildings}
      deleteBuilding={buildingApi.deleteAdminBuilding}
      basePath="/admin/buildings"
      createPath="/admin/buildings/create"
      eyebrow="Administrator"
      title="Building management"
      canManage
    />
  );
}
