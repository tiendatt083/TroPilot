import * as vehicleApi from '../../api/vehicleApi.js';
import BuildingVehicleWorkspace from '../../components/building/BuildingVehicleWorkspace.jsx';

/** Trang quản lý danh sách và trạng thái xe đăng ký trong tòa nhà. */
export default function AdminBuildingVehiclePage() {
  return <BuildingVehicleWorkspace getVehicles={vehicleApi.getAdminVehicles} canManage />;
}
