import * as buildingApi from '../api/buildingApi.js';
import { STAFF_BUILDING_TABS } from '../config/buildingWorkspaceConfig.js';
import BuildingWorkspaceLayout from './BuildingWorkspaceLayout.jsx';

/** Bọc các trang nghiệp vụ tòa nhà dành cho nhân viên, với quyền hạn phù hợp vai trò STAFF. */
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
