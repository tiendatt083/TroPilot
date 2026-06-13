import * as buildingApi from '../features/buildings/api.js';
import { STAFF_BUILDING_ACTIONS, STAFF_BUILDING_TABS } from '../config/buildingWorkspaceConfig.js';
import BuildingWorkspaceLayout from './BuildingWorkspaceLayout.jsx';

export default function StaffBuildingWorkspaceLayout() {
  return (
    <BuildingWorkspaceLayout
      getBuilding={buildingApi.getStaffBuilding}
      listPath="/staff/buildings"
      basePath="/staff/buildings"
      tabs={STAFF_BUILDING_TABS}
      actions={STAFF_BUILDING_ACTIONS}
    />
  );
}
