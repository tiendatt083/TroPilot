import * as buildingApi from '../api/buildingApi.js';
import { ADMIN_BUILDING_TABS } from '../config/buildingWorkspaceConfig.js';
import BuildingWorkspaceLayout from './BuildingWorkspaceLayout.jsx';

export default function AdminBuildingWorkspaceLayout() {
  return (
    <BuildingWorkspaceLayout
      getBuilding={buildingApi.getAdminBuilding}
      listPath="/admin/buildings"
      basePath="/admin/buildings"
      tabs={ADMIN_BUILDING_TABS}
    />
  );
}
