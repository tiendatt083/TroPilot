import * as buildingApi from '../api/buildingApi.js';
import { ADMIN_BUILDING_ACTIONS, ADMIN_BUILDING_TABS } from '../config/buildingWorkspaceConfig.js';
import BuildingWorkspaceLayout from './BuildingWorkspaceLayout.jsx';

export default function AdminBuildingWorkspaceLayout() {
  return (
    <BuildingWorkspaceLayout
      getBuilding={buildingApi.getAdminBuilding}
      deleteBuilding={buildingApi.deleteAdminBuilding}
      listPath="/admin/buildings"
      basePath="/admin/buildings"
      tabs={ADMIN_BUILDING_TABS}
      actions={ADMIN_BUILDING_ACTIONS}
    />
  );
}
