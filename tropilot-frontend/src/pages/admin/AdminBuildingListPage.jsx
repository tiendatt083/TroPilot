import * as buildingApi from '../../features/buildings/api.js';
import { BuildingListWorkspace } from '../../features/buildings/components/index.js';

export default function AdminBuildingListPage() {
  return (
    <BuildingListWorkspace
      getBuildings={buildingApi.getAdminBuildings}
      createBuilding={buildingApi.createAdminBuilding}
      updateBuilding={buildingApi.updateAdminBuilding}
      deleteBuilding={buildingApi.deleteAdminBuilding}
      basePath="/admin/buildings"
      createPath="/admin/buildings/create"
      eyebrow="Administrator"
      title="Building management"
      canManage
    />
  );
}
