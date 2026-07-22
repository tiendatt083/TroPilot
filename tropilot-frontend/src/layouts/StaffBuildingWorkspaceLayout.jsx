import * as buildingApi from '../api/buildingApi.js';
import { STAFF_BUILDING_TABS } from '../config/buildingWorkspaceConfig.js';
import BuildingWorkspaceLayout from './BuildingWorkspaceLayout.jsx';

export default function StaffBuildingWorkspaceLayout() {
  return (
    <BuildingWorkspaceLayout
      getBuilding={buildingApi.getStaffBuilding}
      listPath="/staff/buildings"
      basePath="/staff/buildings"
      tabs={STAFF_BUILDING_TABS}
    />
  );
}
