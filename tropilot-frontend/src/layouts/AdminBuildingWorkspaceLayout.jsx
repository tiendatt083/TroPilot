import * as buildingApi from '../api/buildingApi.js';
import { ADMIN_BUILDING_TABS } from '../config/buildingWorkspaceConfig.js';
import BuildingWorkspaceLayout from './BuildingWorkspaceLayout.jsx';

/** Bọc các trang nghiệp vụ của một tòa nhà khi quản trị viên đang làm việc trong tòa nhà đó. */
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
